import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { normalizeProductPayload } from '@/lib/utils';

export const revalidate = 600;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    await dbConnect();

    const product = (await Product.findOne({ $or: [{ id }, { _id: id }] }).lean()) as any;

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const mappedProduct = normalizeProductPayload(product);

    return NextResponse.json(
      { product: mappedProduct },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch product', message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    await dbConnect();

    const body = await request.json();

    const product = (await Product.findOneAndUpdate(
      { id },
      { ...body, updated_at: new Date() },
      { new: true }
    ).lean()) as any;

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Product updated successfully', product });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update product', message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    await dbConnect();

    const product = (await Product.findOneAndDelete({ id }).lean()) as any;

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Product deleted successfully', product });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete product', message: error.message },
      { status: 500 }
    );
  }
}
