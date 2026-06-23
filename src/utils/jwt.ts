export function decodeJwt<T = Record<string, unknown>>(token: string): T {
  const payload = token.split('.')[1];
  if (!payload) throw new Error('Invalid JWT');

  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

  const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
  const decoded = new TextDecoder().decode(bytes);
  return JSON.parse(decoded) as T;
}