'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, MessageSquareText, X } from 'lucide-react';
import { getContactLink, getWhatsAppLink } from '@/lib/whatsapp';

export default function SupportFloatingButtons() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-6 right-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl">
          <a
            href={getContactLink()}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700"
          >
            <MessageCircle className="h-4 w-4" />
            Chat on WhatsApp
          </a>
          <Link
            href="/help"
            className="flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-700 hover:bg-primary-100"
          >
            <MessageSquareText className="h-4 w-4" />
            Ask the AI assistant
          </Link>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition hover:bg-primary-700"
        aria-label="Open support options"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
