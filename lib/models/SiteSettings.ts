import mongoose, { Schema, Document } from 'mongoose';

export interface ISiteSettings extends Document {
  id: string;
  key: string;
  value: string;
}

const siteSettingsSchema = new Schema<ISiteSettings>(
  {
    id: { type: String, required: true, unique: true, index: true },
    key: { type: String, required: true, unique: true, index: true },
    value: { type: String, required: true },
  },
  { timestamps: false }
);

export default mongoose.models.SiteSettings || mongoose.model<ISiteSettings>('SiteSettings', siteSettingsSchema);
