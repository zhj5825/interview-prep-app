import { NextRequest } from 'next/server'
import { createErrorResponse, createSuccessResponse, validateRequestBody } from '@/lib/server/api-utils'
import { db } from '@/lib/server/db'

type CreateBody = { question: string; explanation: string }

export async function GET() {
  try {
    const items = await db.listSubmissions(30)
    return createSuccessResponse({ items })
  } catch (e) {
    return createErrorResponse('Failed to list submissions', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await validateRequestBody<CreateBody>(req, ['question', 'explanation'])
    if (!body) return createErrorResponse('Invalid body', 400)
    if (!body.question.trim() || !body.explanation.trim()) {
      return createErrorResponse('Question and explanation are required', 400)
    }
    const saved = await db.saveSubmission({ question: body.question.trim(), explanation: body.explanation.trim() })
    return createSuccessResponse({ submission: saved }, 201)
  } catch (e) {
    return createErrorResponse('Failed to save submission', 500)
  }
}

