import mongoose, { Schema, Document } from 'mongoose';

export interface IProfile extends Document {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: 'buyer' | 'seller' | 'farmer' | 'admin';
  farm_name: string | null;
  farm_location: string | null;
  farm_description: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  password?: string;
  created_at: Date;
  updated_at: Date;
}

const profileSchema = new Schema<IProfile>(
  {
    id: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    full_name: { type: String },
    phone: { type: String },
    role: {
      type: String,
      enum: ['buyer', 'seller', 'farmer', 'admin'],
      default: 'buyer',
      index: true,
    },
    farm_name: { type: String },
    farm_location: { type: String },
    farm_description: { type: String },
    avatar_url: { type: String },
    is_verified: { type: Boolean, default: false },
    password: { type: String, required: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

profileSchema.index({ email: 1 });
profileSchema.index({ role: 1 });

export default mongoose.models.Profile || mongoose.model<IProfile>('Profile', profileSchema);
