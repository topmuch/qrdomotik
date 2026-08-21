'use server';

import type { ApiResponse, SubscriptionPlanInfo, SubscriberType, SubscriptionPlan } from '@/types';
import { NextResponse } from 'next/server';

// ─── Plan definitions ─────────────────────────────────────────────────────────

const MERCHANT_PLANS: SubscriptionPlanInfo[] = [
  {
    plan: 'premium',
    subscriberType: 'merchant',
    amount: 19.90,
    currency: 'EUR',
    label: 'Premium Commerçant',
    features: [
      'Jusqu\'à 50 promotions actives',
      'Statistiques détaillées',
      'Ventes flash (0,50€/déclenchement)',
      'Badge "Premium" sur votre fiche',
      'Support prioritaire par email',
    ],
  },
  {
    plan: 'featured',
    subscriberType: 'merchant',
    amount: 49.90,
    currency: 'EUR',
    label: 'En Vedette Commerçant',
    features: [
      'Promotions illimitées',
      'Statistiques avancées + export',
      'Ventes flash illimitées',
      'Mise en avant sur la carte du quartier',
      'Badge "En Vedette" exclusif',
      'Support dédié par téléphone',
      'Accès anticipé aux nouvelles fonctionnalités',
    ],
  },
];

const PROFESSIONAL_PLANS: SubscriptionPlanInfo[] = [
  {
    plan: 'premium',
    subscriberType: 'professional',
    amount: 14.90,
    currency: 'EUR',
    label: 'Premium Artisan',
    features: [
      'Jusqu\'à 20 services proposés',
      'Fiche artisan complète avec portfolio',
      'Demandes de réservation illimitées',
      'Badge "Premium" vérifié',
      'Statistiques de performance',
    ],
  },
  {
    plan: 'featured',
    subscriberType: 'professional',
    amount: 34.90,
    currency: 'EUR',
    label: 'En Vedette Artisan',
    features: [
      'Services illimités',
      'Mise en avant en tête de liste',
      'QR Codes d\'urgence personnalisés',
      'Alertes push de proximité',
      'Badge "En Vedette" exclusif',
      'Support dédié par téléphone',
      'Accès anticipé aux nouvelles fonctionnalités',
    ],
  },
];

// GET /api/subscriptions/plans — Return available subscription plans
export async function GET() {
  try {
    const allPlans = [...MERCHANT_PLANS, ...PROFESSIONAL_PLANS];

    return NextResponse.json<ApiResponse<SubscriptionPlanInfo[]>>({
      success: true,
      data: allPlans,
    });
  } catch (error) {
    console.error('[GET /api/subscriptions/plans]', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Erreur serveur' },
      { status: 500 },
    );
  }
}
