import { db } from '@/lib/db';
import type { ApiResponse } from '@/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { COMMISSIONS } from '@/lib/constants';

const createPromoSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  originalPrice: z.number().min(0).optional(),
  promoPrice: z.number().min(0),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime(),
  keywords: z.array(z.string()).optional(),
  category: z.string().max(50).optional(),
  isFlashSale: z.boolean().optional(),
});

// GET /api/merchants/[id]/promos — List merchant's promos
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    // Verify merchant exists
    const merchant = await db.merchant.findUnique({ where: { id } });
    if (!merchant || !merchant.isActive) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Commerçant non trouvé' },
        { status: 404 }
      );
    }

    const now = new Date();
    const where: Record<string, unknown> = { merchantId: id };
    if (activeOnly) {
      where.validUntil = { gte: now };
    }

    const promos = await db.promo.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json<ApiResponse<typeof promos>>({
      success: true,
      data: promos,
    });
  } catch (error) {
    console.error('[GET /api/merchants/[id]/promos]', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/merchants/[id]/promos — Create a new promo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = createPromoSchema.parse(body);

    // Authorization: userId header must match merchant's userId
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    if (!userId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Authentification requise' },
        { status: 401 }
      );
    }

    // Verify merchant exists and belongs to user
    const merchant = await db.merchant.findUnique({ where: { id } });
    if (!merchant || !merchant.isActive) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Commerçant non trouvé' },
        { status: 404 }
      );
    }

    if (merchant.userId !== userId && userRole !== 'superadmin') {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Build promo data
    const promoData: Record<string, unknown> = {
      title: parsed.title,
      description: parsed.description,
      imageUrl: parsed.imageUrl,
      originalPrice: parsed.originalPrice,
      promoPrice: parsed.promoPrice,
      validUntil: new Date(parsed.validUntil),
      keywordsJson: JSON.stringify(parsed.keywords ?? []),
      category: parsed.category,
      isFlashSale: parsed.isFlashSale ?? false,
      source: 'local',
      merchantId: id,
    };

    if (parsed.validFrom) {
      promoData.validFrom = new Date(parsed.validFrom);
    }

    // If flash sale, set cost and create transaction
    if (parsed.isFlashSale) {
      const flashCost = COMMISSIONS.flash_sale.default;
      promoData.flashSaleCost = flashCost;
      promoData.flashSaleTriggeredAt = new Date();

      // Create transaction record
      await db.transaction.create({
        data: {
          type: 'flash_sale',
          payerId: merchant.userId,
          amount: flashCost,
          status: 'pending',
          referenceId: id, // merchant id as reference
        },
      });
    }

    const promo = await db.promo.create({
      data: promoData as Parameters<typeof db.promo.create>[0]['data'],
    });

    return NextResponse.json<ApiResponse<typeof promo>>(
      {
        success: true,
        data: promo,
        message: 'Promo créée avec succès',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Données invalides',
          message: error.errors.map((e) => e.message).join(', '),
        },
        { status: 400 }
      );
    }
    console.error('[POST /api/merchants/[id]/promos]', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
