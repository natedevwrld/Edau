import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import NewsletterSubscriber, { INewsletterSubscriber } from '@/lib/models/NewsletterSubscriber';
import { generateId } from '@/lib/utils';
import { sendWelcomeEmail } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { email, name, phone } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    const existing = (await NewsletterSubscriber.findOne({ email: emailLower }).lean()) as INewsletterSubscriber | null;

    if (existing) {
      if (existing.is_active) {
        return NextResponse.json(
          { message: 'Already subscribed', success: true },
          { status: 200 }
        );
      } else {
        await NewsletterSubscriber.updateOne(
          { email: emailLower },
          {
            is_active: true,
            unsubscribed_at: null,
            name: name || existing.name,
            phone: phone || existing.phone,
          }
        );
      }
    } else {
      const subscriber = new NewsletterSubscriber({
        id: generateId(),
        email: emailLower,
        name: name || null,
        phone: phone || null,
        is_active: true,
      });

      await subscriber.save();
    }

    sendWelcomeEmail(emailLower, name).catch((err) => {
      console.error('Failed to send welcome email:', err);
    });

    return NextResponse.json(
      { message: 'Successfully subscribed!', success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
