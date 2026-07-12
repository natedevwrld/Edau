import mongoose, { Schema, Document } from 'mongoose';

export interface IMarketPrice extends Document {
  id: string;
  commodity: string;
  category: string | null;
  region: string;
  market_name: string | null;
  price: number;
  unit: string;
  currency: string;
  price_date: Date;
  change_percent: number | null;
  source: string | null;
  created_at: Date;
}

const marketPriceSchema = new Schema<IMarketPrice>(
  {
    id: { type: String, required: true, unique: true, index: true },
    commodity: { type: String, required: true, index: true },
    category: { type: String, index: true },
    region: { type: String, required: true, index: true },
    market_name: { type: String },
    price: { type: Number, required: true },
    unit: { type: String, required: true },
    currency: { type: String, default: 'KES' },
    price_date: { type: Date, required: true, index: true },
    change_percent: { type: Number },
    source: { type: String },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

marketPriceSchema.index({ commodity: 1, region: 1, price_date: -1 });

export default mongoose.models.MarketPrice || mongoose.model<IMarketPrice>('MarketPrice', marketPriceSchema);
