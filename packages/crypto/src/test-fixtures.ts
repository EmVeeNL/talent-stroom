// Synthetic fixtures shared by the tests. No real keys or personal data.
import type { RecordContext } from "./envelope.ts";
import { createLocalKms, type LocalKms } from "./local-kms.ts";

export const ORG_A = "0b6a4a52-1111-4aaa-8aaa-000000000001";
export const ORG_B = "0b6a4a52-2222-4bbb-8bbb-000000000002";
export const RECORD_1 = "5c0ffee0-0000-4000-8000-000000000001";
export const RECORD_2 = "5c0ffee0-0000-4000-8000-000000000002";
export const KEK_A = "test/org-a";
export const KEK_B = "test/org-b";
export const ENVIRONMENT = "test";

export function context(overrides: Partial<RecordContext> = {}): RecordContext {
  return {
    organizationId: ORG_A,
    recordType: "candidate_private",
    recordId: RECORD_1,
    schemaVersion: 1,
    ...overrides,
  };
}

export async function setup(): Promise<{ kms: LocalKms; deps: { kms: LocalKms; environment: string } }> {
  const kms = await createLocalKms({ environment: ENVIRONMENT });
  return { kms, deps: { kms, environment: ENVIRONMENT } };
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** True when `needle` occurs as a contiguous byte sequence in `haystack`. */
export function containsBytes(haystack: Uint8Array, needle: Uint8Array): boolean {
  outer: for (let i = 0; i + needle.byteLength <= haystack.byteLength; i++) {
    for (let j = 0; j < needle.byteLength; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return true;
  }
  return false;
}

/** Flips one bit of a copy. */
export function flipBit(bytes: Uint8Array, index: number): Uint8Array {
  const copy = bytes.slice();
  copy[index] = (copy[index] ?? 0) ^ 0x01;
  return copy;
}
