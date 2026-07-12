import mongoose, { Schema, Document } from 'mongoose';

export interface IBroadcastLog extends Document {
  id: string;
  type: string;
  subject: string;
  recipients_count: number;
  sent_at: Date;
}

const broadcastLogSchema = new Schema<IBroadcastLog>(
  {
    id: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true },
    subject: { type: String, required: true },
    recipients_count: { type: Number, required: true },
  },
  { timestamps: { createdAt: 'sent_at', updatedAt: false } }
);

broadcastLogSchema.index({ sent_at: -1 });

export default mongoose.models.BroadcastLog || mongoose.model<IBroadcastLog>('BroadcastLog', broadcastLogSchema);
