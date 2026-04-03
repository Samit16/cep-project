import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description?: string;
  date: Date;
  location: string;
  isPublic: boolean;
}

const EventSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  isPublic: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model<IEvent>('Event', EventSchema);
