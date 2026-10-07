export function trustedOrigin(value: string | undefined): string {
  if (!value) throw new Error('APP_ORIGIN_REQUIRED');
  const url = new URL(value);
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash ||
      (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)))) {
    throw new Error('INVALID_APP_ORIGIN');
  }
  return url.origin;
}
export function sameOriginMutation(headers: Headers, origin: string): boolean {
  return headers.get('origin') === origin && headers.get('sec-fetch-site') !== 'cross-site';
}
