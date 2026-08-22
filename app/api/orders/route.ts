import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import OrderItem from '@/lib/models/OrderItem';
import CartItem from '@/lib/models/CartItem';
import { generateId, generateOrderNumber } from '@/lib/utils';
import { createNotification } from '@/lib/notifications';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const userEmail = session?.user?.email?.toLowerCase();

    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const ownership = { $or: [{ buyer_id: userId }, { buyer_email: userEmail }] };
    const total = await Order.countDocuments(ownership);
    const orders = await Order.find(ownership)
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await OrderItem.find({ order_id: order.id }).lean();
        return { ...order, order_items: items };
      })
    );

    return NextResponse.json({
      orders: ordersWithItems,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch orders', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    const body = await request.json();
    const isWhatsAppOrder = body.paymentMethod === 'whatsapp';
    const guestEmail = String(body.buyerEmail || body.shippingAddress?.email || '').trim().toLowerCase();
    if ((!session?.user?.id || !session.user.email) && (!isWhatsAppOrder || !guestEmail)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items, shippingAddress, paymentMethod, mpesaCode, mpesaPhone, buyerName } = body;

    if (!items || items.length === 0 || !shippingAddress || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const userId = session?.user?.id || `guest:${guestEmail}`;
    const normalizedBuyerEmail = session?.user?.email?.trim().toLowerCase() || guestEmail;

    if (!userId || !normalizedBuyerEmail) {
      return NextResponse.json({ error: 'Buyer ID and email are required' }, { status: 400 });
    }

    if ((paymentMethod === 'mpesa' || paymentMethod === 'wallet+mpesa') && (!mpesaCode || !/^[A-Z0-9]{10}$/.test(mpesaCode))) {
      return NextResponse.json({ error: 'Invalid M-Pesa confirmation code. Must be 10 alphanumeric characters.' }, { status: 400 });
    }

    const subtotal = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

    let shipping = 0;
    if (subtotal < 1000) {
      shipping = 95;
    } else if (subtotal < 10000) {
      shipping = 125;
    } else if (subtotal < 20000) {
      shipping = 200;
    }

    const total = subtotal + shipping;
    const orderNumber = generateOrderNumber();

    const order = new Order({
      id: generateId(),
      order_number: orderNumber,
      buyer_id: userId,
      buyer_email: normalizedBuyerEmail,
      status: 'pending',
      payment_status: 'pending',
      payment_method: paymentMethod,
      payment_reference: mpesaCode || null,
      subtotal,
      shipping_fee: shipping,
      total,
      currency: 'KES',
      shipping_address: shippingAddress,
    });

    await order.save();

    // In-app notifications (fire-and-forget; helper swallows its own errors).
    if (session?.user?.id) {
      void createNotification({
        recipient: userId,
        type: 'order',
        title: 'Order placed successfully',
        message: `Your order #${orderNumber} for KSh ${total.toLocaleString()} is being processed.`,
        link: '/dashboard',
      });
    }
    void createNotification({
      recipient: 'admin',
      type: 'order',
      title: 'New order received',
      message: `Order #${orderNumber} from ${buyerName || 'a customer'} — KSh ${total.toLocaleString()}.`,
      link: '/admin/orders',
    });

    const orderItems = items.map((item: any) => ({
      id: generateId(),
      order_id: order.id,
      product_id: item.productId,
      product_name: item.title || item.name,
      product_image: item.image,
      quantity: item.quantity,
      unit_type: item.unit_type || 'piece',
      price: item.price,
      subtotal: item.price * item.quantity,
      seller_id: item.sellerId || null,
    }));

    await OrderItem.insertMany(orderItems);

    await CartItem.deleteMany({ user_id: userId });

    return NextResponse.json(
      { message: 'Order created successfully', order: { ...order.toObject(), order_items: orderItems } },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create order', message: error.message },
      { status: 500 }
    );
  }
}
