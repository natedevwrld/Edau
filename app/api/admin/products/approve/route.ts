import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Profile from '@/lib/models/Profile';
import { normalizeProductPayload } from '@/lib/utils';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

async function assertAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();
  const profile = await Profile.findOne({ id: session.user.id }).lean();
  if ((profile as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
  }
  return null;
}

function matchProduct(id: string) {
  // Match by the string `id` field OR the Mongo `_id`, like the GET product route.
  const isObjectId = /^[a-f\d]{24}$/i.test(id);
  return isObjectId ? { $or: [{ id }, { _id: id }] } : { id };
}

// GET: list pending (not yet in stock) products for the approval queue.
export async function GET(req: NextRequest) {
  const forbidden = await assertAdmin(req);
  if (forbidden) return forbidden;

  try {
    const products = await Product.find({ is_in_stock: false }).sort({ created_at: -1 }).lean();
    const mapped = (products || []).map((p: any) => normalizeProductPayload(p));
    return NextResponse.json({ products: mapped });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to load pending products', message: error.message },
      { status: 500 }
    );
  }
}

// POST: approve (or reject) a product by setting its stock/active status.
export async function POST(req: NextRequest) {
  const forbidden = await assertAdmin(req);
  if (forbidden) return forbidden;

  try {
    const body = await request_json(req);
    const { productId, approved } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const product = (await Product.findOneAndUpdate(
      matchProduct(productId),
      { is_in_stock: Boolean(approved), updated_at: new Date() },
      { new: true }
    ).lean()) as any;

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const sellerId = (product as any).seller_id;
    if (sellerId) {
      void createNotification({
        recipient: sellerId,
        type: approved ? 'product_approved' : 'product_rejected',
        title: approved ? 'Product approved' : 'Product not approved',
        message: approved
          ? `Your product "${product.name || 'item'}" is now live on Edau Farm.`
          : `Your product "${product.name || 'item'}" was not approved. Please review and resubmit.`,
        link: '/dashboard',
      });
    }

    return NextResponse.json({
      message: `Product ${approved ? 'approved' : 'rejected'} successfully`,
      product: normalizeProductPayload(product),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update product', message: error.message },
      { status: 500 }
    );
  }
}

async function request_json(req: NextRequest) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
