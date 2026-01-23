import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(_request: NextRequest) {
  // For now, let all requests through
  // TODO: Re-enable Supabase auth once Edge runtime issues are resolved
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
