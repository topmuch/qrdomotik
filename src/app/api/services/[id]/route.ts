'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import type { ApiResponse } from '@/types';
import { MAX_SERVICE_DESCRIPTION_LENGTH } from '@/lib/constants';
import { NextRequest, NextResponse } from 'next/server';

// ─── Schemas ──────────────────────────────────────────────────────

const updateServiceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(MAX_SERVICE_DESCRIPTION_LENGTH).optional(),
  basePrice: z.number().min(0).optional(),
  priceUnit: z.enum(['hour', 'flat_rate', 'estimate']).optional(),
  durationMinutes: z.number().int().min(1).max(480).optional(),
  isUrgent: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

interface ServiceWithProfessional {
  id: string;
  professionalId: string;
  name: string;
  description: string | null;
  basePrice: number;
  priceUnit: string;
  durationMinutes: number | null;
  isUrgent: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  professional: {
    id: string;
    businessName: string;
    category: string;
    isVerified: boolean;
  };
}

// GET /api/services/[id] — Single service with professional name
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const service = await db.service.findUnique({
      where: { id },
      include: {
        professional: {
          select: {
            id: true,
            businessName: true,
            category: true,
            isVerified: true,
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Service introuvable',
      }, { status: 404 });
    }

    return NextResponse.json<ApiResponse<ServiceWithProfessional>>({
      success: true,
      data: service as unknown as ServiceWithProfessional,
    });
  } catch (error) {
    console.error('[GET /api/services/[id]]', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erreur serveur',
    }, { status: 500 });
  }
}

// PUT /api/services/[id] — Update a service
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateServiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: parsed.error.issues.map(i => i.message).join(', '),
      }, { status: 400 });
    }

    // Check service exists
    const existing = await db.service.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Service introuvable',
      }, { status: 404 });
    }

    const { name, description, basePrice, priceUnit, durationMinutes, isUrgent, isActive } = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (basePrice !== undefined) updateData.basePrice = basePrice;
    if (priceUnit !== undefined) updateData.priceUnit = priceUnit;
    if (durationMinutes !== undefined) updateData.durationMinutes = durationMinutes;
    if (isUrgent !== undefined) updateData.isUrgent = isUrgent;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await db.service.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json<ApiResponse<typeof updated>>({
      success: true,
      data: updated,
      message: 'Service mis à jour',
    });
  } catch (error) {
    console.error('[PUT /api/services/[id]]', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erreur serveur',
    }, { status: 500 });
  }
}

// DELETE /api/services/[id] — Soft-delete (isActive=false)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Check service exists
    const existing = await db.service.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Service introuvable',
      }, { status: 404 });
    }

    const updated = await db.service.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json<ApiResponse<typeof updated>>({
      success: true,
      data: updated,
      message: 'Service désactivé',
    });
  } catch (error) {
    console.error('[DELETE /api/services/[id]]', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erreur serveur',
    }, { status: 500 });
  }
}
