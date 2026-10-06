// Unguessable human-friendly codes (no 0/O/1/I), from the browser CSPRNG.
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function randomCode(length = 8, prefix = "NEL-") {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return prefix + Array.from(bytes, (b) => CHARS[b % CHARS.length]).join("");
}
