import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { EncryptJWT } from 'jose';
import { v4 as uuidv4 } from 'uuid';
import hkdf from '@panva/hkdf';
import { db } from '@/lib/db';

// Replicate NextAuth's exact JWE encryption so /api/auth/session can decode it
const DEFAULT_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

async function getDerivedEncryptionKey(keyMaterial: string, salt: string) {
  return await hkdf(
    'sha256',
    keyMaterial,
    salt,
    `NextAuth.js Generated Encryption Key${salt ? ` (${salt})` : ''}`,
    32
  );
}

async function encodeNextAuthJwt(token: Record<string, unknown>, secret: string) {
  const encryptionSecret = await getDerivedEncryptionKey(secret, '');
  return await new EncryptJWT(token)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + DEFAULT_MAX_AGE)
    .setJti(uuidv4())
    .encrypt(encryptionSecret);
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

    // Build the token exactly like NextAuth's jwt callback would produce
    const token = {
      sub: user.id,
      name: user.fullName,
      email: user.email,
      id: user.id,
      role: user.role,
    };

    // Encrypt using NextAuth's exact JWE format
    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret';
    const encryptedToken = await encodeNextAuthJwt(token, secret);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.fullName,
        role: user.role,
      },
    });

    // Set cookie with same settings NextAuth uses
    const forwardedProto = req.headers.get('x-forwarded-proto');
    const isSecure = forwardedProto === 'https';

    response.cookies.set({
      name: 'next-auth.session-token',
      value: encryptedToken,
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: DEFAULT_MAX_AGE,
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
