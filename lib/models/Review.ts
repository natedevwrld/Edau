import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  is_verified_purchase: boolean;
  created_at: Date;
  updated_at: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    id: { type: String, required: true, unique: true, index: true },
    product_id: { type: String, required: true, index: true },
    user_id: { type: String, required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String },
    comment: { type: String, required: true },
    is_verified_purchase: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

reviewSchema.index({ product_id: 1, created_at: -1 });
reviewSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

export default mongoose.models.Review || mongoose.model<IReview>('Review', reviewSchema);
