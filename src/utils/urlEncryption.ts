// Simple encryption/decryption utilities for URL parameters
// Using Base64 encoding with a simple cipher for basic obfuscation

const SECRET_KEY = 'seefu_tv_encrypt_key_2024'; // Change this to a more secure key

export function encryptUrl(url: string): string {
  try {
    // Simple XOR cipher with Base64 encoding
    const key = SECRET_KEY;
    let encrypted = '';
    
    for (let i = 0; i < url.length; i++) {
      const keyChar = key.charCodeAt(i % key.length);
      const urlChar = url.charCodeAt(i);
      encrypted += String.fromCharCode(urlChar ^ keyChar);
    }
    
    // Base64 encode the result and make it URL safe
    return btoa(encrypted)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  } catch (error) {
    console.error('Encryption error:', error);
    return btoa(url).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
}

export function decryptUrl(encryptedUrl: string): string {
  try {
    // Add padding back and convert URL-safe Base64 back to standard
    const padded = encryptedUrl + '='.repeat((4 - encryptedUrl.length % 4) % 4);
    const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
    
    const encrypted = atob(base64);
    const key = SECRET_KEY;
    let decrypted = '';
    
    for (let i = 0; i < encrypted.length; i++) {
      const keyChar = key.charCodeAt(i % key.length);
      const encChar = encrypted.charCodeAt(i);
      decrypted += String.fromCharCode(encChar ^ keyChar);
    }
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    // Fallback: try simple Base64 decode
    try {
      const padded = encryptedUrl + '='.repeat((4 - encryptedUrl.length % 4) % 4);
      const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
      return atob(base64);
    } catch {
      return '';
    }
  }
}