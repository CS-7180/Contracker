// TODO: Implement auth middleware (M1.1)
// Protects all routes under /(app)/* and redirects unauthenticated users to /login
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|signup).*)'],
}
