import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Profile from '@/lib/models/Profile';
import AIUsageLog from '@/lib/models/AIUsageLog';

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

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalLogs,
      totalTokensAgg,
      todayLogs,
      todayTokensAgg,
      byFeature,
      byDay,
      recentLogs,
    ] = await Promise.all([
      AIUsageLog.countDocuments({}),
      AIUsageLog.aggregate([
        { $group: { _id: null, total: { $sum: '$totalTokens' }, prompts: { $sum: '$promptTokens' }, completions: { $sum: '$completionTokens' } } },
      ]),
      AIUsageLog.countDocuments({ createdAt: { $gte: startOfDay } }),
      AIUsageLog.aggregate([
        { $match: { createdAt: { $gte: startOfDay } } },
        { $group: { _id: null, total: { $sum: '$totalTokens' } } },
      ]),
      AIUsageLog.aggregate([
        { $group: { _id: '$feature', count: { $sum: 1 }, tokens: { $sum: '$totalTokens' } } },
        { $sort: { count: -1 } },
      ]),
      AIUsageLog.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            requests: { $sum: 1 },
            tokens: { $sum: '$totalTokens' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      AIUsageLog.find({})
        .sort({ createdAt: -1 })
        .limit(25)
        .lean(),
    ]);

    const totals = totalTokensAgg[0] || { total: 0, prompts: 0, completions: 0 };

    return NextResponse.json({
      summary: {
        totalRequests: totalLogs || 0,
        totalTokens: totals.total || 0,
        promptTokens: totals.prompts || 0,
        completionTokens: totals.completions || 0,
        todayRequests: todayLogs || 0,
        todayTokens: todayTokensAgg[0]?.total || 0,
      },
      byFeature: byFeature || [],
      byDay: byDay || [],
      recent: (recentLogs || []).map((l: any) => ({
        id: l._id,
        feature: l.feature,
        aiModel: l.aiModel,
        totalTokens: l.totalTokens,
        promptTokens: l.promptTokens,
        completionTokens: l.completionTokens,
        createdAt: l.createdAt,
        userId: l.userId,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to load AI usage', message: error.message },
      { status: 500 }
    );
  }
}
