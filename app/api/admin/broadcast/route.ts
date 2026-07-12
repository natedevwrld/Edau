import { NextRequest, NextResponse } from 'next/server';
import { sendBroadcastEmail, sendHarvestNotification } from '@/lib/resend';
import dbConnect from '@/lib/mongodb';
import NewsletterSubscriber from '@/lib/models/NewsletterSubscriber';
import BroadcastLog from '@/lib/models/BroadcastLog';
import { generateId } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { type, subject, title, content, ctaText, ctaUrl, products } = body;

    const subscribers = await NewsletterSubscriber.find({ is_active: true }).lean();

    if (subscribers.length === 0) {
      return NextResponse.json({ message: 'No active subscribers', sent: 0 });
    }

    const emails = subscribers.map((s) => s.email);

    if (type === 'harvest' && products) {
      await sendHarvestNotification(emails, products);
    } else if (type === 'custom' || type === 'general') {
      await sendBroadcastEmail(emails, {
        subject,
        title: title || 'News from Edau Farm',
        content: content || '',
        ctaText,
        ctaUrl,
      });
    } else {
      return NextResponse.json({ error: 'Invalid broadcast type' }, { status: 400 });
    }

    const log = new BroadcastLog({
      id: generateId(),
      type,
      subject: subject || title || 'Broadcast',
      recipients_count: emails.length,
    });

    await log.save();

    return NextResponse.json({
      success: true,
      message: `Broadcast sent to ${emails.length} subscribers`,
      recipients: emails.length,
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    return NextResponse.json({ error: 'Failed to send broadcast' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await dbConnect();

    const subscribers = await NewsletterSubscriber.find({ is_active: true })
      .sort({ subscribed_at: -1 })
      .limit(50)
      .lean();

    const total = await NewsletterSubscriber.countDocuments({ is_active: true });

    return NextResponse.json({
      subscribers,
      total: total || 0,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
