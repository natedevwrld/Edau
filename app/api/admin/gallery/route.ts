import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import SiteSettings from '@/lib/models/SiteSettings';
import { v2 as cloudinary } from 'cloudinary';
import { isAdmin } from '@/lib/roleCheck';
import { generateId } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const KEY = 'gallery_images';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function extractPublicId(url?: string): string {
  if (!url) return '';
  const u = url.split('?')[0];
  const marker = '/upload/';
  const idx = u.indexOf(marker);
  if (idx === -1) return '';
  let rest = u.substring(idx + marker.length);
  rest = rest.replace(/^v[0-9]+\//, '');
  rest = rest.replace(/\.[a-zA-Z0-9]+$/, '');
  return rest;
}

async function readGallery(): Promise<any[]> {
  await dbConnect();
  const record = await SiteSettings.findOne({ key: KEY }).lean<any>();
  let raw = typeof record?.value === 'string' ? record.value : '';
  if (!raw && record?.value) {
    raw = JSON.stringify(record.value);
  }
  let arr: any[] = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) arr = parsed;
      else if (parsed && typeof parsed === 'object') arr = [parsed];
    } catch {
      arr = [];
    }
  }
  return arr
    .map((item) => {
      if (typeof item === 'string') {
        return {
          id: generateId(),
          src: item,
          publicId: extractPublicId(item),
          alt: '',
          title: '',
          description: '',
        };
      }
      if (!item || typeof item !== 'object') return null;
      const src = item.src || item.secure_url || item.url || '';
      if (!src) return null;
      return {
        id: item.id || generateId(),
        src,
        publicId: item.publicId || item.public_id || extractPublicId(src),
        alt: item.alt || item.alt_text || '',
        title: item.title || '',
        description: item.description || item.caption || '',
      };
    })
    .filter(Boolean);
}

async function writeGallery(items: any[]) {
  await dbConnect();
  await SiteSettings.findOneAndUpdate(
    { key: KEY },
    { key: KEY, value: JSON.stringify(items), id: KEY },
    { upsert: true, new: true }
  );
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const profile = await (await import('@/lib/models/Profile')).default.findOne({ id: session.user.id }).lean();
    if ((profile as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }
    const items = await readGallery();
    return NextResponse.json({ images: items });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to load gallery', message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const profile = await (await import('@/lib/models/Profile')).default.findOne({ id: session.user.id }).lean();
    if ((profile as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const incoming: any[] = Array.isArray(body.items) ? body.items : [];
    if (incoming.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    const existing = await readGallery();
    const merged = [
      ...existing,
      ...incoming.map((item) => ({
        id: generateId(),
        src: item.src,
        publicId: item.publicId || extractPublicId(item.src),
        alt: item.alt || '',
        title: item.title || '',
        description: item.description || '',
      })),
    ];
    await writeGallery(merged);
    return NextResponse.json({ images: merged, message: `${incoming.length} image(s) added` });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to add images', message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const profile = await (await import('@/lib/models/Profile')).default.findOne({ id: session.user.id }).lean();
    if ((profile as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { id, alt, title, description } = body;
    if (!id) {
      return NextResponse.json({ error: 'Image id is required' }, { status: 400 });
    }

    const existing = await readGallery();
    const next = existing.map((item) =>
      item.id === id
        ? {
            ...item,
            alt: alt ?? item.alt,
            title: title ?? item.title,
            description: description ?? item.description,
          }
        : item
    );
    await writeGallery(next);
    return NextResponse.json({ images: next, message: 'Image updated' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update image', message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const profile = await (await import('@/lib/models/Profile')).default.findOne({ id: session.user.id }).lean();
    if ((profile as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { id, publicId } = body;
    if (!id) {
      return NextResponse.json({ error: 'Image id is required' }, { status: 400 });
    }

    const existing = await readGallery();
    const target = existing.find((item) => item.id === id);
    const toDelete = publicId || target?.publicId || extractPublicId(target?.src);

    if (toDelete) {
      try {
        await cloudinary.uploader.destroy(toDelete);
      } catch (err) {
        console.error('Failed to delete Cloudinary asset:', toDelete, err);
      }
    }

    const next = existing.filter((item) => item.id !== id);
    await writeGallery(next);
    return NextResponse.json({ images: next, message: 'Image deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete image', message: error.message }, { status: 500 });
  }
}
