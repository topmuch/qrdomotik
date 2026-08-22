import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { EncryptJWT } from 'jose';
import hkdf from '@panva/hkdf';
import { v4 as uuidv4 } from 'uuid';

const SECRET = process.env.NEXTAUTH_SECRET!;
const MAX_AGE = 30 * 24 * 60 * 60;

async function getDerivedEncryptionKey(keyMaterial: string, salt: string) {
  return await hkdf('sha256', keyMaterial, salt, `NextAuth.js Generated Encryption Key${salt ? ` (${salt})` : ''}`, 32);
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
  let email = '';
  let password = '';
  
  try {
    // Try multiple body parsing strategies
    const contentType = request.headers.get('content-type') || '';
    let body: Record<string, unknown> | null = null;
    
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      // Fallback: try JSON first, then form-encoded
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        // Try URL-encoded parsing
        const params = new URLSearchParams(text);
        body = Object.fromEntries(params);
      }
    }
    
    email = String(body?.email || '');
    password = String(body?.password || '');
    
    console.log('[LOGIN] attempt:', { email: email.substring(0, 3) + '***', contentType, hasBody: !!body });

    if (!email || !password) {
      console.log('[LOGIN] missing fields:', { email: !!email, password: !!password, bodyKeys: body ? Object.keys(body) : [] });
      return NextResponse.json({ error: 'Veuillez remplir tous les champs', debug: { email: !!email, password: !!password } }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: email.trim() } });

    if (!user || !user.passwordHash) {
      console.log('[LOGIN] user not found:', email);
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      console.log('[LOGIN] wrong password for:', email);
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

    // Success
    const tokenPayload = {
      name: user.fullName,
      email: user.email,
      sub: user.id,
      id: user.id,
      role: user.role,
      picture: null,
    };

    const encryptedToken = await encodeNextAuthJwt(tokenPayload);

    // Set BOTH cookie names to handle any proxy mismatch
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.fullName, role: user.role }
    });

    // Set secure cookie
    response.cookies.set('__Secure-next-auth.session-token', encryptedToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: MAX_AGE,
    });
    
    // Also set non-secure cookie as fallback
    response.cookies.set('next-auth.session-token', encryptedToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: MAX_AGE,
    });

    console.log('[LOGIN] success:', email, 'role:', user.role);
    return response;
  } catch (error) {
    console.error('[LOGIN] error:', error);
    return NextResponse.json({ error: 'Erreur serveur', details: String(error) }, { status: 500 });
  }
}

// Handle GET to allow easy testing
export async function GET() {
  return NextResponse.json({ status: 'login endpoint ready' });
}
