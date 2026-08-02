import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const adminToken = request.cookies.get('admin_token')?.value;

  // Protect /create route
  if (request.nextUrl.pathname.startsWith('/create')) {
    if (adminToken !== 'authenticated') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Prevent logged in admin from seeing login page again
  if (request.nextUrl.pathname.startsWith('/login')) {
    if (adminToken === 'authenticated') {
      return NextResponse.redirect(new URL('/create', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/create/:path*', '/login'],
};
