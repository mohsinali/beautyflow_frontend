import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has('bf_access') || request.cookies.has('bf_refresh');
  const protectedRoute = request.nextUrl.pathname.startsWith('/dashboard');
  if (protectedRoute && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (request.nextUrl.pathname === '/login' && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*', '/login'] };
