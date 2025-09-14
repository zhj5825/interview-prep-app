// Database wrapper using Prisma (Postgres).
// In-memory mode has been removed; a real database is required.

import { PrismaClient, Submission as PrismaSubmission } from '@prisma/client'

export type Submission = PrismaSubmission

declare global {
   
  var prisma: PrismaClient | undefined
}

function getClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Configure a Postgres database to enable persistence.')
  }
  const existing = globalThis.prisma
  if (existing) return existing
  const client = new PrismaClient()
  if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = client
  }
  return client
}

export const db = {
  async saveSubmission(input: { question: string; explanation: string }): Promise<Submission> {
    const prisma = getClient()
    return prisma.submission.create({
      data: { question: input.question, explanation: input.explanation },
    })
  },

  async listSubmissions(limit = 20): Promise<Submission[]> {
    const prisma = getClient()
    return prisma.submission.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  },

  async getSubmission(id: string): Promise<Submission | null> {
    const prisma = getClient()
    return prisma.submission.findUnique({ where: { id } })
  },
}
