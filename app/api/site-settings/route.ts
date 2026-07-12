import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SiteSettings from '@/lib/models/SiteSettings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();

    const settings = await SiteSettings.find({}).lean();

    const settingsObject: Record<string, string> = {};
    settings.forEach((item) => {
      settingsObject[item.key] = item.value;
    });

    return NextResponse.json({ settings: settingsObject });
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    await SiteSettings.findOneAndUpdate(
      { key },
      { key, value },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating site settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
