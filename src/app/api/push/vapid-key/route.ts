import { NextResponse } from 'next/server';
import { getVapidPublicKey } from '@/lib/vapid';

// GET /api/push/vapid-key — Expose VAPID public key to client
export async function GET() {
  const publicKey = getVapidPublicKey();
  return NextResponse.json({ publicKey });
}
