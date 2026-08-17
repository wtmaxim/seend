import { createHash, randomBytes, timingSafeEqual } from "node:crypto"

const KEY_PREFIX = "seend_"
const KEY_BYTES = 32

export function generateApiKey(): { key: string; hash: string; hint: string } {
  const key = KEY_PREFIX + randomBytes(KEY_BYTES).toString("base64url")
  return { key, hash: hashApiKey(key), hint: key.slice(0, KEY_PREFIX.length + 6) }
}

// Plain sha256 rather than a slow KDF: the key is 256 bits of CSPRNG output,
// so there is no dictionary to brute-force and no benefit to key stretching.
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex")
}

export function isApiKeyFormat(value: string): boolean {
  return value.startsWith(KEY_PREFIX) && value.length > KEY_PREFIX.length + 20
}

export function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a)
  const bufferB = Buffer.from(b)
  if (bufferA.length !== bufferB.length) return false
  return timingSafeEqual(bufferA, bufferB)
}
