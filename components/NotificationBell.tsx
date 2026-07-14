'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { FiBell, FiCheck, FiPackage, FiStar, FiCreditCard, FiInfo } from 'react-icons/fi';
import { useNotifications } from '@/contexts/NotificationContext';

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

export default function NotificationBell() {
  const { data: session, status } = useSession();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (status !== 'authenticated') return null;

  const toggle = () => setOpen((o) => !o);

  const handleClick = (n: any) => {
    if (!n.read) markRead(n._id);
    if (n.link) {
      // Let Link handle navigation; close panel.
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative flex items-center justify-center p-2 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors"
      >
        <FiBell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary-600 hover:text-primary-800 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-500">
                You have no notifications yet.
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = typeIcon[n.type] || FiInfo;
                const color = typeColor[n.type] || 'text-primary-600 bg-primary-50';
                const body = (
                  <div
                    className={`flex gap-3 px-4 py-3 border-b border-gray-50 transition-colors ${
                      n.read ? 'bg-white' : 'bg-primary-50/40'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{n.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(n.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary-600 mt-2 flex-shrink-0" />}
                  </div>
                );
                return n.link ? (
                  <Link key={n._id} href={n.link} onClick={() => handleClick(n)}>
                    {body}
                  </Link>
                ) : (
                  <button key={n._id} onClick={() => handleClick(n)} className="w-full text-left">
                    {body}
                  </button>
                );
              })
            )}
          </div>

          <Link
            href="/account/notifications"
            onClick={() => setOpen(false)}
            className="block text-center text-sm text-primary-600 hover:text-primary-800 py-3 border-t border-gray-100 font-medium"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}
