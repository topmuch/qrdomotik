import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const postSchema = z.object({
  value: z.number().positive(),
  date: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'Date ISO invalide' },
  ),
});

// GET /api/modules/[slug]/energy — Get energy counter content
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const qr = await db.qrCode.findUnique({
      where: { publicSlug: slug },
      include: { content: true },
    });

    if (!qr) {
      return NextResponse.json({ success: false, error: 'QR introuvable' }, { status: 404 });
    }

    if (!qr.isActive) {
      return NextResponse.json({ success: false, error: 'QR désactivé' }, { status: 403 });
    }

    const content = qr.content ? JSON.parse(qr.content.contentJson) : {};

    return NextResponse.json({
      success: true,
      data: {
        ...content,
        readings: content.readings || [],
      },
    });
  } catch (error) {
    console.error('Energy GET error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/modules/[slug]/energy — Add a new energy reading
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const parsed = postSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Données invalides' }, { status: 400 });
    }

    const { value, date } = parsed.data;

    const qr = await db.qrCode.findUnique({
      where: { publicSlug: slug },
      include: { content: true },
    });

    if (!qr) {
      return NextResponse.json({ success: false, error: 'QR introuvable' }, { status: 404 });
    }

    if (!qr.isActive) {
      return NextResponse.json({ success: false, error: 'QR désactivé' }, { status: 403 });
    }

    const content = qr.content ? JSON.parse(qr.content.contentJson) : {};
    const readings = content.readings || [];

    const newReading = {
      id: crypto.randomUUID(),
      value,
      date,
      createdAt: new Date().toISOString(),
    };

    readings.push(newReading);
    content.readings = readings;
    content.currentReading = value;

    if (qr.content) {
      await db.qrContent.update({
        where: { id: qr.content.id },
        data: { contentJson: JSON.stringify(content) },
      });
    } else {
      await db.qrContent.create({
        data: {
          qrCodeId: qr.id,
          contentJson: JSON.stringify(content),
        },
      });
    }

    // Log activity
    await db.activityLog.create({
      data: {
        homeId: qr.homeId,
        qrCodeId: qr.id,
        actionType: 'energy_reading_added',
        detailsJson: JSON.stringify({ value, date }),
      },
    });

    return NextResponse.json({ success: true, data: content });
  } catch (error) {
    console.error('Energy POST error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
