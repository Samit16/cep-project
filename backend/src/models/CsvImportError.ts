import mongoose, { Schema, Document } from 'mongoose';

export interface ICsvImportError extends Document {
  job_id: string;
  row_number: number;
  field_name: string;
  value: string;
  error_message: string;
  created_at: Date;
}

const CsvImportErrorSchema: Schema = new Schema({
  job_id: { type: String, required: true },
  row_number: { type: Number, required: true },
  field_name: { type: String },
  value: { type: String },
  error_message: { type: String },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model<ICsvImportError>('CsvImportError', CsvImportErrorSchema);
