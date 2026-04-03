import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  memberId: string;
  action: string;
  payload: string; // JSON string
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema({
  memberId: { type: String, required: true },
  action: { type: String, required: true },
  payload: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
