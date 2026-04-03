import mongoose, { Schema, Document } from 'mongoose';

export interface IMember extends Document {
  name: string;
  contact_no: string; // Encrypted phone number
  email: string;
  occupation: string;
  marital_status: string;
  current_place: string;
  kutch_town: string;
  family_members: string[]; // Can be adjusted if more complex
  if_alive: boolean;
  active: boolean;
  contact_visibility: 'public' | 'private';
}

const MemberSchema: Schema = new Schema({
  name: { type: String, required: true },
  contact_no: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  occupation: { type: String },
  marital_status: { type: String },
  current_place: { type: String },
  kutch_town: { type: String },
  family_members: { type: [String], default: [] },
  if_alive: { type: Boolean, default: true },
  active: { type: Boolean, default: true },
  contact_visibility: { type: String, enum: ['public', 'private'], default: 'private' },
}, { timestamps: true });

export default mongoose.model<IMember>('Member', MemberSchema);
