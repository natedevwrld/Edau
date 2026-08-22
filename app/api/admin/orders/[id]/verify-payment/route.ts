import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Order from '@/lib/models/Order';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });

    const { id } = await params;
    await dbConnect();
    const order = await Order.findOneAndUpdate(
      { id },
      { payment_status: 'paid' },
      { new: true, runValidators: true }
    ).lean();
    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to verify payment.' }, { status: 500 });
  }
}
