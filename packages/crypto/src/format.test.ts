import { describe, expect, it } from "vitest";
import { decryptRecord, encryptRecord } from "./envelope.ts";
import { EnvelopeFormatError } from "./errors.ts";
import { type EncryptedEnvelope, parseEnvelope, serializeEnvelope } from "./format.ts";
import { KEK_A, context, setup } from "./test-fixtures.ts";

async function sample(): Promise<{
  envelope: EncryptedEnvelope;
  bytes: Uint8Array;
  deps: Awaited<ReturnType<typeof setup>>["deps"];
}> {
  const { deps } = await setup();
  const envelope = await encryptRecord(context(), { email: "test@example.nl" }, { ...deps, kekRef: KEK_A });
  return { envelope, bytes: serializeEnvelope(envelope), deps };
}

function withByte(bytes: Uint8Array, index: number, value: number): Uint8Array {
  const copy = bytes.slice();
  copy[index] = value;
  return copy;
}

describe("serializeEnvelope / parseEnvelope", () => {
  it("round-trips and stays decryptable", async () => {
    const { envelope, bytes, deps } = await sample();
    expect(bytes[0]).toBe(1);
    const parsed = parseEnvelope(bytes);
    expect(parsed).toEqual(envelope);
    await expect(decryptRecord(context(), parsed, deps)).resolves.toMatchObject({ kind: "json" });
  });

  it("has the documented layout", async () => {
    const { envelope, bytes } = await sample();
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    expect(view.getUint8(1)).toBe(1);
    expect(view.getUint32(2)).toBe(envelope.keyVersion);
    expect(view.getUint16(6)).toBe(KEK_A.length);
    expect(new TextDecoder().decode(bytes.subarray(8, 8 + KEK_A.length))).toBe(KEK_A);
    const expectedLength =
      1 + 1 + 4 + 2 + KEK_A.length + 2 + envelope.wrappedDek.byteLength + 12 + 4 + envelope.ciphertext.byteLength;
    expect(bytes.byteLength).toBe(expectedLength);
  });

  it("rejects unknown format versions and algorithm ids", async () => {
    const { bytes } = await sample();
    for (const v of [0, 2, 255]) expect(() => parseEnvelope(withByte(bytes, 0, v))).toThrow(EnvelopeFormatError);
    for (const a of [0, 2]) expect(() => parseEnvelope(withByte(bytes, 1, a))).toThrow(EnvelopeFormatError);
  });

  it("rejects trailing bytes", async () => {
    const { bytes } = await sample();
    const longer = new Uint8Array(bytes.byteLength + 1);
    longer.set(bytes);
    expect(() => parseEnvelope(longer)).toThrow(EnvelopeFormatError);
  });

  it("rejects every truncation", async () => {
    const { bytes } = await sample();
    for (let length = 0; length < bytes.byteLength; length++) {
      expect(() => parseEnvelope(bytes.slice(0, length))).toThrow(EnvelopeFormatError);
    }
  });

  it("rejects out-of-range or inconsistent length fields and key version 0", async () => {
    const { bytes, envelope } = await sample();
    const kekEnd = 8 + KEK_A.length;
    const wrappedEnd = kekEnd + 2 + envelope.wrappedDek.byteLength;
    const ctLengthOffset = wrappedEnd + 12;
    const mutate = (fn: (view: DataView) => void) => {
      const copy = bytes.slice();
      fn(new DataView(copy.buffer));
      return copy;
    };
    const cases = [
      mutate((v) => v.setUint32(2, 0)), // keyVersion 0
      mutate((v) => v.setUint16(6, 0)), // empty kekRef
      mutate((v) => v.setUint16(6, 257)), // kekRef too long
      mutate((v) => v.setUint16(6, KEK_A.length + 1)), // shifts everything
      mutate((v) => v.setUint16(kekEnd, 0)), // empty wrapped DEK
      mutate((v) => v.setUint16(kekEnd, 1025)), // wrapped DEK too long
      mutate((v) => v.setUint32(ctLengthOffset, envelope.ciphertext.byteLength - 1)), // trailing byte
      mutate((v) => v.setUint32(ctLengthOffset, envelope.ciphertext.byteLength + 1)), // truncated
      mutate((v) => v.setUint32(ctLengthOffset, 16)), // shorter than kind byte + tag
      mutate((v) => v.setUint8(8, 0x20)), // space in kekRef
      mutate((v) => v.setUint8(8, 0xff)), // invalid UTF-8 in kekRef
    ];
    for (const input of cases) expect(() => parseEnvelope(input)).toThrow(EnvelopeFormatError);
  });

  it("rejects non-byte input and invalid envelope objects on serialize", async () => {
    const { envelope } = await sample();
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- deliberately invalid input
    expect(() => parseEnvelope("AQ==" as unknown as Uint8Array)).toThrow(EnvelopeFormatError);
    expect(() => serializeEnvelope({ ...envelope, nonce: new Uint8Array(16) })).toThrow(EnvelopeFormatError);
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- deliberately invalid input
    expect(() => serializeEnvelope({ ...envelope, formatVersion: 2 as unknown as 1 })).toThrow(EnvelopeFormatError);
  });

  it("copies input: later mutation of the source does not change the parsed envelope", async () => {
    const { bytes, envelope } = await sample();
    const parsed = parseEnvelope(bytes);
    bytes.fill(0);
    expect(parsed).toEqual(envelope);
  });
});
