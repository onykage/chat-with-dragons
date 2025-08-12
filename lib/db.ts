import { neon } from "@neondatabase/serverless"

let sql: ReturnType<typeof neon> | null = null

export function getDb() {
  if (!process.env.DATABASE_URL) {
    console.warn("No DATABASE_URL found, database operations will be skipped")
    return null
  }

  if (!sql) {
    sql = neon(process.env.DATABASE_URL)
  }

  return sql
}

// Memory store for fallback when database is not available
export const memoryStore = {
  maps: new Map<string, any>(),

  list() {
    return Array.from(this.maps.values())
  },

  get(id: string) {
    return this.maps.get(id) || null
  },

  save(data: any) {
    this.maps.set(data.id, data)
  },

  delete(id: string) {
    return this.maps.delete(id)
  },
}
