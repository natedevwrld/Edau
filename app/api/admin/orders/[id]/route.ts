import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Order from '@/lib/models/Order';

const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const paymentStatuses = ['pending', 'paid', 'failed', 'refunded'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const updates: Record<string, string> = {};

    if (body.status !== undefined) {
      if (!statuses.includes(body.status)) return NextResponse.json({ error: 'Invalid order status.' }, { status: 400 });
      updates.status = body.status;
    }
    if (body.paymentStatus !== undefined) {
      if (!paymentStatuses.includes(body.paymentStatus)) return NextResponse.json({ error: 'Invalid payment status.' }, { status: 400 });
      updates.payment_status = body.paymentStatus;
    }

    if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No valid updates supplied.' }, { status: 400 });

    await dbConnect();
    const order = await Order.findOneAndUpdate({ id }, updates, { new: true, runValidators: true }).lean();
    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update order.' }, { status: 500 });
  }
}
