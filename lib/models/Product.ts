import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  cost_price: number | null;
  quantity: number;
  unit_type: 'piece' | 'kg' | 'bunch' | 'sack' | 'crate' | 'litre' | 'dozen' | 'box';
  category_id: string | null;
  seller_id: string | null;
  origin_farm: string | null;
  harvest_date: string | null;
  is_organic: boolean;
  is_in_stock: boolean;
  is_featured: boolean;
  is_seasonal: boolean;
  images: string[];
  category: string | null;
  specifications: Array<{ key: string; value: string }>;
  tags: string[];
  rating_avg: number;
  rating_count: number;
  created_at: Date;
  updated_at: Date;
}

const productSchema = new Schema<IProduct>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    price: { type: Number, required: true },
    compare_at_price: { type: Number },
    cost_price: { type: Number },
    quantity: { type: Number, default: 0, index: true },
    unit_type: {
      type: String,
      enum: ['piece', 'kg', 'bunch', 'sack', 'crate', 'litre', 'dozen', 'box'],
      default: 'piece',
    },
    category_id: { type: String, index: true },
    seller_id: { type: String, index: true },
    origin_farm: { type: String },
    harvest_date: { type: String },
    is_organic: { type: Boolean, default: false },
    is_in_stock: { type: Boolean, default: true, index: true },
    is_featured: { type: Boolean, default: false, index: true },
    is_seasonal: { type: Boolean, default: false },
    images: [{ type: String }],
    category: { type: String },
    specifications: [{ key: { type: String }, value: { type: String } }],
    tags: [{ type: String }],
    rating_avg: { type: Number, default: 0 },
    rating_count: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

productSchema.index({ is_featured: 1, is_in_stock: 1, created_at: -1 });
productSchema.index({ category_id: 1, is_in_stock: 1 });
productSchema.index({ seller_id: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating_avg: -1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);
