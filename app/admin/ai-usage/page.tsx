'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { isAdmin } from '@/lib/roleCheck';
import toast from 'react-hot-toast';
import Link from 'next/link';
import axios from 'axios';
import {
  FiChevronLeft,
  FiActivity,
  FiCpu,
  FiTrendingUp,
  FiCalendar,
  FiMessageSquare,
  FiZap,
} from 'react-icons/fi';

interface UsageSummary {
  totalRequests: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  todayRequests: number;
  todayTokens: number;
}

interface FeatureUsage {
  _id: string;
  count: number;
  tokens: number;
}

interface DayUsage {
  _id: string;
  requests: number;
  tokens: number;
}

interface RecentLog {
  id: string;
  feature: string;
  model: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  createdAt: string;
  userId: string | null;
}

const featureMeta: Record<string, { label: string; icon: any }> = {
  chat: { label: 'AI Chat', icon: FiMessageSquare },
  captions: { label: 'AI Captions', icon: FiZap },
  description: { label: 'AI Descriptions', icon: FiCpu },
};

export default function AIUsagePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [byFeature, setByFeature] = useState<FeatureUsage[]>([]);
  const [byDay, setByDay] = useState<DayUsage[]>([]);
  const [recent, setRecent] = useState<RecentLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/ai-usage');
    } else if (status === 'authenticated' && !isAdmin(session?.user?.role)) {
      toast.error('Access denied. Admin privileges required.');
      router.push('/dashboard');
    }
  }, [status, session, router]);

  const load = useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/ai-usage');
      setSummary(res.data.summary);
      setByFeature(res.data.byFeature || []);
      setByDay(res.data.byDay || []);
      setRecent(res.data.recent || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load AI usage');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') load();
  }, [status, load]);

  const fmt = (n: number) => n?.toLocaleString('en-US') || '0';

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary-600 font-medium">Loading AI usage…</p>
        </div>
      </div>
    );
  }

  const maxDay = Math.max(1, ...byDay.map((d) => d.requests));

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-800 mb-4"
          >
            <FiChevronLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl flex items-center justify-center">
              <FiActivity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary-800">AI Usage</h1>
              <p className="text-gray-600">Track AI assistant, caption, and content generation activity</p>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={FiTrendingUp} label="Total Requests" value={fmt(summary?.totalRequests || 0)} />
          <StatCard icon={FiCpu} label="Total Tokens" value={fmt(summary?.totalTokens || 0)} />
          <StatCard icon={FiActivity} label="Today Requests" value={fmt(summary?.todayRequests || 0)} />
          <StatCard icon={FiCalendar} label="Today Tokens" value={fmt(summary?.todayTokens || 0)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* By feature */}
          <div className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6">
            <h2 className="text-xl font-semibold text-primary-800 mb-6">Usage by Feature</h2>
            {byFeature.length === 0 ? (
              <Empty />
            ) : (
              <div className="space-y-4">
                {byFeature.map((f) => {
                  const meta = featureMeta[f._id] || { label: f._id, icon: FiCpu };
                  const Icon = meta.icon;
                  return (
                    <div key={f._id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-800">{meta.label}</span>
                          <span className="text-gray-500">{fmt(f.count)} req · {fmt(f.tokens)} tok</span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-primary-50 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-500 to-primary-700"
                            style={{ width: `${(f.count / Math.max(1, ...byFeature.map((x) => x.count))) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Daily chart */}
          <div className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6">
            <h2 className="text-xl font-semibold text-primary-800 mb-6">Last 30 Days</h2>
            {byDay.length === 0 ? (
              <Empty />
            ) : (
              <div className="flex items-end gap-1 h-40 overflow-x-auto">
                {byDay.map((d) => (
                  <div key={d._id} className="flex flex-col items-center justify-end flex-1 min-w-[6px]" title={`${d._id}: ${d.requests} requests`}>
                    <span className="text-[9px] text-gray-400 mb-1">{d.requests}</span>
                    <div
                      className="w-full rounded-t bg-primary-500"
                      style={{ height: `${(d.requests / maxDay) * 100}%`, minHeight: '2px' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent logs */}
        <div className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6 mt-8">
          <h2 className="text-xl font-semibold text-primary-800 mb-6">Recent Activity</h2>
          {recent.length === 0 ? (
            <Empty />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="py-2 pr-4 font-medium">Feature</th>
                    <th className="py-2 pr-4 font-medium">Model</th>
                    <th className="py-2 pr-4 font-medium">Tokens</th>
                    <th className="py-2 pr-4 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((log) => {
                    const meta = featureMeta[log.feature] || { label: log.feature };
                    return (
                      <tr key={log.id} className="border-b border-gray-50">
                        <td className="py-3 pr-4 font-medium text-gray-800">{meta.label}</td>
                        <td className="py-3 pr-4 text-gray-500">{log.model}</td>
                        <td className="py-3 pr-4 text-gray-600">{fmt(log.totalTokens)}</td>
                        <td className="py-3 pr-4 text-gray-500">
                          {new Date(log.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-primary-100 p-5">
      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 mb-3">
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-primary-800">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

function Empty() {
  return (
    <div className="text-center py-10 text-gray-500">
      <FiActivity className="w-10 h-10 mx-auto mb-3 text-gray-300" />
      <p className="text-sm">No AI usage recorded yet.</p>
    </div>
  );
}
