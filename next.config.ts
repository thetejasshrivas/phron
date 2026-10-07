import type { NextConfig } from "next";

// Pin only the public origin, never credentials, into each immutable Preview.
// Trust the platform build variable, not request Host or forwarding headers.
let previewOrigin: string | undefined;
if (process.env.VERCEL_ENV === "preview") {
  const host = process.env.VERCEL_URL ?? "";
  if (!/^phron-[a-z0-9-]+-tts-1e31\.vercel\.app$/.test(host)) {
    throw new Error("Trusted PHRON Preview hostname required.");
  }
  previewOrigin = `https://${host}`;
}
const config: NextConfig = {
  poweredByHeader: false,
  ...(previewOrigin ? { env: { PHRON_APP_ORIGIN: previewOrigin } } : {}),
};
export default config;
