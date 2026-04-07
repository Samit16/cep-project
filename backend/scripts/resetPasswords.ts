/**
 * resetPasswords.ts
 * Resets all Admin and User documents to plain-text passwords.
 * Run once after switching away from bcrypt.
 *
 * Usage: npx ts-node --transpile-only scripts/resetPasswords.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../src/models/Admin';
import User from '../src/models/User';
import SystemSetting from '../src/models/SystemSetting';

dotenv.config();

const dbUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/kvjos_nagpur';

async function reset() {
  console.log('Connecting to:', dbUrl);
  await mongoose.connect(dbUrl);

  // ---- Reset admin account ----
  const adminResult = await Admin.findOneAndUpdate(
    { username: 'admin' },
    { username: 'admin', password: 'admin123' },
    { upsert: true, new: true }
  );
  console.log('✅ Admin reset → username: admin | password: admin123');

  // ---- Reset all committee/member Users to a known plain-text password ----
  // They can log in and change it via the update-credentials endpoint.
  const userResult = await User.updateMany(
    {},
    { $set: { password: 'password123' } }
  );
  console.log(`✅ Reset ${userResult.modifiedCount} User(s) → password: password123`);

  // ---- Reset default member password ----
  await SystemSetting.findOneAndUpdate(
    {},
    { default_password: 'member123' },
    { upsert: true, new: true }
  );
  console.log('✅ Default member password → member123');

  console.log('\nDone! Share the credentials with your team:');
  console.log('  Admin login     →  admin / admin123');
  console.log('  Committee login →  <their username> / password123');
  console.log('  Member login    →  <firstname_lastname> / member123');

  await mongoose.disconnect();
}

reset().catch(err => {
  console.error('Reset failed:', err);
  process.exit(1);
});
