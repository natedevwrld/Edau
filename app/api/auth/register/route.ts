import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import Profile from '@/lib/models/Profile';
import { generateId } from '@/lib/utils';

function isDatabaseUnavailableError(error: unknown) {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes('trouble reaching') ||
    message.includes('database is not configured') ||
    message.includes('environment variable') ||
    message.includes('enotfound') ||
    message.includes('econnrefused') ||
    message.includes('timed out') ||
    message.includes('mongodb') ||
    message.includes('connection')
  );
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { name, email, phone, password, role, farmName, farmLocation } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    const existingUser = await Profile.findOne({ email: emailLower });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const profile = new Profile({
      id: generateId(),
      email: emailLower,
      full_name: name,
      phone: phone || null,
      password: hashedPassword,
      role: role || 'buyer',
      farm_name: farmName || null,
      farm_location: farmLocation || null,
      is_verified: false,
    });

    await profile.save();

    return NextResponse.json(
      {
        message: 'Registration successful.',
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.full_name,
        },
        requiresVerification: false,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json(
        {
          error: 'Our service is temporarily unavailable. Please try again shortly.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
