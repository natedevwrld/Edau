import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/lib/models/Category';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();

    const categories = await Category.find({ is_active: true }).sort({ display_order: 1 }).lean();

    return NextResponse.json(
      { categories },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch categories', message: error.message },
      { status: 500 }
    );
  }
}
