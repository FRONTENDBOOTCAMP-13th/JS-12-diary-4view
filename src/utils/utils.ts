// utils/utils.ts
/**
 * 지정된 길이의 랜덤 문자열 생성
 */
export function generateRandomString(length: number): string {
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values)
    .map(x => possible[x % possible.length])
    .join('');
}
