import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemSetting extends Document {
  default_password_hash: string;
}

const SystemSettingSchema = new Schema<ISystemSetting>(
  {
    default_password_hash: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ISystemSetting>('SystemSetting', SystemSettingSchema);
