'use server';

import { db } from '@/lib/db';
import type { ApiResponse, TransactionType, TransactionStatus } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/transactions — List transactions (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') as TransactionType | null;
    const status = searchParams.get('status') as TransactionStatus | null;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);

    const where: Record<string, unknown> = {};
    if (userId) {
      where.OR = [
        { payerId: userId },
        { receiverId: userId },
      ];
    }
    if (type) where.type = type;
    if (status) where.status = status;

    const [transactions, aggregates] = await Promise.all([
      db.transaction.findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      // Revenue stats
      db.transaction.aggregate({
        where: { status: 'completed' },
        _sum: { amount: true },
        _count: true,
      }),
      db.transaction.groupBy({
        by: ['type'],
        where: { status: 'completed' },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const totalRevenue = aggregates[0]._sum.amount ?? 0;
    const totalTransactions = aggregates[0]._count;
    const byType = (aggregates[1] as { type: string; _sum: { amount: number | null }; _count: number }[])
      .reduce((acc, item) => {
        acc[item.type] = { amount: item._sum.amount ?? 0, count: item._count };
        return acc;
      }, {} as Record<string, { amount: number; count: number }>);

    return NextResponse.json<ApiResponse<typeof transactions & { stats: Record<string, unknown> }>>({
      success: true,
      data: transactions as (typeof transactions & { stats: Record<string, unknown> }),
    });
  } catch (error) {
    console.error('[GET /api/transactions]', error);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/transactions — Create a transaction (internal/commission)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, amount, payerId, receiverId, description, referenceId, status } = body;

    if (!type || amount == null) {
      return NextResponse.json<ApiResponse<null>>({
        success: false, error: 'Champs requis: type, amount',
      }, { status: 400 });
    }

    const transaction = await db.transaction.create({
      data: {
        type: type as TransactionType,
        amount,
        status: (status ?? 'pending') as TransactionStatus,
        payerId: payerId ?? null,
        receiverId: receiverId ?? null,
        description: description ?? '',
        referenceId: referenceId ?? null,
      },
    });

    return NextResponse.json<ApiResponse<typeof transaction>>({
      success: true,
      data: transaction,
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/transactions]', error);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
