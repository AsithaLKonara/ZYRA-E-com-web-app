import { PrismaClient } from "@prisma/client"
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let db: PrismaClient

if (process.env.NODE_ENV === 'production') {
  const connectionString = process.env.DATABASE_URL

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)

  db = new PrismaClient({
    adapter,
    log: ['error'],
    errorFormat: 'pretty',
  })
} else {
  db = globalForPrisma.prisma ?? new PrismaClient({
    log: ['query', 'error', 'warn'],
    errorFormat: 'pretty',
  })

  if (!globalForPrisma.prisma) globalForPrisma.prisma = db
}

export { db }

// Graceful shutdown
process.on('beforeExit', async () => {
  await db.$disconnect()
})

process.on('SIGINT', async () => {
  await db.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await db.$disconnect()
  process.exit(0)
})
