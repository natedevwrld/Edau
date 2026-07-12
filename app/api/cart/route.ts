import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CartItem from '@/lib/models/CartItem';
import Product from '@/lib/models/Product';
import { generateId } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    const userId = authHeader?.replace('Bearer ', '');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cartItems = await CartItem.find({ user_id: userId }).lean();

    const itemsWithProduct = (await Promise.all(
      cartItems.map(async (item) => {
        const product = await Product.findOne({ id: item.product_id }).lean();
        return {
          ...item,
          products: product,
        };
      })
    )) as any[];

    const total = itemsWithProduct.reduce(
      (sum, item) => sum + (item.products?.price || 0) * item.quantity,
      0
    );

    return NextResponse.json({
      cart: {
        items: itemsWithProduct,
        total,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch cart', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    const userId = authHeader?.replace('Bearer ', '');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId, quantity } = await request.json();

    if (!productId || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingItem = await CartItem.findOne({ user_id: userId, product_id: productId }).lean();

    if (existingItem) {
      await CartItem.updateOne(
        { user_id: userId, product_id: productId },
        { $inc: { quantity }, updated_at: new Date() }
      );
    } else {
      const cartItem = new CartItem({
        id: generateId(),
        user_id: userId,
        product_id: productId,
        quantity,
      });
      await cartItem.save();
    }

    return NextResponse.json({ message: 'Item added to cart' });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to add to cart', message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    const userId = authHeader?.replace('Bearer ', '');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId, quantity } = await request.json();

    if (quantity <= 0) {
      await CartItem.deleteOne({ user_id: userId, product_id: productId });
    } else {
      await CartItem.updateOne(
        { user_id: userId, product_id: productId },
        { quantity, updated_at: new Date() }
      );
    }

    return NextResponse.json({ message: 'Cart updated' });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update cart', message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    const userId = authHeader?.replace('Bearer ', '');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await CartItem.deleteMany({ user_id: userId });

    return NextResponse.json({ message: 'Cart cleared' });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to clear cart', message: error.message },
      { status: 500 }
    );
  }
}
