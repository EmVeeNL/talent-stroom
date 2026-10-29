export type IfMatchResult =
  | { ok: true; kind: "any" }
  | { ok: true; kind: "tags"; tags: string[] }
  | { ok: false; error: "invalid_if_match" };

export type PreconditionResult = { ok: true } | { ok: false; status: 428 | 412 };

/** Set an ETag on a row representation using its nonnegative safe integer version.
 * Every change to that representation must increment the version for this tag to remain strong.
 */
export function formatETag(version: number): string {
  if (!Number.isSafeInteger(version) || version < 0) {
    throw new RangeError("Row version must be a nonnegative safe integer");
  }
  return `"v${version}"`;
}

/** Parse a route's If-Match header as standalone `*` or a list of strong opaque tags.
 * Reject weak tags (including mixed lists). Commas inside quoted tags are part of the tag.
 */
export function parseIfMatch(header: string): IfMatchResult {
  const value = header.replace(/^[ \t]+|[ \t]+$/g, "");
  if (value === "*") return { ok: true, kind: "any" };

  const tags: string[] = [];
  // RFC 9110 etagc: %x21 / %x23-7E / obs-text. Entity tags have no escape syntax.
  const member = /[ \t]*(?:"[\x21\x23-\x7e\x80-\xff]*")?[ \t]*(?:,|$)/gy;
  let offset = 0;
  while (offset < value.length) {
    const match = member.exec(value);
    if (!match || member.lastIndex <= offset) return { ok: false, error: "invalid_if_match" };
    const tag = match[0].match(/"[\x21\x23-\x7e\x80-\xff]*"/);
    if (tag) tags.push(tag[0]);
    offset = member.lastIndex;
  }
  return tags.length > 0 ? { ok: true, kind: "tags", tags } : { ok: false, error: "invalid_if_match" };
}

/** Check a mutating request after loading an authorized, existing row.
 * Missing headers return 428; malformed/weak/nonmatching conditions return 412. `*` matches existence.
 * Still update atomically with `WHERE version = currentVersion` to prevent races after this check;
 * map a failed database version check to 412 in the route's problem-response integration.
 */
export function checkPrecondition(
  ifMatchHeader: string | null | undefined,
  currentVersion: number,
): PreconditionResult {
  const currentTag = formatETag(currentVersion);
  if (ifMatchHeader === null || ifMatchHeader === undefined) return { ok: false, status: 428 };
  const condition = parseIfMatch(ifMatchHeader);
  if (condition.ok && (condition.kind === "any" || condition.tags.includes(currentTag))) {
    return { ok: true };
  }
  return { ok: false, status: 412 };
}
