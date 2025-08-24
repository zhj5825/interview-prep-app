import { NextResponse } from 'next/server'

export function createErrorResponse(message: string, status: number = 500) {
  return NextResponse.json(
    { error: message },
    { status }
  )
}

export function createSuccessResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status })
}

export async function validateRequestBody<T>(
  request: Request,
  requiredFields: (keyof T)[]
): Promise<T | null> {
  try {
    const body = await request.json()
    
    for (const field of requiredFields) {
      if (!(field in body) || body[field] === undefined || body[field] === null) {
        return null
      }
    }
    
    return body as T
  } catch {
    return null
  }
}

export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, '')
}