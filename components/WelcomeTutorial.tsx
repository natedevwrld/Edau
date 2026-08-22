'use client';

import { useEffect, useState } from 'react';
import { FiChevronDown, FiDownload, FiX } from 'react-icons/fi';

interface WelcomeTutorialProps {
  onClose: () => void;
  onInstall?: () => Promise<void>;
  canInstall?: boolean;
}

export default function WelcomeTutorial({ onClose, onInstall, canInstall = false }: WelcomeTutorialProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const collapseTimer = window.setTimeout(() => setCollapsed(true), 7000);
    const closeTimer = window.setTimeout(onClose, 14000);

    return () => {
      window.clearTimeout(collapseTimer);
      window.clearTimeout(closeTimer);
    };
  }, [onClose]);

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed bottom-5 left-1/2 z-50 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-primary-900 text-white shadow-lg transition hover:bg-primary-950"
        aria-label="Show Edau Farm install prompt"
        title="Show install prompt"
      >
        <FiChevronDown className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-2xl border border-primary-100 bg-white p-4 shadow-2xl">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-2 top-2 rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
        aria-label="Close install prompt"
      >
        <FiX className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-3 pr-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-800">
          <FiDownload className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-neutral-900">Thank you for visiting Edau Farm</p>
          <p className="mt-0.5 text-sm text-neutral-600">Install our app for quick access to farm-fresh products.</p>
        </div>
        {canInstall && onInstall && (
          <button
            type="button"
            onClick={onInstall}
            className="shrink-0 rounded-lg bg-primary-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-950"
          >
            Install
          </button>
        )}
      </div>
    </div>
  );
}
