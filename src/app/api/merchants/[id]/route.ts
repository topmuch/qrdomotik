import { db } from '@/lib/db';
import type { ApiResponse } from '@/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateMerchantSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.string().min(1).optional(),
  description: z.string().max(2000).optional(),
  address: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  website: z.string().url().optional().or(z.literal('')),
  openingHoursJson: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

// GET /api/merchants/[id] — Fetch single merchant with active promos count
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const merchant = await db.merchant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            promos: {
              where: {
                validUntil: { gte: new Date() },
              },
            },
          },
        },
      },
    });

    if (!merchant || !merchant.isActive) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Commerçant non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<typeof merchant>>({
      success: true,
      data: {
        ...merchant,
        activePromosCount: merchant._count.promos,
      },
    });
  } catch (error) {
    console.error('[GET /api/merchants/[id]]', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/merchants/[id] — Update merchant profile (own user or superadmin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateMerchantSchema.parse(body);

    // Check merchant exists
    const existing = await db.merchant.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Commerçant non trouvé' },
        { status: 404 }
      );
    }

    // Authorization: userId header must match merchant's userId or role=superadmin
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    if (!userId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Authentification requise' },
        { status: 401 }
      );
    }
    if (existing.userId !== userId && userRole !== 'superadmin') {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (value !== undefined) {
        updateData[key] = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Aucune donnée à mettre à jour' },
        { status: 400 }
      );
    }

    const merchant = await db.merchant.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json<ApiResponse<typeof merchant>>({
      success: true,
      data: merchant,
      message: 'Profil mis à jour',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Données invalides', message: error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }
    console.error('[PUT /api/merchants/[id]]', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE /api/merchants/[id] — Soft-delete (set isActive=false), superadmin only
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check merchant exists
    const existing = await db.merchant.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Commerçant non trouvé' },
        { status: 404 }
      );
    }

    // Authorization: only superadmin
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'superadmin') {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Accès réservé aux superadmins' },
        { status: 403 }
      );
    }

    const merchant = await db.merchant.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json<ApiResponse<typeof merchant>>({
      success: true,
      data: merchant,
      message: 'Commerçant désactivé',
    });
  } catch (error) {
    console.error('[DELETE /api/merchants/[id]]', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
