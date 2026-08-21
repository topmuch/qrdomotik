'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import type { ApiResponse } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

const verifySchema = z.object({
  professionalId: z.string().min(1),
  action: z.enum(['verify', 'reject']),
  reason: z.string().optional(),
});

// PATCH /api/professionals/verify — Verify or reject a professional
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: parsed.error.issues.map(i => i.message).join(', '),
      }, { status: 400 });
    }

    const { professionalId, action, reason } = parsed.data;

    // Fetch professional with user
    const professional = await db.professional.findUnique({
      where: { id: professionalId },
      select: { id: true, userId: true, businessName: true, isVerified: true },
    });

    if (!professional) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Artisan introuvable',
      }, { status: 404 });
    }

    if (action === 'verify') {
      // Verify the professional
      const updated = await db.professional.update({
        where: { id: professionalId },
        data: { isVerified: true },
      });

      // Create success notification
      await db.notification.create({
        data: {
          userId: professional.userId,
          type: 'system',
          title: 'Profil vérifié !',
          body: `Félicitations, votre profil « ${professional.businessName} » a été vérifié. Vous êtes maintenant visible dans les résultats de recherche.`,
          dataJson: JSON.stringify({ professionalId, action: 'verified' }),
        },
      });

      return NextResponse.json<ApiResponse<typeof updated>>({
        success: true,
        data: updated,
        message: 'Artisan vérifié avec succès',
      });
    }

    // Reject
    const updated = await db.professional.update({
      where: { id: professionalId },
      data: { isVerified: false },
    });

    // Create rejection notification with reason
    await db.notification.create({
      data: {
        userId: professional.userId,
        type: 'system',
        title: 'Vérification rejetée',
        body: reason
          ? `Votre profil « ${professional.businessName} » n'a pas pu être vérifié. Raison : ${reason}`
          : `Votre profil « ${professional.businessName} » n'a pas pu être vérifié. Veuillez vérifier vos documents et réessayer.`,
        dataJson: JSON.stringify({ professionalId, action: 'rejected', reason: reason ?? null }),
      },
    });

    return NextResponse.json<ApiResponse<typeof updated>>({
      success: true,
      data: updated,
      message: 'Artisan rejeté',
    });
  } catch (error) {
    console.error('[PATCH /api/professionals/verify]', error);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
