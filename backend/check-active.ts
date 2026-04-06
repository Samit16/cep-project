import mongoose from 'mongoose';
import config from './src/config/env';
import Member from './src/models/Member';

async function checkActive() {
  await mongoose.connect(config.databaseUrl);
  const total = await Member.countDocuments();
  const active = await Member.countDocuments({ active: true });
  const inactive = await Member.countDocuments({ active: false });
  const noField = await Member.countDocuments({ active: { $exists: false } });
  const nullField = await Member.countDocuments({ active: null });
  console.log(`Total: ${total}, Active: ${active}, Inactive: ${inactive}, No field: ${noField}, Null: ${nullField}`);
  process.exit(0);
}
checkActive().catch(console.error);
