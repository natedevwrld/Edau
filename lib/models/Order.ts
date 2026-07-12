import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  id: string;
  order_number: string;
  buyer_id: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: string | null;
  payment_reference: string | null;
  subtotal: number;
  shipping_fee: number;
  tax: number;
  total: number;
  currency: string;
  shipping_address: Record<string, any> | null;
  billing_address: Record<string, any> | null;
  notes: string | null;
  delivered_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    id: { type: String, required: true, unique: true, index: true },
    order_number: { type: String, required: true, unique: true, index: true },
    buyer_id: { type: String, required: true, index: true },
    status: { 
      type: String, 
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
      index: true
    },
    payment_status: { 
      type: String, 
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true
    },
    payment_method: { type: String },
    payment_reference: { type: String, index: true },
    subtotal: { type: Number, required: true },
    shipping_fee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: 'KES' },
    shipping_address: { type: Schema.Types.Mixed },
    billing_address: { type: Schema.Types.Mixed },
    notes: { type: String },
    delivered_at: { type: Date },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// Compound indexes for common queries
orderSchema.index({ buyer_id: 1, created_at: -1 });
orderSchema.index({ status: 1, created_at: -1 });
orderSchema.index({ payment_status: 1, status: 1 });

export default mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);
