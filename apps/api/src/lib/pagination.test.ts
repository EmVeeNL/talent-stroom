import { describe, expect, it } from "vitest";
import { buildPage, decodeCursor, encodeCursor, parsePageParams } from "./pagination.ts";

const first = { createdAt: "2026-01-01T12:00:00.123456Z", id: "00000000-0000-4000-8000-000000000001" };
const second = { ...first, id: "00000000-0000-4000-8000-000000000002" };
const third = { ...first, id: "00000000-0000-4000-8000-000000000003" };

async function signingKey() {
  return crypto.subtle.importKey(
    "raw",
    crypto.getRandomValues(new Uint8Array(32)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function base64url(text: string) {
  return btoa(text).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

async function signPayload(payload: unknown, key: CryptoKey) {
  const encoded = base64url(JSON.stringify(payload));
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encoded));
  return `${encoded}.${base64url(String.fromCharCode(...new Uint8Array(signature)))}`;
}

describe("page parameters", () => {
  it("defaults to 25 and preserves an optional opaque cursor", () => {
    expect(parsePageParams({})).toEqual({ ok: true, limit: 25 });
    expect(parsePageParams({ limit: "1", cursor: "opaque" })).toEqual({ ok: true, limit: 1, cursor: "opaque" });
    expect(parsePageParams({ limit: "100" })).toEqual({ ok: true, limit: 100 });
  });

  it.each(["0", "101", "-1", "1.5", "", " 25", "1e2", "25junk", "Infinity", ["1", "2"], 25])(
    "rejects an invalid limit %j instead of clamping",
    (limit) => {
      expect(parsePageParams({ limit })).toEqual({ ok: false, error: { code: "invalid_limit" } });
    },
  );

  it.each(["", ["a", "b"], 1, "a".repeat(513)])("rejects invalid cursor parameters %j", (cursor) => {
    expect(parsePageParams({ cursor })).toEqual({ ok: false, error: { code: "invalid_cursor" } });
  });
});

describe("signed keyset cursors", () => {
  it("round trips only the timestamp and UUID, retaining sub-millisecond precision", async () => {
    const key = await signingKey();
    const row = { ...first, privateField: "synthetic" };
    const cursor = await encodeCursor(row, key);
    expect(cursor).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(await decodeCursor(cursor, key)).toEqual({ ok: true, key: first });
    const payload = cursor.split(".")[0] ?? "";
    expect(JSON.parse(atob(payload.replaceAll("-", "+").replaceAll("_", "/")))).toEqual({ v: 1, ...first });
  });

  it("rejects tampering with the payload or signature and the wrong key", async () => {
    const key = await signingKey();
    const cursor = await encodeCursor(first, key);
    const [payload, signature] = cursor.split(".");
    const changedSignature = `${signature?.startsWith("A") ? "B" : "A"}${signature?.slice(1)}`;
    const invalidCursors = [
      `${base64url(JSON.stringify({ v: 1, ...second }))}.${signature}`,
      `${payload}.${changedSignature}`,
    ];
    const results = await Promise.all(invalidCursors.map((invalid) => decodeCursor(invalid, key)));
    expect(results).toEqual(invalidCursors.map(() => ({ ok: false, error: { code: "invalid_cursor" } })));
    expect(await decodeCursor(cursor, await signingKey())).toEqual({ ok: false, error: { code: "invalid_cursor" } });
  });

  it.each(["", "%%%.$$$", "a.b", "e30=.AAAA", "e30.AAAA", "e30.AAAA.extra", "a".repeat(513)])(
    "rejects malformed or unsigned cursors %j",
    async (cursor) => {
      expect(await decodeCursor(cursor, await signingKey())).toEqual({ ok: false, error: { code: "invalid_cursor" } });
    },
  );

  it.each([
    { v: 2, ...first },
    { v: 1, ...first, extra: "synthetic" },
    { v: 1, ...first, id: "not-a-uuid" },
    { v: 1, ...first, createdAt: "2026-02-30T00:00:00Z" },
    { v: 1, ...first, createdAt: "2026-01-01" },
    { v: 1, id: first.id },
    null,
  ])("strictly validates even correctly signed payloads %j", async (payload) => {
    const key = await signingKey();
    expect(await decodeCursor(await signPayload(payload, key), key)).toEqual({
      ok: false,
      error: { code: "invalid_cursor" },
    });
  });

  it("does not encode an invalid database key", async () => {
    await expect(encodeCursor({ ...first, id: "invalid" }, await signingKey())).rejects.toThrow("Invalid cursor key");
  });
});

describe("page construction", () => {
  it("uses the last returned row, excluding the lookahead row and personal fields", async () => {
    const key = await signingKey();
    const items = [
      { ...first, label: "synthetic" },
      { ...second, label: "synthetic" },
      { ...third, label: "synthetic" },
    ];
    const page = await buildPage(items, 2, (row) => row, key);
    expect(page.data).toEqual(items.slice(0, 2));
    expect(items).toHaveLength(3);
    expect(await decodeCursor(page.nextCursor ?? "", key)).toEqual({ ok: true, key: second });
  });

  it("returns null for empty or final pages, including an exact limit", async () => {
    const key = await signingKey();
    const pages = [[], [first], [first, second]];
    const results = await Promise.all(pages.map((items) => buildPage(items, 2, (row) => row, key)));
    expect(results).toEqual(pages.map((items) => ({ data: items, nextCursor: null })));
  });

  it.each([0, 101, 1.5, NaN])("rejects invalid internal limits %j", async (limit) => {
    await expect(buildPage([first], limit, (row) => row, await signingKey())).rejects.toThrow(RangeError);
  });
});
