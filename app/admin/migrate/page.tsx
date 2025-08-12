"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { runMigrationAction } from "./actions"

type ActionState = { ok: boolean; message: string }

export default function MigratePage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(runMigrationAction, {
    ok: false,
    message: "",
  })

  return (
    <main className="min-h-[100svh] bg-background">
      <div className="max-w-lg mx-auto p-6">
        <h1 className="text-xl font-semibold">Database Migration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set the DATABASE_URL and MIGRATE_KEY environment variables, then run the migration.
        </p>
        <Card className="mt-4 p-4">
          <form action={formAction} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">MIGRATE_KEY</label>
              <Input name="key" placeholder="Enter your MIGRATE_KEY" />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Running..." : "Run Migration"}
            </Button>
          </form>
          {state?.message && (
            <div className={`mt-3 text-sm ${state.ok ? "text-green-600" : "text-red-600"}`}>{state.message}</div>
          )}
          <div className="mt-4 text-xs text-muted-foreground space-y-1">
            <p>Tip: Remove MIGRATE_KEY after a successful run.</p>
          </div>
        </Card>
      </div>
    </main>
  )
}
