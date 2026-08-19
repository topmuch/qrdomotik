import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug');
    const size = parseInt(req.nextUrl.searchParams.get('size') || '400', 10);

    if (!slug) {
      return NextResponse.json({ error: 'slug requis' }, { status: 400 });
    }

    // Construire l'URL publique
    const baseUrl = process.env.QR_BASE_URL || 'https://qrdomotik.com';
    const url = `${baseUrl}/r/${slug}`;

    const pngBuffer = await QRCode.toBuffer(url, {
      type: 'image/png',
      width: size,
      margin: 2,
      color: {
        dark: '#0f172a',   // slate-900
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });

    return new NextResponse(pngBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="qr-${slug}.png"`,
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error) {
    console.error('QR generate error:', error);
    return NextResponse.json({ error: 'Erreur de génération' }, { status: 500 });
  }
}
