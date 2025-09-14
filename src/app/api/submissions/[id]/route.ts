import { createErrorResponse, createSuccessResponse } from '@/lib/server/api-utils'
import { db } from '@/lib/server/db'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const item = await db.getSubmission(params.id)
    if (!item) return createErrorResponse('Not found', 404)
    return createSuccessResponse({ submission: item })
  } catch (e) {
    return createErrorResponse('Failed to fetch submission', 500)
  }
}

