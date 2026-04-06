import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import config from './src/config/env';
import User from './src/models/User';

async function verify() {
  await mongoose.connect(config.databaseUrl);
  const user = await User.findOne({ username: 'harshitvivek_gala' });
  if (!user) { console.log('NOT FOUND'); process.exit(1); }

  console.log('Hash stored:', user.password);
  console.log('Is bcrypt hash:', user.password.startsWith('$2'));

  const direct = await bcrypt.compare('harshitvivek_123', user.password);
  console.log('Direct bcrypt compare with harshitvivek_123:', direct);

  const method = await user.comparePassword('harshitvivek_123');
  console.log('comparePassword with harshitvivek_123:', method);

  process.exit(0);
}
verify().catch(console.error);
