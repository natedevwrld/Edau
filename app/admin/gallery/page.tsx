'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { isAdmin } from '@/lib/roleCheck';
import toast from 'react-hot-toast';
import Link from 'next/link';
import axios from 'axios';
import {
  FiChevronLeft,
  FiUpload,
  FiTrash2,
  FiSave,
  FiImage,
  FiLink,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';

interface GalleryItem {
  id: string;
  src: string;
  publicId?: string;
  alt: string;
  title: string;
  description: string;
}

export default function AdminGalleryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/gallery');
    } else if (status === 'authenticated' && !isAdmin(session?.user?.role)) {
      toast.error('Access denied. Admin privileges required.');
      router.push('/dashboard');
    } else if (status === 'authenticated') {
      load();
    }
  }, [status, session, router]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/gallery');
      setImages(res.data.images || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append('files', f));
      const up = await axios.post('/api/cloudinary/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const urls = up.data.urls || [];
      if (urls.length === 0) throw new Error('No URLs returned');
      const items = urls.map((u: any) => ({
        src: u.url,
        publicId: u.publicId,
        title: '',
        alt: '',
        description: '',
      }));
      const res = await axios.post('/api/admin/gallery', { items });
      setImages(res.data.images || []);
      toast.success(`${items.length} image(s) uploaded`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to upload images');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const updateField = (id: string, field: keyof GalleryItem, value: string) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, [field]: value } : img)));
  };

  const handleSave = async (item: GalleryItem) => {
    setSavingId(item.id);
    try {
      const res = await axios.put('/api/admin/gallery', {
        id: item.id,
        title: item.title,
        alt: item.alt,
        description: item.description,
      });
      setImages(res.data.images || []);
      toast.success('Saved');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (item: GalleryItem) => {
    if (!confirm('Delete this image? This also removes it from Cloudinary.')) return;
    setDeletingId(item.id);
    try {
      const res = await axios.delete('/api/admin/gallery', {
        data: { id: item.id, publicId: item.publicId },
      });
      setImages(res.data.images || []);
      if (editingId === item.id) setEditingId(null);
      toast.success('Deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary-600 font-medium">Loading gallery…</p>
        </div>
      </div>
    );
  }

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl flex items-center justify-center text-white">
                <FiImage className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-primary-800">Platform Gallery</h1>
                <p className="text-gray-600">Manage the images shown across Edau Farm</p>
              </div>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-5 py-3 rounded-xl font-semibold hover:shadow-lg disabled:opacity-50"
            >
              <FiUpload className="w-5 h-5" />
              {uploading ? 'Uploading…' : 'Upload Images'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleUpload}
            />
          </div>
        </div>

        {images.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-primary-100 p-12 text-center">
            <FiImage className="w-16 h-16 text-primary-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No images yet</h3>
            <p className="text-gray-600">Upload photos to build the public farm gallery.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {images.map((img) => {
              const isEditing = editingId === img.id;
              return (
                <div key={img.id} className="bg-white rounded-2xl shadow-lg border border-primary-100 overflow-hidden flex flex-col">
                  <button
                    onClick={() => setEditingId(isEditing ? null : img.id)}
                    className="relative aspect-[4/3] bg-neutral-100 text-left w-full"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.src} alt={img.alt || img.title || 'Gallery image'} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-4">
                      <span className="text-white text-sm font-medium flex items-center gap-1">
                        {isEditing ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                        {isEditing ? 'Close editor' : 'Edit details'}
                      </span>
                    </div>
                  </button>
                  {isEditing && (
                    <div className="p-4 flex flex-col gap-3 flex-1">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</label>
                        <input
                          value={img.title}
                          onChange={(e) => updateField(img.id, 'title', e.target.value)}
                          placeholder="e.g. Acacia Honey Harvest"
                          className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Alt text</label>
                        <input
                          value={img.alt}
                          onChange={(e) => updateField(img.id, 'alt', e.target.value)}
                          placeholder="Short description for accessibility"
                          className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</label>
                        <textarea
                          value={img.description}
                          onChange={(e) => updateField(img.id, 'description', e.target.value)}
                          rows={2}
                          placeholder="Optional caption shown in the gallery"
                          className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                        />
                      </div>
                      <div className="mt-auto flex items-center gap-2 pt-2">
                        <button
                          onClick={() => handleSave(img)}
                          disabled={savingId === img.id}
                          className="flex-1 inline-flex items-center justify-center gap-1 bg-primary-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                        >
                          <FiSave className="w-4 h-4" />
                          {savingId === img.id ? 'Saving…' : 'Save'}
                        </button>
                        <a
                          href={img.src}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50"
                          title="Open original"
                        >
                          <FiLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(img)}
                          disabled={deletingId === img.id}
                          className="inline-flex items-center justify-center gap-1 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50"
                          title="Delete"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
