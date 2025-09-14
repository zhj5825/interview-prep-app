import { NextRequest } from 'next/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/server/api-utils'
import { db } from '@/lib/server/db'

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const item = await db.getSubmission(id)
    if (!item) return createErrorResponse('Not found', 404)
    return createSuccessResponse({ submission: item })
  } catch (e) {
    return createErrorResponse('Failed to fetch submission', 500)
  }
}
