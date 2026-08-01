const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1_000;
export const PASSWORD_ITERATIONS = 100_000;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function randomToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

export interface PasswordDigest {
  hash: string;
  salt: string;
  iterations: number;
}

async function derivePassword(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt.buffer as ArrayBuffer, iterations },
    key,
    256,
  );
  return bytesToBase64Url(new Uint8Array(bits));
}

export async function hashPassword(password: string): Promise<PasswordDigest> {
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  return {
    hash: await derivePassword(password, saltBytes, PASSWORD_ITERATIONS),
    salt: bytesToBase64Url(saltBytes),
    iterations: PASSWORD_ITERATIONS,
  };
}

export async function verifyPassword(
  password: string,
  expectedHash: string,
  salt: string,
  iterations: number,
): Promise<boolean> {
  const actual = await derivePassword(password, base64UrlToBytes(salt), iterations);
  const encoder = new TextEncoder();
  const [actualDigest, expectedDigest] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(actual)),
    crypto.subtle.digest("SHA-256", encoder.encode(expectedHash)),
  ]);
  const actualBytes = new Uint8Array(actualDigest);
  const expectedBytes = new Uint8Array(expectedDigest);
  let difference = 0;
  for (let index = 0; index < actualBytes.length; index += 1) {
    difference |= (actualBytes[index] ?? 0) ^ (expectedBytes[index] ?? 0);
  }
  return difference === 0;
}

export function sessionExpiry(now = Date.now()): number {
  return now + SESSION_TTL_MS;
}

function cookieScope(requestUrl: string): string[] {
  const hostname = new URL(requestUrl).hostname.toLocaleLowerCase("en-US");
  const production = hostname === "fireflydle.games" || hostname.endsWith(".fireflydle.games");
  return production ? ["Secure", "Domain=.fireflydle.games"] : [];
}

export function sessionCookie(token: string, expiresAt: number, requestUrl: string): string {
  const maxAge = Math.max(0, Math.floor((expiresAt - Date.now()) / 1_000));
  return [
    `fireflydle_session=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
    ...cookieScope(requestUrl),
  ].join("; ");
}

export function clearSessionCookie(requestUrl: string): string {
  return [
    "fireflydle_session=",
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    ...cookieScope(requestUrl),
  ].join("; ");
}
