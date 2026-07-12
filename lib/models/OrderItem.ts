import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem extends Document {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_type: string;
  price: number;
  subtotal: number;
  seller_id: string | null;
  created_at: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    id: { type: String, required: true, unique: true, index: true },
    order_id: { type: String, required: true, index: true },
    product_id: { type: String, index: true },
    product_name: { type: String, required: true },
    product_image: { type: String },
    quantity: { type: Number, required: true },
    unit_type: { type: String, default: 'piece' },
    price: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    seller_id: { type: String, index: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

orderItemSchema.index({ order_id: 1 });

export default mongoose.models.OrderItem || mongoose.model<IOrderItem>('OrderItem', orderItemSchema);
