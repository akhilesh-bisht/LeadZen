import mongoose, { Schema, Document, Model } from 'mongoose';
import { LeadStatus } from '../types/index.js';

export interface ILeadDocument extends Document {
  businessName: string;
  category: string;
  address?: string | null;
  city: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  facebook?: string | null;
  googleMapsUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  externalId?: string | null;
  source: string;
  status: LeadStatus;
  assignedTo?: string | null;
  assignedAt?: Date | null;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema: Schema<ILeadDocument> = new Schema<ILeadDocument>(
  {
    businessName: { type: String, required: true, trim: true, index: true },
    category: { type: String, default: 'General Business', trim: true, index: true },
    address: { type: String, default: null, trim: true },
    city: { type: String, required: true, trim: true, index: true },
    phone: { type: String, default: null, trim: true },
    email: { type: String, default: null, trim: true, lowercase: true },
    website: { type: String, default: null, trim: true },
    instagram: { type: String, default: null, trim: true },
    linkedin: { type: String, default: null, trim: true },
    facebook: { type: String, default: null, trim: true },
    googleMapsUrl: { type: String, default: null, trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    rating: { type: Number, default: null },
    reviewCount: { type: Number, default: null },
    externalId: { type: String, default: null, index: true },
    source: { type: String, default: 'OpenStreetMap' },
    status: {
      type: String,
      enum: ['new', 'contacted', 'interested', 'not_interested', 'converted'],
      default: 'new',
      index: true,
    },
    assignedTo: { type: String, default: null, index: true },
    assignedAt: { type: Date, default: null },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

// Compound index for duplicate detection
LeadSchema.index({ businessName: 1, city: 1 });
LeadSchema.index({ phone: 1 });
LeadSchema.index({ website: 1 });

export const Lead: Model<ILeadDocument> =
  (mongoose.models.Lead as Model<ILeadDocument>) ||
  mongoose.model<ILeadDocument>('Lead', LeadSchema);

