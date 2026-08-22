import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import OrderItem from '@/lib/models/OrderItem';
import Profile from '@/lib/models/Profile';
import { generateHTMLReceipt } from '@/lib/html-receipt';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const { id } = await params;
    await dbConnect();
    const order = await Order.findOne({ id }).lean<any>();
    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

    const [items, profile] = await Promise.all([
      OrderItem.find({ order_id: order.id }).sort({ created_at: 1 }).lean<any[]>(),
      Profile.findOne({ id: order.buyer_id }).lean<any>(),
    ]);
    const address = order.shipping_address || {};
    const normalizedOrder = {
      orderNumber: order.order_number,
      createdAt: order.created_at,
      status: order.status,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method || 'N/A',
      mpesaCode: order.payment_reference,
      mpesaVerified: order.payment_status === 'paid',
      subtotal: order.subtotal,
      shipping: order.shipping_fee,
      tax: order.tax || 0,
      total: order.total,
      shippingAddress: {
        fullName: address.fullName || profile?.full_name || 'N/A',
        phone: address.phone || profile?.phone || 'N/A',
        address: address.address || '',
        city: address.city || '',
        county: address.county || '',
        postalCode: address.postalCode || '',
      },
      items: items.map((item) => ({
        title: item.product_name,
        quantity: item.quantity,
        price: item.price,
      })),
    };
    const user = {
      name: profile?.full_name || address.fullName || 'Guest customer',
      email: profile?.email || order.buyer_email || address.email || 'N/A',
    };

    return new NextResponse(generateHTMLReceipt(normalizedOrder, user), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate receipt.' }, { status: 500 });
  }
}
