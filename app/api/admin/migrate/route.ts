import { runMigrations } from "@/lib/migrations"

function checkAuth(request: Request): { ok: boolean; reason?: string } {
  const secret = process.env.MIGRATE_KEY || process.env.STACK_SECRET_SERVER_KEY
  if (!secret) return { ok: false, reason: "No MIGRATE_KEY (or STACK_SECRET_SERVER_KEY) is set on the server." }

  const url = new URL(request.url)
  const key = url.searchParams.get("key") || request.headers.get("x-migrate-key")
  if (!key) return { ok: false, reason: "Missing ?key=... or X-Migrate-Key header." }
  if (key !== secret) return { ok: false, reason: "Invalid key." }
  return { ok: true }
}

export async function GET(request: Request) {
  // Route Handlers require manual auth/CSRF protection; we validate a secret key here [^1].
  const auth = checkAuth(request)
  if (!auth.ok) return new Response(auth.reason ?? "Unauthorized", { status: 401 })

  try {
    const result = await runMigrations()
    return Response.json({ ok: true, ...result })
  } catch (err: any) {
    return Response.json({ ok: false, error: err?.message || "Migration failed" }, { status: 500 })
  }
}
