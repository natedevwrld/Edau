import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import FarmVisit, { FarmVisitStatus } from '@/lib/models/FarmVisit';
import { generateId } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const statuses: FarmVisitStatus[] = ['pending', 'confirmed', 'completed', 'cancelled'];

function isAdmin(session: any) {
  return session?.user?.role === 'admin';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const date = String(body.date || '').trim();
    const packageName = String(body.package || '').trim();
    const guests = Number(body.guests);
    const message = String(body.message || '').trim();

    if (!name || !email || !phone || !date || !packageName || !Number.isInteger(guests) || guests < 1 || guests > 20) {
      return NextResponse.json({ error: 'Please provide all required booking details.' }, { status: 400 });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    await dbConnect();
    const visit = await FarmVisit.create({
      id: generateId(),
      name,
      email,
      phone,
      date,
      package: packageName,
      guests,
      message,
    });

    return NextResponse.json({ booking: { id: visit.id }, message: 'Booking request submitted.' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to submit booking request.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });

    await dbConnect();
    const visits = await FarmVisit.find().sort({ created_at: -1 }).lean();
    return NextResponse.json({ visits });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load farm visits.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });

    const body = await request.json();
    const id = String(body.id || '').trim();
    if (!id) return NextResponse.json({ error: 'Booking id is required.' }, { status: 400 });

    const updates: Record<string, unknown> = {};
    if (body.date !== undefined) updates.date = String(body.date).trim();
    if (body.package !== undefined) updates.package = String(body.package).trim();
    if (body.guests !== undefined) {
      const guests = Number(body.guests);
      if (!Number.isInteger(guests) || guests < 1 || guests > 20) {
        return NextResponse.json({ error: 'Guests must be between 1 and 20.' }, { status: 400 });
      }
      updates.guests = guests;
    }
    if (body.status !== undefined) {
      if (!statuses.includes(body.status)) return NextResponse.json({ error: 'Invalid booking status.' }, { status: 400 });
      updates.status = body.status;
    }
    if (body.message !== undefined) updates.message = String(body.message).trim();
    if (body.admin_notes !== undefined) updates.admin_notes = String(body.admin_notes).trim();

    await dbConnect();
    const visit = await FarmVisit.findOneAndUpdate({ id }, updates, { new: true, runValidators: true }).lean();
    if (!visit) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });

    return NextResponse.json({ visit });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update booking.' }, { status: 500 });
  }
}
