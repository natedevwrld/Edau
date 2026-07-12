import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Profile from '@/lib/models/Profile';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const adminProfile = (await Profile.findOne({ id: session.user.id }).lean()) as any;

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const role = searchParams.get('role');

    const offset = (page - 1) * limit;

    let query = Profile.find({});

    if (search) {
      query = query.where({
        $or: [
          { email: { $regex: search, $options: 'i' } },
          { full_name: { $regex: search, $options: 'i' } },
        ],
      });
    }

    if (role && role !== 'all') {
      query = query.where('role').equals(role);
    }

    const total = await Profile.countDocuments(query.getQuery());
    const users = (await query
      .skip(offset)
      .limit(limit)
      .sort({ created_at: -1 })
      .lean()) as any[];

    return NextResponse.json({
      users: (users || []).map((u) => ({
        _id: u.id,
        name: u.full_name,
        email: u.email,
        role: u.role,
        isVerified: u.is_verified,
        createdAt: u.created_at,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch users', message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const adminProfile = (await Profile.findOne({ id: session.user.id }).lean()) as any;

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, updates } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (userId === session.user.id && updates.role) {
      return NextResponse.json({ error: 'Cannot modify your own role' }, { status: 403 });
    }

    const allowedUpdates: Record<string, string> = {
      role: 'role',
      isVerified: 'is_verified',
      full_name: 'full_name',
      phone: 'phone',
    };

    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, column] of Object.entries(allowedUpdates)) {
      if (updates[key] !== undefined) {
        filteredUpdates[column] = updates[key];
      }
    }

    filteredUpdates.updated_at = new Date();

    const user = (await Profile.findOneAndUpdate(
      { id: userId },
      filteredUpdates,
      { new: true }
    ).lean()) as any;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user: {
        _id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        isVerified: user.is_verified,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update user', message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const adminProfile = (await Profile.findOne({ id: session.user.id }).lean()) as any;

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 403 });
    }

    await Profile.deleteOne({ id: userId });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete user', message: error.message },
      { status: 500 }
    );
  }
}
