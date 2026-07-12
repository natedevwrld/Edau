import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Profile from '@/lib/models/Profile';
import Order from '@/lib/models/Order';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const profile = await Profile.findOne({ id: session.user.id }).lean();

    if ((profile as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const [
      totalProducts,
      totalUsers,
      totalOrders,
      pendingOrders,
      lowStockProducts,
    ] = await Promise.all([
      Product.countDocuments({}),
      Profile.countDocuments({}),
      Order.countDocuments({}),
      Order.countDocuments({ status: { $in: ['pending', 'processing'] } }),
      Product.countDocuments({ quantity: { $lte: 5 } }),
    ]);

    const orders = await Order.find({}).select('total created_at').lean();
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

    const monthlyRevenue: number[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const monthOrders = orders.filter((o) => {
        const orderDate = new Date(o.created_at);
        return orderDate >= monthStart && orderDate < monthEnd;
      });

      const monthTotal = monthOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      monthlyRevenue.push(Math.round(monthTotal * 100) / 100);
    }

    const recentOrders = await Order.find({})
      .sort({ created_at: -1 })
      .limit(10)
      .lean();

    const recentUsers = await Profile.find({})
      .sort({ created_at: -1 })
      .limit(10)
      .select('id full_name email created_at')
      .lean();

    const topProducts = await Product.find({})
      .sort({ rating_count: -1 })
      .limit(10)
      .select('id name price rating_count')
      .lean();

    return NextResponse.json({
      totalProducts: totalProducts || 0,
      totalUsers: totalUsers || 0,
      totalOrders: totalOrders || 0,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      pendingOrders: pendingOrders || 0,
      lowStockProducts: lowStockProducts || 0,
      recentOrders: (recentOrders || []).map((o) => ({
        _id: o.id,
        order_number: o.order_number,
        customerName: 'Unknown',
        total: o.total || 0,
        status: o.status || 'pending',
        createdAt: o.created_at,
      })),
      recentUsers: (recentUsers || []).map((u) => ({
        _id: u.id,
        name: u.full_name,
        email: u.email,
        createdAt: u.created_at,
      })),
      monthlyRevenue,
      topProducts: (topProducts || []).map((p) => ({
        _id: p.id,
        title: p.name,
        price: p.price,
        sales: p.rating_count || 0,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch stats', message: error.message },
      { status: 500 }
    );
  }
}
