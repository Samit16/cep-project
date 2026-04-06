import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import config from './src/config/env';
import User from './src/models/User';
import SystemSetting from './src/models/SystemSetting';

async function debugAuth() {
  await mongoose.connect(config.databaseUrl);
  console.log('Connected to DB:', config.databaseUrl);

  // Find the committee user
  const user = await User.findOne({ username: 'harshitvivek_gala' });
  if (!user) {
    console.log('❌ User harshitvivek_gala NOT FOUND');
    process.exit(1);
  }

  console.log('\n=== Committee User ===');
  console.log('Username:', user.username);
  console.log('Role:', user.role);
  console.log('Password hash:', user.password);
  console.log('is_first_login:', user.is_first_login);
  console.log('is_active:', user.is_active);

  // Check SystemSetting for default password
  const settings = await SystemSetting.findOne();
  console.log('\n=== SystemSetting ===');
  if (settings) {
    console.log('default_password_hash:', (settings as any).default_password_hash);
    // Try comparing known default passwords
    const testPasswords = ['password', 'password123', '123456', 'admin123', 'kvjos2024', 'kvjos', 'default'];
    for (const p of testPasswords) {
      const match = await bcrypt.compare(p, (settings as any).default_password_hash);
      if (match) console.log(`✅ Default password matches: "${p}"`);
    }
  } else {
    console.log('No SystemSetting found');
  }

  // Try comparing passwords against the user's hash
  console.log('\n=== Testing passwords against user hash ===');
  const testPasswords = ['password', 'password123', '123456', 'admin123', 'kvjos2024', 'kvjos', 'default'];
  for (const p of testPasswords) {
    try {
      const match = await bcrypt.compare(p, user.password);
      if (match) console.log(`✅ User password matches: "${p}"`);
    } catch (e) {
      console.log(`Error comparing "${p}":`, (e as any).message);
    }
  }

  // Also test using comparePassword method
  console.log('\n=== Testing with comparePassword method ===');
  for (const p of testPasswords) {
    try {
      const match = await user.comparePassword(p);
      if (match) console.log(`✅ comparePassword matches: "${p}"`);
    } catch (e) {
      console.log(`Error with comparePassword "${p}":`, (e as any).message);
    }
  }

  process.exit(0);
}

debugAuth().catch(console.error);
