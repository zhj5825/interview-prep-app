// Database wrapper using Prisma (Postgres).
// In-memory mode has been removed; a real database is required.

type Submission = {
  id: string
  question: string
  explanation: string
  createdAt: Date
}

let prismaClient: any | null = null
let prismaTried = false

async function getPrisma(): Promise<any> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Configure a Postgres database to enable persistence.')
  }
  if (prismaTried) return prismaClient
  prismaTried = true
  try {
    const mod = await import('@prisma/client')
    const { PrismaClient } = mod as any
    // @ts-ignore
    if (!(global as any).prisma) {
      // @ts-ignore
      ;(global as any).prisma = new PrismaClient()
    }
    // @ts-ignore
    prismaClient = (global as any).prisma
    return prismaClient
  } catch (e) {
    console.error('Failed to initialize Prisma Client:', e)
    throw new Error('Prisma Client not available. Install @prisma/client and set DATABASE_URL.')
  }
}

// In-memory fallback
const memoryStore: Submission[] = []

export const db = {
  async saveSubmission(input: { question: string; explanation: string }): Promise<Submission> {
    const prisma = await getPrisma()
    const row = await prisma.submission.create({
      data: { question: input.question, explanation: input.explanation },
    })
    return { ...row, createdAt: new Date(row.createdAt) }
  },

  async listSubmissions(limit = 20): Promise<Submission[]> {
    const prisma = await getPrisma()
    const rows = await prisma.submission.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return rows.map((r: any) => ({ ...r, createdAt: new Date(r.createdAt) }))
  },

  async getSubmission(id: string): Promise<Submission | null> {
    const prisma = await getPrisma()
    const row = await prisma.submission.findUnique({ where: { id } })
    return row ? { ...row, createdAt: new Date(row.createdAt) } : null
  },
}

export type { Submission }
