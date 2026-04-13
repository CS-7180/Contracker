import { NextResponse } from 'next/server'
import spec from '@/lib/openapi'

/**
 * GET /api/docs
 * Serves the OpenAPI 3.0 spec as JSON — consumed by the Swagger UI page at /api-docs.
 * No auth required (the spec itself contains no sensitive data).
 */
export async function GET() {
  return NextResponse.json(spec)
}
