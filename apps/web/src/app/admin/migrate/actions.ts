"use server"

import { runMigrations } from "@/lib/migrations"

type ActionState = { ok: boolean; message: string }

export async function runMigrationAction(_: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const key = String(formData.get("key") || "")
  const secret = process.env.MIGRATE_KEY || process.env.STACK_SECRET_SERVER_KEY

  if (!secret) {
    return { ok: false, message: "Server is missing MIGRATE_KEY. Add it to your environment and redeploy." }
  }
  if (!key || key !== secret) {
    return { ok: false, message: "Invalid MIGRATE_KEY." }
  }

  try {
    const result = await runMigrations()
    const details = result.applied?.map((a) => `${a.file} (${a.statements} statements)`).join(", ")
    return { ok: true, message: `Migrations applied: ${details}` }
  } catch (err: any) {
    return { ok: false, message: err?.message || "Migration failed" }
  }
}
