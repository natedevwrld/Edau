import dbConnect from '@/lib/mongodb';
import Notification from '@/lib/models/Notification';

interface CreateNotificationInput {
  recipient: string; // user id or 'admin'
  type?: string;
  title: string;
  message: string;
  link?: string;
}

/**
 * Persist an in-app notification. Fire-and-forget safe: never throws to the
 * caller so it can be called from order/product flows without blocking them.
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  try {
    await dbConnect();
    await Notification.create({
      recipient: input.recipient,
      type: input.type || 'system',
      title: input.title,
      message: input.message,
      link: input.link || '',
      read: false,
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}
