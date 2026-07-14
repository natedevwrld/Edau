import mongoose, { Schema, Document } from 'mongoose';

export interface IAIUsageLog extends Document {
  userId: string | null;
  sessionId: string;
  feature: 'chat' | 'captions' | 'description';
  aiModel: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  createdAt: Date;
}

const aiUsageLogSchema = new Schema<IAIUsageLog>(
  {
    userId: { type: String, default: null, index: true },
    sessionId: { type: String, default: 'anonymous', index: true },
    feature: { type: String, enum: ['chat', 'captions', 'description'], default: 'chat', index: true },
    aiModel: { type: String, default: 'gemini-2.0-flash' },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

export default mongoose.models.AIUsageLog || mongoose.model<IAIUsageLog>('AIUsageLog', aiUsageLogSchema);
