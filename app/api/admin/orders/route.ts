import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import OrderItem from '@/lib/models/OrderItem';
import Profile from '@/lib/models/Profile';

export const dynamic = 'force-dynamic';

function isAdmin(session: any) {
  return session?.user?.role === 'admin';
}

function mapOrder(order: any, profile: any, items: any[]) {
  const address = order.shipping_address || {};
  return {
    _id: order.id,
    userId: {
      _id: profile?.id || order.buyer_id,
      name: profile?.full_name || address.fullName || 'Guest customer',
      email: profile?.email || order.buyer_email || address.email || 'N/A',
    },
    orderNumber: order.order_number,
    items: items.map((item) => ({
      productId: item.product_id ? { _id: item.product_id, title: item.product_name } : null,
      quantity: item.quantity,
      price: item.price,
      title: item.product_name,
      image: item.product_image,
    })),
    total: order.total,
    status: order.status,
    paymentStatus: order.payment_status,
    paymentMethod: order.payment_method,
    mpesaCode: order.payment_reference,
    mpesaVerified: order.payment_status === 'paid',
    shippingAddress: {
      fullName: address.fullName || profile?.full_name || 'N/A',
      phone: address.phone || profile?.phone || 'N/A',
      address: address.address || '',
      city: address.city || '',
      county: address.county || '',
      postalCode: address.postalCode,
    },
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });

    await dbConnect();
    const orders = await Order.find().sort({ created_at: -1 }).lean<any[]>();
    const result = await Promise.all(orders.map(async (order) => {
      const [profile, items] = await Promise.all([
        Profile.findOne({ id: order.buyer_id }).lean<any>(),
        OrderItem.find({ order_id: order.id }).sort({ created_at: 1 }).lean(),
      ]);
      return mapOrder(order, profile, items);
    }));

    return NextResponse.json({ orders: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch orders.' }, { status: 500 });
  }
}
