import mongoose, { Schema, Document } from 'mongoose';

export interface IMember extends Document {
  first_name: string;
  last_name: string;
  address: string;
  contact_numbers: string[]; // Encrypted phone numbers list
  email: string;
  occupation: string;
  marital_status: string;
  current_place: string;
  kutch_town: string;
  family_members: string[]; 
  is_alive: boolean;
  active: boolean;
  profile_complete: boolean;
  contact_visibility: 'public' | 'private';
}

const MemberSchema: Schema = new Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  address: { type: String },
  contact_numbers: { type: [String], required: true, default: [] },
  email: { type: String },
  occupation: { type: String },
  marital_status: { type: String },
  current_place: { type: String },
  kutch_town: { type: String },
  family_members: { type: [String], default: [] },
  is_alive: { type: Boolean, default: true },
  active: { type: Boolean, default: true },
  profile_complete: { type: Boolean, default: false },
  contact_visibility: { type: String, enum: ['public', 'private'], default: 'private' },
}, { timestamps: true });

export default mongoose.model<IMember>('Member', MemberSchema);
