import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { db } from '@/lib/db';

// Encode NEXTAUTH_SECRET as Uint8Array for jose
function getSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret';
  return new TextEncoder().encode(secret);
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { success: false, error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Create a NextAuth-compatible JWT using jose (same lib NextAuth uses)
    // Include all fields the jwt callback expects
    const secret = getSecret();
    const token = await new SignJWT({
      sub: user.id,
      id: user.id,
      name: user.fullName,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.fullName,
        role: user.role,
      },
    });

    // Set the NextAuth session cookie
    const forwardedProto = req.headers.get('x-forwarded-proto');
    const isSecure = forwardedProto === 'https';

    response.cookies.set({
      name: 'next-auth.session-token',
      value: token,
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
