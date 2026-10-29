import { describe, expect, it } from "vitest";
import { checkPrecondition, formatETag, parseIfMatch } from "./etag.ts";

describe("strong version ETags", () => {
  it.each([0, 1, 42, Number.MAX_SAFE_INTEGER])("formats version %j", (version) => {
    expect(formatETag(version)).toBe(`"v${version}"`);
  });

  it.each([-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])("rejects invalid versions %j", (version) => {
    expect(() => formatETag(version)).toThrow(RangeError);
  });
});

describe("If-Match parsing", () => {
  it("parses single tags and lists with HTTP whitespace", () => {
    expect(parseIfMatch('"v1"')).toEqual({ ok: true, kind: "tags", tags: ['"v1"'] });
    expect(parseIfMatch(' \t"v1", "v2"\t ')).toEqual({ ok: true, kind: "tags", tags: ['"v1"', '"v2"'] });
  });

  it("preserves opaque tag contents, including commas, and tolerates empty list members", () => {
    expect(parseIfMatch(', "other,tag",, "v2",')).toEqual({ ok: true, kind: "tags", tags: ['"other,tag"', '"v2"'] });
    expect(parseIfMatch('""')).toEqual({ ok: true, kind: "tags", tags: ['""'] });
  });

  it("parses a standalone wildcard", () => {
    expect(parseIfMatch(" \t* ")).toEqual({ ok: true, kind: "any" });
  });

  it.each([
    'W/"v1"',
    'W/"v1", "v2"',
    '"v1", W/"v2"',
    '* , "v1"',
    "",
    ",,",
    "v1",
    '"v1" "v2"',
    '"v1",junk',
    '"v 1"',
    '"v1"\n',
    '"unterminated',
  ])("rejects weak or malformed conditions %j", (header) => {
    expect(parseIfMatch(header)).toEqual({ ok: false, error: "invalid_if_match" });
  });
});

describe("mutation preconditions", () => {
  it.each([undefined, null])("requires a header when missing (%j)", (header) => {
    expect(checkPrecondition(header, 2)).toEqual({ ok: false, status: 428 });
  });

  it.each(['"v2"', '"v1", "v2"', "*"])("accepts a matching condition %j", (header) => {
    expect(checkPrecondition(header, 2)).toEqual({ ok: true });
  });

  it.each(['"v1"', '"v1", "v3"', 'W/"v2"', 'W/"v1", "v2"', '"v02"', "", "garbage"])("fails closed for %j", (header) => {
    expect(checkPrecondition(header, 2)).toEqual({ ok: false, status: 412 });
  });
});
