import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import OrderItem from '@/lib/models/OrderItem';
import Product from '@/lib/models/Product';
import Profile from '@/lib/models/Profile';
import { createNotification } from '@/lib/notifications';
import { generateId, generateOrderNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();
    const items = Array.isArray(body.items) ? body.items : [];
    const paymentMethod = String(body.paymentMethod || 'cash');
    const notes = String(body.notes || '').trim();

    if (!name || !email || !phone || items.length === 0) {
      return NextResponse.json({ error: 'Customer name, email, phone, and at least one item are required.' }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Please provide a valid customer email.' }, { status: 400 });
    }
    if (!['cash', 'mpesa', 'paybill'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method.' }, { status: 400 });
    }

    await dbConnect();
    const profile = await Profile.findOne({ email }).select('id').lean<any>();
    const orderId = generateId();
    const orderItems: Array<Record<string, unknown>> = [];
    let subtotal = 0;

    for (const item of items) {
      const productId = String(item.productId || '').trim();
      const quantity = Number(item.quantity);
      if (!productId || !Number.isInteger(quantity) || quantity < 1) {
        return NextResponse.json({ error: 'Invalid POS item.' }, { status: 400 });
      }

      const product = await Product.findOne({ id: productId, is_in_stock: true }).lean<any>();
      if (!product) return NextResponse.json({ error: 'One or more products are unavailable.' }, { status: 400 });
      if (Number(product.quantity) < quantity) {
        return NextResponse.json({ error: `${product.name} does not have enough stock.` }, { status: 400 });
      }

      const price = Number(product.price);
      subtotal += price * quantity;
      orderItems.push({
        id: generateId(),
        order_id: orderId,
        product_id: product.id,
        product_name: product.name,
        product_image: product.images?.[0] || null,
        quantity,
        unit_type: product.unit_type || 'piece',
        price,
        subtotal: price * quantity,
        seller_id: product.seller_id || null,
      });
    }

    const shipping = 0;
    const orderNumber = generateOrderNumber();
    const buyerId = profile?.id || `guest:${email}`;
    const order = await Order.create({
      id: orderId,
      order_number: orderNumber,
      buyer_id: buyerId,
      buyer_email: email,
      status: 'pending',
      payment_status: paymentMethod === 'cash' ? 'paid' : 'pending',
      payment_method: paymentMethod,
      payment_reference: body.paymentReference ? String(body.paymentReference).trim() : null,
      subtotal,
      shipping_fee: shipping,
      total: subtotal + shipping,
      currency: 'KES',
      shipping_address: { fullName: name, email, phone, address: body.address || '', city: body.city || '', county: body.county || '' },
      notes,
    });

    await OrderItem.insertMany(orderItems);
    void createNotification({
      recipient: 'admin',
      type: 'order',
      title: 'POS order received',
      message: `POS order #${orderNumber} for ${name} — KSh ${order.total.toLocaleString()}.`,
      link: '/admin/orders',
    });

    return NextResponse.json({ order: { ...order.toObject(), order_items: orderItems } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create POS order.' }, { status: 500 });
  }
}
