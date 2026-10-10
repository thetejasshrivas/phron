const MAX_RAW_CHARACTERS = 280;
const SCRIPT_ELEMENT = /<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi;
const SCRIPT_TAG = /<\s*\/?\s*script\b[^>]*>/i;

/** Bounds and sanitizes untrusted capture text before any provider or parser sees it. */
export function sanitizeCaptureText(value: unknown): string {
  if (typeof value !== 'string' || Array.from(value).length > MAX_RAW_CHARACTERS) {
    throw new TypeError('VALIDATION');
  }
  const withoutControls = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
  const withoutScriptContent = withoutControls.replace(SCRIPT_ELEMENT, ' ');
  if (SCRIPT_TAG.test(withoutScriptContent)) throw new TypeError('VALIDATION');
  return withoutScriptContent.trim();
}
