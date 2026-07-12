import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { generateId, normalizeProductPayload } from '@/lib/utils';

export const revalidate = 10;

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const search = searchParams.get('search') || searchParams.get('q');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const featured = searchParams.get('featured');
    const sort = searchParams.get('sort');
    const sellerId = searchParams.get('sellerId');

    const offset = (page - 1) * limit;

    let query = Product.find({ is_in_stock: true });

    if (category && category !== 'null' && category !== 'undefined') {
      query = query.where('slug').equals(category);
    }

    if (search && search.trim()) {
      const searchTerm = search.trim();
      query = query.where({
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { tags: { $in: [searchTerm] } },
        ],
      });
    }

    if (minPrice) {
      query = query.where('price').gte(parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.where('price').lte(parseFloat(maxPrice));
    }

    if (featured === 'true') {
      query = query.where('is_featured').equals(true);
    }

    if (sellerId) {
      query = query.where('seller_id').equals(sellerId);
    }

    let sortColumn = 'created_at';
    let sortOrder: 1 | -1 = -1;

    if (sort === 'rating') {
      sortColumn = 'rating_avg';
      sortOrder = -1;
    } else if (sort === 'price-low') {
      sortColumn = 'price';
      sortOrder = 1;
    } else if (sort === 'price-high') {
      sortColumn = 'price';
      sortOrder = -1;
    } else {
      if (sortBy === 'price') {
        sortColumn = 'price';
        sortOrder = order === 'asc' ? 1 : -1;
      } else if (sortBy === 'rating') {
        sortColumn = 'rating_avg';
        sortOrder = order === 'asc' ? 1 : -1;
      } else if (sortBy === 'createdAt') {
        sortColumn = 'created_at';
        sortOrder = order === 'asc' ? 1 : -1;
      } else if (sortBy === 'name') {
        sortColumn = 'name';
        sortOrder = order === 'asc' ? 1 : -1;
      } else {
        sortColumn = 'created_at';
        sortOrder = -1;
      }
    }

    const total = await Product.countDocuments(query.getQuery());
    const products = await query.sort({ [sortColumn]: sortOrder }).skip(offset).limit(limit).lean();

    const mappedProducts = (products || []).map((p) => normalizeProductPayload(p));

    const elapsed = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        products: mappedProducts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        },
      }
    );
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    const friendlyMessage = error?.message || 'We are having trouble loading our products right now. Please try again shortly.';

    return NextResponse.json(
      {
        success: false,
        error: 'Products temporarily unavailable',
        message: friendlyMessage,
        products: [],
        pagination: { page: 1, limit: 12, total: 0, pages: 1 },
      },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      name,
      description,
      price,
      compare_at_price,
      category_id,
      category,
      quantity,
      images,
      unit_type,
      seller_id,
      origin_farm,
      is_organic,
      is_featured,
      is_seasonal,
      specifications,
      tags,
      is_in_stock,
      slug,
    } = body;

    if (!name || !price) {
      return NextResponse.json(
        { error: 'Missing required fields: name and price are required' },
        { status: 400 }
      );
    }

    const generatedSlug = (slug || name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const product = new Product({
      id: generateId(),
      name,
      slug: generatedSlug,
      description: description || null,
      price,
      compare_at_price: compare_at_price || null,
      category_id: category_id || category || null,
      category: category || null,
      quantity: quantity || 0,
      images: images || [],
      unit_type: unit_type || 'piece',
      seller_id: seller_id || null,
      origin_farm: origin_farm || null,
      is_organic: Boolean(is_organic),
      is_featured: Boolean(is_featured),
      is_seasonal: Boolean(is_seasonal),
      is_in_stock: typeof is_in_stock === 'boolean' ? is_in_stock : (quantity || 0) > 0,
      specifications: Array.isArray(specifications) ? specifications : [],
      tags: Array.isArray(tags) ? tags : [],
    });

    await product.save();

    return NextResponse.json(
      { message: 'Product created successfully', product },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create product', message: error.message },
      { status: 500 }
    );
  }
}
