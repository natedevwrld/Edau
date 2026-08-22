'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ChevronLeft, Minus, Plus, Search, ShoppingCart, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatPrice } from '@/lib/utils';

type Product = { id: string; name: string; price: number; quantity: number; unit_type?: string; images?: string[] };
type CartLine = Product & { orderedQuantity: number };

export default function AdminPosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', address: '', city: '', county: '', paymentMethod: 'cash', paymentReference: '', notes: '' });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin?callbackUrl=/admin/pos');
    else if (status === 'authenticated' && session?.user?.role !== 'admin') router.push('/dashboard');
    else if (status === 'authenticated') {
      loadProducts();
    }
  }, [status, session, router, page, query]);

  const loadProducts = async () => {
      const params = new URLSearchParams({ page: String(page), limit: '12' });
      if (query.trim()) params.set('search', query.trim());

      fetch(`/api/products?${params.toString()}`).then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to load products.');
        setProducts(result.products || []);
        setTotalPages(result.pagination?.pages || 1);
      }).catch((error) => toast.error(error.message)).finally(() => setLoading(false));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.orderedQuantity, 0);

  const addProduct = (product: Product) => {
    setCart((items) => {
      const existing = items.find((item) => item.id === product.id);
      if (existing) return items.map((item) => item.id === product.id ? { ...item, orderedQuantity: Math.min(item.orderedQuantity + 1, product.quantity) } : item);
      return [...items, { ...product, orderedQuantity: 1 }];
    });
  };

  const changeQuantity = (id: string, delta: number) => setCart((items) => items.map((item) => item.id === id ? { ...item, orderedQuantity: Math.max(0, Math.min(item.orderedQuantity + delta, item.quantity)) } : item).filter((item) => item.orderedQuantity > 0));

  const submitOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!customer.name || !customer.email || !customer.phone || cart.length === 0) {
      toast.error('Enter customer details and add at least one product.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/pos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...customer, items: cart.map((item) => ({ productId: item.id, quantity: item.orderedQuantity })) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to save POS order.');
      toast.success(`Order #${result.order.order_number} saved.`);
      setCart([]);
      setCustomer({ name: '', email: '', phone: '', address: '', city: '', county: '', paymentMethod: 'cash', paymentReference: '', notes: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to save POS order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) return <DashboardLayout role="admin"><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout role="admin">
      <div className="mb-6 flex items-center gap-4"><Link href="/admin" className="flex items-center gap-2 text-gray-600 hover:text-gray-900"><ChevronLeft className="h-5 w-5" /> Back to Dashboard</Link></div>
      <div className="mb-6"><h1 className="text-3xl font-bold text-gray-900">Point of Sale</h1><p className="mt-1 text-gray-600">Create an in-person order for a registered or guest customer.</p></div>
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="rounded-xl bg-white p-6 shadow">
          <div className="relative mb-5"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search products" className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4" /></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => <button type="button" key={product.id} onClick={() => addProduct(product)} className="rounded-lg border border-gray-200 p-4 text-left transition hover:border-primary-500 hover:shadow"><span className="block font-semibold text-gray-900">{product.name}</span><span className="mt-1 block text-sm text-primary-700">{formatPrice(product.price)} / {product.unit_type || 'piece'}</span><span className="mt-1 block text-xs text-gray-500">Stock: {product.quantity}</span></button>)}
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </section>
        <form onSubmit={submitOrder} className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold"><ShoppingCart className="h-5 w-5" /> Current order</h2>
          <div className="mb-5 space-y-2">{cart.length === 0 ? <p className="text-sm text-gray-500">Select products to begin.</p> : cart.map((item) => <div key={item.id} className="flex items-center gap-2 border-b pb-2"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.name}</p><p className="text-xs text-gray-500">{formatPrice(item.price)} each</p></div><button type="button" onClick={() => changeQuantity(item.id, -1)} className="rounded p-1 hover:bg-gray-100" aria-label={`Remove one ${item.name}`}><Minus className="h-4 w-4" /></button><span className="w-5 text-center text-sm">{item.orderedQuantity}</span><button type="button" onClick={() => changeQuantity(item.id, 1)} className="rounded p-1 hover:bg-gray-100" aria-label={`Add one ${item.name}`}><Plus className="h-4 w-4" /></button><button type="button" onClick={() => setCart((items) => items.filter((line) => line.id !== item.id))} className="rounded p-1 text-red-600 hover:bg-red-50" aria-label={`Remove ${item.name}`}><Trash2 className="h-4 w-4" /></button></div>)}</div>
          <div className="mb-5 border-b pb-4 text-right text-lg font-bold">Total: {formatPrice(total)}</div>
          <div className="space-y-3">{([['name', 'Customer name'], ['email', 'Customer email'], ['phone', 'Customer phone'], ['address', 'Address'], ['city', 'City'], ['county', 'County']] as const).map(([field, label]) => <input key={field} type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'} required={field === 'name' || field === 'email' || field === 'phone'} value={customer[field]} onChange={(event) => setCustomer({ ...customer, [field]: event.target.value })} placeholder={label} className="w-full rounded-lg border border-gray-300 px-3 py-2" />)}
            <select value={customer.paymentMethod} onChange={(event) => setCustomer({ ...customer, paymentMethod: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2"><option value="cash">Cash (paid)</option><option value="mpesa">M-Pesa</option><option value="paybill">Paybill</option></select>
            <input value={customer.paymentReference} onChange={(event) => setCustomer({ ...customer, paymentReference: event.target.value })} placeholder="Payment reference (optional)" className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            <textarea value={customer.notes} onChange={(event) => setCustomer({ ...customer, notes: event.target.value })} placeholder="Order notes" rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            <button type="submit" disabled={submitting || cart.length === 0} className="w-full rounded-lg bg-primary-600 px-4 py-3 font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Saving...' : 'Save POS order'}</button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
