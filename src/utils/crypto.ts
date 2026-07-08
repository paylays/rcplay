/**
 * Hash utility for voucher code verification
 */
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message.toUpperCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Load pre-computed hashes from environment variables injected by Vite
const rawHashes = import.meta.env.VITE_VALID_CODE_HASHES || '';
export const VALID_CODE_HASHES: string[] = rawHashes
  .split(',')
  .map((h: string) => h.trim().toLowerCase())
  .filter((h: string) => h.length > 0);
