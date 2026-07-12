import mongoose, { Schema, Document } from 'mongoose';

export interface ICartItem extends Document {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: Date;
  updated_at: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    id: { type: String, required: true, unique: true, index: true },
    user_id: { type: String, required: true, index: true },
    product_id: { type: String, required: true, index: true },
    quantity: { type: Number, required: true, default: 1 },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

cartItemSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

export default mongoose.models.CartItem || mongoose.model<ICartItem>('CartItem', cartItemSchema);
