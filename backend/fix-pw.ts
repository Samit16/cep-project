import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import config from './src/config/env';
import User from './src/models/User';

async function fixPassword() {
  await mongoose.connect(config.databaseUrl);
  
  const hash = await bcrypt.hash('harshitvivek_123', 10);
  console.log('New bcrypt hash:', hash);
  
  // Use updateOne to bypass pre-save hook (which would double-hash)
  await User.updateOne({ username: 'harshitvivek_gala' }, { $set: { password: hash } });
  
  // Verify
  const user = await User.findOne({ username: 'harshitvivek_gala' });
  if (!user) { console.log('NOT FOUND'); process.exit(1); }
  
  console.log('Stored password starts with $2:', user.password.startsWith('$2'));
  const ok = await bcrypt.compare('harshitvivek_123', user.password);
  console.log('Verify bcrypt compare:', ok);
  
  process.exit(0);
}

fixPassword().catch(console.error);
