'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ChevronLeft, Save } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';

type VisitStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

type FarmVisit = {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  package: string;
  guests: number;
  message: string;
  status: VisitStatus;
  admin_notes: string;
  created_at: string;
};

const statusOptions: VisitStatus[] = ['pending', 'confirmed', 'completed', 'cancelled'];

export default function AdminFarmVisitsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [visits, setVisits] = useState<FarmVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadVisits = async () => {
    try {
      const response = await fetch('/api/farm-visits');
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to load bookings.');
      setVisits(result.visits);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'admin')) {
      router.push(status === 'unauthenticated' ? '/auth/signin' : '/dashboard');
    } else if (status === 'authenticated') {
      loadVisits();
    }
  }, [status, session]);

  const updateVisit = async (visit: FarmVisit) => {
    setSavingId(visit.id);
    try {
      const response = await fetch('/api/farm-visits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visit),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update booking.');
      setVisits((current) => current.map((item) => item.id === visit.id ? result.visit : item));
      toast.success('Booking updated.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update booking.');
    } finally {
      setSavingId(null);
    }
  };

  if (status === 'loading' || loading) {
    return <DashboardLayout role="admin"><LoadingSpinner /></DashboardLayout>;
  }

  return (
    <DashboardLayout role="admin">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ChevronLeft className="h-5 w-5" /> Back to Dashboard
        </Link>
      </div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Farm Visit Bookings</h1>
        <p className="mt-1 text-gray-600">Review requests and update dates, packages, guests, status, and notes.</p>
      </div>

      <div className="space-y-4">
        {visits.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center text-gray-600 shadow">No farm visit bookings yet.</div>
        ) : visits.map((visit) => (
          <div key={visit.id} className="rounded-xl bg-white p-6 shadow">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{visit.name}</h2>
                <p className="text-sm text-gray-600">{visit.email} · {visit.phone}</p>
                <p className="mt-1 text-xs text-gray-500">Requested {new Date(visit.created_at).toLocaleString()}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${visit.status === 'confirmed' ? 'bg-green-100 text-green-800' : visit.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {visit.status}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <label className="text-sm font-medium text-gray-700">Visit date
                <input type="date" value={visit.date} onChange={(event) => setVisits((items) => items.map((item) => item.id === visit.id ? { ...item, date: event.target.value } : item))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal" />
              </label>
              <label className="text-sm font-medium text-gray-700">Package
                <input value={visit.package} onChange={(event) => setVisits((items) => items.map((item) => item.id === visit.id ? { ...item, package: event.target.value } : item))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal" />
              </label>
              <label className="text-sm font-medium text-gray-700">Guests
                <input type="number" min="1" max="20" value={visit.guests} onChange={(event) => setVisits((items) => items.map((item) => item.id === visit.id ? { ...item, guests: Number(event.target.value) } : item))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal" />
              </label>
              <label className="text-sm font-medium text-gray-700">Status
                <select value={visit.status} onChange={(event) => setVisits((items) => items.map((item) => item.id === visit.id ? { ...item, status: event.target.value as VisitStatus } : item))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal">
                  {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            </div>
            <label className="mt-4 block text-sm font-medium text-gray-700">Customer request
              <textarea value={visit.message || ''} onChange={(event) => setVisits((items) => items.map((item) => item.id === visit.id ? { ...item, message: event.target.value } : item))} rows={2} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal" />
            </label>
            <label className="mt-4 block text-sm font-medium text-gray-700">Admin notes
              <textarea value={visit.admin_notes || ''} onChange={(event) => setVisits((items) => items.map((item) => item.id === visit.id ? { ...item, admin_notes: event.target.value } : item))} rows={2} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal" />
            </label>
            <button type="button" onClick={() => updateVisit(visit)} disabled={savingId === visit.id} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
              <Save className="h-4 w-4" /> {savingId === visit.id ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
