import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Review, { IReview } from '@/lib/models/Review';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import { generateId } from '@/lib/utils';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const reviews = await Review.find({ product_id: productId })
      .sort({ created_at: -1 })
      .lean();

    return NextResponse.json({ reviews: reviews || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch reviews', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;

    if (!userId) {
      return NextResponse.json(
        { error: 'You must be logged in to post a review' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId, rating, title, comment } = body;

    if (!productId || typeof rating === 'undefined' || !comment) {
      return NextResponse.json(
        { error: 'Product ID, rating, and comment are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const existingReview = (await Review.findOne({ product_id: productId, user_id: userId }).lean()) as IReview | null;

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      );
    }

    const hasPurchased = await Order.findOne({
      buyer_id: userId,
      status: 'delivered',
    }).lean();

    const review = new Review({
      id: generateId(),
      product_id: productId,
      user_id: userId,
      rating: Number(rating),
      title: title || null,
      comment: comment.trim(),
      is_verified_purchase: !!hasPurchased,
    });

    await review.save();

    const allReviews = await Review.find({ product_id: productId }).select('rating').lean();

    if (allReviews && allReviews.length > 0) {
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

      await Product.updateOne(
        { id: productId },
        {
          rating_avg: avgRating,
          rating_count: allReviews.length,
        }
      );
    }

    return NextResponse.json(
      { message: 'Review posted successfully', review },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to post review', message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;

    if (!userId) {
      return NextResponse.json(
        { error: 'You must be logged in to delete a review' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');

    if (!reviewId) {
      return NextResponse.json(
        { error: 'Review ID is required' },
        { status: 400 }
      );
    }

    const review = (await Review.findOne({ id: reviewId }).lean()) as IReview | null;

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    if (review.user_id !== userId) {
      return NextResponse.json(
        { error: 'You can only delete your own reviews' },
        { status: 403 }
      );
    }

    const productId = review.product_id;
    await Review.deleteOne({ id: reviewId });

    const allReviews = await Review.find({ product_id: productId }).select('rating').lean();

    if (allReviews && allReviews.length > 0) {
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await Product.updateOne(
        { id: productId },
        {
          rating_avg: avgRating,
          rating_count: allReviews.length,
        }
      );
    } else {
      await Product.updateOne(
        { id: productId },
        {
          rating_avg: 0,
          rating_count: 0,
        }
      );
    }

    return NextResponse.json({ message: 'Review deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete review', message: error.message },
      { status: 500 }
    );
  }
}
