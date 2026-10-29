import { NormalizationError } from "./errors.ts";

const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_INPUT_LENGTH = 64;
// Whitespace, control characters and characters that cannot appear unquoted in an address.
const EMAIL_FORBIDDEN = /[\s\p{Cc}\p{Cf}"(),:;<>[\\\]]/u;

/**
 * Normalizes an email address for blind indexing: trim, Unicode NFC, lowercase (locale-independent).
 * Also checks a minimal shape: exactly one `@`, non-empty local part and a dotted domain, no
 * whitespace, control or format characters, at most 254 characters.
 *
 * Deliberately not done: provider-specific rules (Gmail dot or `+tag` stripping), IDNA/punycode
 * conversion (`bücher.nl` and `xn--bcher-kva.nl` index differently), quoted local parts. Lowercasing
 * the local part is a product choice: mailbox local parts are case-sensitive in theory, but not in
 * practice.
 *
 * The result is personal data: never log it.
 *
 * @throws {NormalizationError} when the value is not a plausible email address.
 */
export function normalizeEmail(input: string): string {
  if (typeof input !== "string") throw new NormalizationError("email");
  const value = input.trim().normalize("NFC").toLowerCase();
  if (value.length === 0 || value.length > MAX_EMAIL_LENGTH || EMAIL_FORBIDDEN.test(value)) {
    throw new NormalizationError("email");
  }
  const at = value.indexOf("@");
  if (at <= 0 || at !== value.lastIndexOf("@")) throw new NormalizationError("email");
  const domain = value.slice(at + 1);
  const labels = domain.split(".");
  if (labels.length < 2 || labels.some((label) => label.length === 0 || label.startsWith("-") || label.endsWith("-"))) {
    throw new NormalizationError("email");
  }
  return value;
}

/**
 * Normalizes a phone number to E.164 (`+<digits>`) for blind indexing, without libphonenumber.
 *
 * Accepted (after removing spaces, `-`, `.`, `/`, parentheses, and a trunk `(0)` after an
 * international prefix):
 * - Dutch numbers: `+31` / `0031` followed by 9 digits, national `0` followed by 9 digits
 *   (e.g. `06 12345678`, `020-1234567`), and the common mistake `+31 06...` → `+316...`.
 *   Output `+31` + 9 digits.
 * - Other countries: `+` or `00` followed by 8–15 digits, first digit 1–9. Taken as given; the
 *   country-specific length and trunk-prefix rules are not checked.
 *
 * Rejected: letters, extensions, numbers without an international or Dutch national prefix
 * (ambiguous), Dutch numbers that are not 9 national digits (including 0800/0900 service numbers
 * with other lengths and 097 M2M numbers), and anything longer than 64 input characters. Normalize
 * the same way at write and search time, or lookups miss.
 *
 * The result is personal data: never log it.
 *
 * @throws {NormalizationError} when the number cannot be normalized confidently.
 */
export function normalizePhone(input: string): string {
  if (typeof input !== "string") throw new NormalizationError("phone");
  let value = input.normalize("NFKC").trim();
  if (value.length === 0 || value.length > MAX_PHONE_INPUT_LENGTH) throw new NormalizationError("phone");

  const international = value.startsWith("+") || value.startsWith("00");
  // "+31 (0)6 ..." — the "(0)" is a trunk prefix that is dropped when dialling internationally.
  if (international) value = value.replace(/\(\s*0\s*\)/g, "");
  value = value.replace(/[\s \-./()]/g, "");

  if (value.startsWith("+")) value = value.slice(1);
  else if (value.startsWith("00")) value = value.slice(2);
  else if (!value.startsWith("0")) throw new NormalizationError("phone");
  if (!/^\d+$/.test(value)) throw new NormalizationError("phone");

  if (!international) {
    // Dutch national format: trunk "0" + 9 digits, first digit after the trunk 1-9.
    if (!/^0[1-9]\d{8}$/.test(value)) throw new NormalizationError("phone");
    return `+31${value.slice(1)}`;
  }
  if (value.startsWith("31")) {
    let national = value.slice(2);
    if (/^0[1-9]\d{8}$/.test(national)) national = national.slice(1);
    if (!/^[1-9]\d{8}$/.test(national)) throw new NormalizationError("phone");
    return `+31${national}`;
  }
  if (!/^[1-9]\d{7,14}$/.test(value)) throw new NormalizationError("phone");
  return `+${value}`;
}
