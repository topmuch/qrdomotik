import { resolve as resolvePath } from 'node:path'
import { PrismaClient } from '../../node_modules/@prisma/client/index.js'

// Forcer le DATABASE_URL vers la DB parent si non défini
if (!process.env.DATABASE_URL) {
  const dbPath = resolvePath(import.meta.dir, '../../db/custom.db')
  process.env.DATABASE_URL = `file:${dbPath}`
  console.log(`[DB] DATABASE_URL : ${process.env.DATABASE_URL}`)
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
