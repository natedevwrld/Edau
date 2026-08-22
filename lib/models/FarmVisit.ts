import mongoose, { Document, Schema } from 'mongoose';

export type FarmVisitStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface IFarmVisit extends Document {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  package: string;
  guests: number;
  message: string;
  status: FarmVisitStatus;
  admin_notes: string;
  created_at: Date;
  updated_at: Date;
}

const farmVisitSchema = new Schema<IFarmVisit>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    package: { type: String, required: true, trim: true },
    guests: { type: Number, required: true, min: 1, max: 20 },
    message: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    admin_notes: { type: String, default: '', trim: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

farmVisitSchema.index({ date: 1, status: 1 });
farmVisitSchema.index({ created_at: -1 });

export default mongoose.models.FarmVisit || mongoose.model<IFarmVisit>('FarmVisit', farmVisitSchema);
