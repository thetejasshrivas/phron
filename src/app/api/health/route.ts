// Route handlers: https://nextjs.org/docs/app/api-reference/file-conventions/route
export const dynamic = "force-dynamic";
/** Liveness only: no environment, version, database, provider or user diagnostics. */
export function GET() {
  return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
