import mongoose, { Schema, Document } from 'mongoose';

export interface ICaptionHistory extends Document {
  userId: string | null;
  productName: string;
  productDescription?: string;
  style: string;
  audience: string;
  additionalNotes?: string;
  captions: { caption: string; hashtags: string[] }[];
  aiModel: string;
  createdAt: Date;
}

const captionHistorySchema = new Schema<ICaptionHistory>(
  {
    userId: { type: String, default: null, index: true },
    productName: { type: String, required: true },
    productDescription: { type: String },
    style: { type: String, default: 'market' },
    audience: { type: String, default: 'families' },
    additionalNotes: { type: String },
    captions: {
      type: [
        {
          caption: { type: String, required: true },
          hashtags: { type: [String], default: [] },
        },
      ],
      default: [],
    },
    aiModel: { type: String, default: 'gemini-2.0-flash' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

// Latest first when querying by createdAt desc.
captionHistorySchema.index({ createdAt: -1 });

export default mongoose.models.CaptionHistory ||
  mongoose.model<ICaptionHistory>('CaptionHistory', captionHistorySchema);
