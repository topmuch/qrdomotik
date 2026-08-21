import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const VALID_TYPES = ['todo_list', 'deep_cleaning', 'shopping_list'] as const;

const postSchema = z.object({
  text: z.string().min(1).max(500),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly']).optional(),
});

const patchSchema = z.object({
  itemId: z.string().min(1),
  checked: z.boolean(),
});

const deleteSchema = z.object({
  itemId: z.string().min(1),
});

// Helper: find QR by slug, include content
async function findQrWithContent(slug: string) {
  const qr = await db.qrCode.findUnique({
    where: { publicSlug: slug },
    include: { content: true },
  });
  return qr;
}

// Helper: get parsed content from QR
function getParsedContent(qr: NonNullable<Awaited<ReturnType<typeof findQrWithContent>>>) {
  return qr.content ? JSON.parse(qr.content.contentJson) : { items: [] };
}

// Helper: save content back to QR
async function saveContent(
  qr: NonNullable<Awaited<ReturnType<typeof findQrWithContent>>>,
  content: Record<string, unknown>,
) {
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
}

// Helper: log activity
async function logActivity(
  qr: NonNullable<Awaited<ReturnType<typeof findQrWithContent>>>,
  actionType: string,
  details?: Record<string, unknown>,
) {
  await db.activityLog.create({
    data: {
      homeId: qr.homeId,
      qrCodeId: qr.id,
      actionType,
      detailsJson: details ? JSON.stringify(details) : null,
    },
  });
}

// GET /api/modules/[slug]/checklist — Get checklist items
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const qr = await findQrWithContent(slug);
    if (!qr) {
      return NextResponse.json({ success: false, error: 'QR introuvable' }, { status: 404 });
    }
    if (!qr.isActive) {
      return NextResponse.json({ success: false, error: 'QR désactivé' }, { status: 403 });
    }

    const content = getParsedContent(qr);

    return NextResponse.json({ success: true, data: { items: content.items || [] } });
  } catch (error) {
    console.error('Checklist GET error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/modules/[slug]/checklist — Add a new item
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

    const { text, frequency } = parsed.data;

    const qr = await findQrWithContent(slug);
    if (!qr) {
      return NextResponse.json({ success: false, error: 'QR introuvable' }, { status: 404 });
    }
    if (!qr.isActive) {
      return NextResponse.json({ success: false, error: 'QR désactivé' }, { status: 403 });
    }
    if (!VALID_TYPES.includes(qr.type as typeof VALID_TYPES[number])) {
      return NextResponse.json({ success: false, error: 'Type de QR non supporté' }, { status: 400 });
    }

    const content = getParsedContent(qr);
    const items = content.items || [];

    const newItem: Record<string, unknown> = {
      id: crypto.randomUUID().slice(0, 8),
      text,
      checked: false,
    };

    // For deep_cleaning, add frequency field
    if (qr.type === 'deep_cleaning' && frequency) {
      newItem.frequency = frequency;
    }

    items.push(newItem);
    content.items = items;

    await saveContent(qr, content);
    await logActivity(qr, 'item_added', { text });

    return NextResponse.json({ success: true, data: content });
  } catch (error) {
    console.error('Checklist POST error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/modules/[slug]/checklist — Toggle an item's checked status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Données invalides' }, { status: 400 });
    }

    const { itemId, checked } = parsed.data;

    const qr = await findQrWithContent(slug);
    if (!qr) {
      return NextResponse.json({ success: false, error: 'QR introuvable' }, { status: 404 });
    }
    if (!qr.isActive) {
      return NextResponse.json({ success: false, error: 'QR désactivé' }, { status: 403 });
    }

    const content = getParsedContent(qr);
    const items: Array<Record<string, unknown>> = content.items || [];

    const itemIndex = items.findIndex((item) => item.id === itemId);
    if (itemIndex === -1) {
      return NextResponse.json({ success: false, error: 'Élément introuvable' }, { status: 404 });
    }

    items[itemIndex].checked = checked;

    // For deep_cleaning, update lastDone when checking
    if (qr.type === 'deep_cleaning' && checked) {
      items[itemIndex].lastDone = new Date().toISOString();
    }

    content.items = items;

    await saveContent(qr, content);
    await logActivity(qr, 'item_checked', { itemId, checked });

    return NextResponse.json({ success: true, data: content });
  } catch (error) {
    console.error('Checklist PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/modules/[slug]/checklist — Remove an item
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const parsed = deleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Données invalides' }, { status: 400 });
    }

    const { itemId } = parsed.data;

    const qr = await findQrWithContent(slug);
    if (!qr) {
      return NextResponse.json({ success: false, error: 'QR introuvable' }, { status: 404 });
    }
    if (!qr.isActive) {
      return NextResponse.json({ success: false, error: 'QR désactivé' }, { status: 403 });
    }

    const content = getParsedContent(qr);
    const items: Array<Record<string, unknown>> = content.items || [];

    const filteredItems = items.filter((item) => item.id !== itemId);
    if (filteredItems.length === items.length) {
      return NextResponse.json({ success: false, error: 'Élément introuvable' }, { status: 404 });
    }

    content.items = filteredItems;

    await saveContent(qr, content);
    await logActivity(qr, 'item_removed', { itemId });

    return NextResponse.json({ success: true, data: content });
  } catch (error) {
    console.error('Checklist DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
