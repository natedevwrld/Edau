'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { useNotifications } from '@/contexts/NotificationContext';
import { FiBell, FiCheck, FiPackage, FiStar, FiCreditCard, FiInfo, FiArrowLeft } from 'react-icons/fi';

const typeIcon: Record<string, any> = {
  order: FiPackage,
  product_approved: FiCheck,
  product_rejected: FiPackage,
  payment: FiCreditCard,
  system: FiInfo,
};

const typeColor: Record<string, string> = {
  order: 'text-blue-600 bg-blue-50',
  product_approved: 'text-green-600 bg-green-50',
  product_rejected: 'text-red-600 bg-red-50',
  payment: 'text-amber-600 bg-amber-50',
  system: 'text-primary-600 bg-primary-50',
};

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { notifications, unreadCount, markRead, markAllRead, refresh } = useNotifications();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/account/notifications');
    }
  }, [status, router]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-800 mb-4"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl flex items-center justify-center text-white">
                <FiBell className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-primary-800">Notifications</h1>
                <p className="text-gray-600">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-sm text-primary-600 hover:text-primary-800 font-medium border border-primary-200 rounded-lg px-3 py-2 hover:bg-primary-50"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-primary-100 overflow-hidden">
          {notifications.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <FiBell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">You have no notifications yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {notifications.map((n) => {
                const Icon = typeIcon[n.type] || FiInfo;
                const color = typeColor[n.type] || 'text-primary-600 bg-primary-50';
                const content = (
                  <div className={`flex gap-4 p-5 transition-colors ${n.read ? 'bg-white' : 'bg-primary-50/40'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                        {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-primary-600 mt-1.5 flex-shrink-0" />}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1.5">
                        {new Date(n.createdAt).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                );
                return (
                  <li key={n._id}>
                    {n.link ? (
                      <Link href={n.link} onClick={() => !n.read && markRead(n._id)}>
                        {content}
                      </Link>
                    ) : (
                      <button className="w-full text-left" onClick={() => !n.read && markRead(n._id)}>
                        {content}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
