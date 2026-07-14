import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipient: string; // user id, or 'admin' for admin-wide notices
  type: string; // order | product_approved | product_rejected | payment | system
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: { type: String, required: true, index: true },
    type: { type: String, default: 'system', index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export default mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', notificationSchema);
