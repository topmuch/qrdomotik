import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const isSecure = request.headers.get('x-forwarded-proto') === 'https'
    || request.url.startsWith('https');
  const cookieName = isSecure
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token';

  const response = NextResponse.json({ success: true });
  response.cookies.set(cookieName, '', {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  // Also clear the non-secure variant just in case
  response.cookies.set('next-auth.session-token', '', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
