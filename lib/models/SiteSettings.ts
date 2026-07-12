import mongoose, { Schema, Document } from 'mongoose';

export interface ISiteSettings extends Document {
  id: string;
  key: string;
  value: string;
}

const siteSettingsSchema = new Schema<ISiteSettings>(
  {
    id: {
      type: String,
      unique: true,
      index: true,
      default: () => `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    },
    key: { type: String, required: true, unique: true, index: true },
    value: { type: String, required: true },
  },
  { timestamps: false }
);

export default mongoose.models.SiteSettings || mongoose.model<ISiteSettings>('SiteSettings', siteSettingsSchema);
