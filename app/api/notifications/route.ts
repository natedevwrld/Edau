import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Notification from '@/lib/models/Notification';
import Profile from '@/lib/models/Profile';
import { isAdmin } from '@/lib/roleCheck';

export const dynamic = 'force-dynamic';

async function recipientFilter(userId: string): Promise<string[]> {
  const filter = [userId];
  // Admins also receive admin-wide notifications.
  await dbConnect();
  const profile = await Profile.findOne({ id: userId }).lean();
  if ((profile as any)?.role === 'admin') {
    filter.push('admin');
  }
  return filter;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recipients = await recipientFilter(session.user.id);
    await dbConnect();

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: { $in: recipients } })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
      Notification.countDocuments({ recipient: { $in: recipients }, read: false }),
    ]);

    return NextResponse.json({
      notifications: (notifications || []).map((n: any) => ({
        _id: n._id,
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link,
        read: n.read,
        createdAt: n.createdAt,
      })),
      unreadCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to load notifications', message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recipients = await recipientFilter(session.user.id);
    const body = await req.json().catch(() => ({}));
    await dbConnect();

    if (body.all) {
      await Notification.updateMany(
        { recipient: { $in: recipients }, read: false },
        { $set: { read: true } }
      );
      return NextResponse.json({ success: true });
    }

    if (body.id) {
      // Only mark if it belongs to this user's recipient set.
      await Notification.updateOne(
        { _id: body.id, recipient: { $in: recipients } },
        { $set: { read: true } }
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Missing id or all flag' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update notifications', message: error.message },
      { status: 500 }
    );
  }
}
