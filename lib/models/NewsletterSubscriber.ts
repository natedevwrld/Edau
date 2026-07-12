import mongoose, { Schema, Document } from 'mongoose';

export interface INewsletterSubscriber extends Document {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  is_active: boolean;
  subscribed_at: Date;
  unsubscribed_at: Date | null;
  updated_at: Date;
}

const newsletterSubscriberSchema = new Schema<INewsletterSubscriber>(
  {
    id: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String },
    phone: { type: String },
    is_active: { type: Boolean, default: true, index: true },
    unsubscribed_at: { type: Date },
  },
  { timestamps: { createdAt: 'subscribed_at', updatedAt: 'updated_at' } }
);

newsletterSubscriberSchema.index({ is_active: 1, subscribed_at: -1 });

export default mongoose.models.NewsletterSubscriber || mongoose.model<INewsletterSubscriber>('NewsletterSubscriber', newsletterSubscriberSchema);
