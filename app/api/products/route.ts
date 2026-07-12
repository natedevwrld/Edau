import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { generateId } from '@/lib/utils';

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

    const mappedProducts = (products || []).map((p) => ({
      id: p.id,
      name: p.name,
      title: p.name,
      description: p.description,
      price: p.price,
      compare_at_price: p.compare_at_price,
      images: p.images || [],
      category_id: p.category_id,
      unit_type: p.unit_type,
      is_organic: p.is_organic,
      rating_avg: p.rating_avg,
      rating_count: p.rating_count,
      quantity: p.quantity,
      is_in_stock: p.is_in_stock,
      is_featured: p.is_featured,
      created_at: p.created_at,
    }));

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

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products',
        message: error.message || 'Unknown error',
        products: [],
        pagination: { page: 1, limit: 12, total: 0, pages: 1 },
      },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { name, description, price, category_id, quantity, images, unit_type, seller_id } = body;

    if (!name || !price) {
      return NextResponse.json(
        { error: 'Missing required fields: name and price are required' },
        { status: 400 }
      );
    }

    const slug = (name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const product = new Product({
      id: generateId(),
      name,
      slug,
      description: description || null,
      price,
      category_id: category_id || null,
      quantity: quantity || 0,
      images: images || [],
      unit_type: unit_type || 'piece',
      seller_id: seller_id || null,
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
