import { NextResponse, type NextRequest } from 'next/server';

// Middleware is intentionally a simple pass-through.
// All auth logic is handled client-side by the panel layout.
// The Supabase browser client handles token refresh automatically.
export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/panel/:path*',
    '/admin/:path*',
  ],
};
