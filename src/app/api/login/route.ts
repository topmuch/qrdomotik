import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { EncryptJWT } from 'jose';
import hkdf from '@panva/hkdf';
import { v4 as uuidv4 } from 'uuid';

const SECRET = process.env.NEXTAUTH_SECRET!;
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

async function getDerivedEncryptionKey(keyMaterial: string, salt: string) {
  return await hkdf(
    'sha256',
    keyMaterial,
    salt,
    `NextAuth.js Generated Encryption Key${salt ? ` (${salt})` : ''}`,
    32
  );
}

async function encodeNextAuthJwt(token: Record<string, unknown>) {
  const encryptionSecret = await getDerivedEncryptionKey(SECRET, '');
  const now = Math.floor(Date.now() / 1000);
  return await new EncryptJWT(token)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(now + MAX_AGE)
    .setJti(uuidv4())
    .encrypt(encryptionSecret);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Veuillez remplir tous les champs' },
        { status: 400 }
      );
    }

    // Find user in database
    const user = await db.user.findUnique({ where: { email: email.trim() } });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Create NextAuth-compatible JWT session token
    const tokenPayload = {
      name: user.fullName,
      email: user.email,
      sub: user.id,
      id: user.id,
      role: user.role,
      picture: null,
    };

    const encryptedToken = await encodeNextAuthJwt(tokenPayload);

    // Determine cookie name (secure or not)
    const isSecure = request.headers.get('x-forwarded-proto') === 'https'
      || request.url.startsWith('https');
    const cookieName = isSecure
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token';

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.fullName, role: user.role }
    });

    response.cookies.set(cookieName, encryptedToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
