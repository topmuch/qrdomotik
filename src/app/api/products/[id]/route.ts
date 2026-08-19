import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.enum(['laitier', 'viande', 'epicerie', 'boisson', 'fruit', 'conserve', 'autre']).optional(),
  minStockThreshold: z.number().int().min(0).optional(),
  currentStock: z.number().int().min(0).optional(),
});

const instanceSchema = z.object({
  action: z.enum(['add_instance', 'update_instance', 'delete_instance', 'consume_instance']),
  instanceId: z.string().optional(),
  expiryDate: z.string().optional(),
  purchaseDate: z.string().optional(),
});

// GET /api/products/[id] — Product with instances
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const product = await db.product.findUnique({
      where: { id },
      include: {
        productInstances: {
          orderBy: { expiryDate: 'asc' },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: 'Produit introuvable' }, { status: 404 });
    }

    const member = await db.homeMember.findUnique({
      where: { homeId_userId: { homeId: product.homeId, userId: session.user.id } },
    });
    if (!member) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('Product GET error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/products/[id] — Update product or manage instances
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Check if this is an instance action
    if (body.action) {
      const parsed = instanceSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
      }

      const product = await db.product.findUnique({ where: { id } });
      if (!product) {
        return NextResponse.json({ success: false, error: 'Produit introuvable' }, { status: 404 });
      }

      const member = await db.homeMember.findUnique({
        where: { homeId_userId: { homeId: product.homeId, userId: session.user.id } },
      });
      if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
        return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
      }

      const { action } = parsed.data;

      if (action === 'add_instance') {
        if (!parsed.data.expiryDate) {
          return NextResponse.json({ success: false, error: 'expiryDate requis' }, { status: 400 });
        }
        const instance = await db.productInstance.create({
          data: {
            productId: id,
            expiryDate: new Date(parsed.data.expiryDate),
            purchaseDate: parsed.data.purchaseDate ? new Date(parsed.data.purchaseDate) : null,
          },
        });
        // Update product stock count
        const count = await db.productInstance.count({
          where: { productId: id, status: { not: 'consumed' } },
        });
        await db.product.update({ where: { id }, data: { currentStock: count } });
        return NextResponse.json({ success: true, data: instance });
      }

      if (action === 'update_instance' && parsed.data.instanceId) {
        const updateData: Record<string, any> = {};
        if (parsed.data.expiryDate) updateData.expiryDate = new Date(parsed.data.expiryDate);
        if (parsed.data.purchaseDate !== undefined) updateData.purchaseDate = parsed.data.purchaseDate ? new Date(parsed.data.purchaseDate) : null;
        const instance = await db.productInstance.update({
          where: { id: parsed.data.instanceId },
          data: updateData,
        });
        return NextResponse.json({ success: true, data: instance });
      }

      if (action === 'delete_instance' && parsed.data.instanceId) {
        await db.productInstance.delete({ where: { id: parsed.data.instanceId } });
        const count = await db.productInstance.count({
          where: { productId: id, status: { not: 'consumed' } },
        });
        await db.product.update({ where: { id }, data: { currentStock: count } });
        return NextResponse.json({ success: true, message: 'Instance supprimée' });
      }

      if (action === 'consume_instance' && parsed.data.instanceId) {
        await db.productInstance.update({
          where: { id: parsed.data.instanceId },
          data: { status: 'consumed' },
        });
        const count = await db.productInstance.count({
          where: { productId: id, status: { not: 'consumed' } },
        });
        await db.product.update({ where: { id }, data: { currentStock: count } });
        return NextResponse.json({ success: true, message: 'Instance marquée consommée' });
      }

      return NextResponse.json({ success: false, error: 'Action inconnue' }, { status: 400 });
    }

    // Standard product update
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const product = await db.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ success: false, error: 'Produit introuvable' }, { status: 404 });
    }

    const member = await db.homeMember.findUnique({
      where: { homeId_userId: { homeId: product.homeId, userId: session.user.id } },
    });
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    const updated = await db.product.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Product PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/products/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const product = await db.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ success: false, error: 'Produit introuvable' }, { status: 404 });
    }

    const member = await db.homeMember.findUnique({
      where: { homeId_userId: { homeId: product.homeId, userId: session.user.id } },
    });
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    await db.product.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Produit supprimé' });
  } catch (error) {
    console.error('Product DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
