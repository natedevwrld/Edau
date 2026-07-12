import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import Profile from '@/lib/models/Profile';
import { generateId } from '@/lib/utils';

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
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create user', message: error.message },
      { status: 500 }
    );
  }
}
