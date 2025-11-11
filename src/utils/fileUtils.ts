/**
 * fileUtils.ts
 * 
 * Utility functions for file operations including SHA-256 hash calculation.
 * Used for generating unique file identifiers (shaCode) for resume upload functionality.
 */

/**
 * calculateFileSHA256
 * Calculates the SHA-256 hash of a file for unique identification.
 * Used for breakpoint resume functionality.
 * 
 * @param file - The file to calculate hash for
 * @returns Promise<string> - The SHA-256 hash as hex string
 */
export async function calculateFileSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * calculateFilePartialSHA256
 * Calculates SHA-256 hash of first and last chunks of file for faster identification.
 * Used when full file hash would be too slow.
 * 
 * @param file - The file to calculate hash for
 * @param chunkSize - Size of chunks to read (default 1MB)
 * @returns Promise<string> - The SHA-256 hash as hex string
 */
export async function calculateFilePartialSHA256(file: File, chunkSize: number = 1024 * 1024): Promise<string> {
  const size = file.size;
  const chunks: ArrayBuffer[] = [];

  // Read first chunk
  if (size > 0) {
    const firstChunk = await file.slice(0, Math.min(chunkSize, size)).arrayBuffer();
    chunks.push(firstChunk);
  }

  // Read last chunk if file is larger than one chunk
  if (size > chunkSize) {
    const lastChunk = await file.slice(Math.max(0, size - chunkSize), size).arrayBuffer();
    chunks.push(lastChunk);
  }

  // Combine chunks and hash
  const combined = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0));
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(new Uint8Array(chunk), offset);
    offset += chunk.byteLength;
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
