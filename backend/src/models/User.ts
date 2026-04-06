import mongoose, { Document, Schema, Types } from 'mongoose';
import bcrypt from 'bcrypt';

export type UserRole = 'member' | 'committee';

export interface IUser extends Document {
  username: string;
  password: string;
  role: UserRole;
  member_id: Types.ObjectId | null;
  is_first_login: boolean;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(entered: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    username:       { type: String, required: true, unique: true, trim: true },
    password:       { type: String, required: true },
    role:           { type: String, enum: ['member', 'committee'], required: true },
    member_id:      { type: Schema.Types.ObjectId, ref: 'Member', default: null },
    is_first_login: { type: Boolean, default: true },
    is_active:      { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Auto-hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Method to verify password on login
userSchema.methods.comparePassword = async function (entered: string): Promise<boolean> {
  return bcrypt.compare(entered, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
