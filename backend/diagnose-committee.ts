import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import config from './src/config/env';
import User from './src/models/User';
import Admin from './src/models/Admin';

async function diagnose() {
  await mongoose.connect(config.databaseUrl);
  console.log('Connected to DB:', config.databaseUrl);
  console.log('');

  // 1. List ALL users in User collection
  const allUsers = await User.find({}).lean();
  console.log(`=== User collection (${allUsers.length} docs) ===`);
  for (const u of allUsers) {
    console.log(`  Username: ${u.username}`);
    console.log(`  Role: ${u.role}`);
    console.log(`  Password (raw): ${u.password}`);
    console.log(`  Password is bcrypt hash: ${u.password.startsWith('$2')}`);
    console.log(`  is_first_login: ${u.is_first_login}`);
    console.log(`  is_active: ${u.is_active}`);
    console.log(`  member_id: ${u.member_id}`);
    console.log(`  _id: ${u._id}`);
    console.log('');
  }

  // 2. List ALL admins
  const allAdmins = await Admin.find({}).lean();
  console.log(`=== Admin collection (${allAdmins.length} docs) ===`);
  for (const a of allAdmins) {
    console.log(`  Username: ${(a as any).username}`);
    console.log(`  passwordHash: ${(a as any).passwordHash}`);
    console.log('');
  }

  // 3. Test password for committee user
  const committeeUsers = allUsers.filter(u => u.role === 'committee');
  console.log(`=== Testing committee user passwords ===`);
  for (const u of committeeUsers) {
    const testPasswords = ['harshitvivek_123', 'password', 'admin', '123456'];
    console.log(`User: ${u.username}`);
    console.log(`  Stored password: ${u.password}`);
    
    // Test if password is plain text (not hashed)
    if (!u.password.startsWith('$2')) {
      console.log(`  ⚠️ PASSWORD IS PLAIN TEXT, NOT A BCRYPT HASH!`);
      console.log(`  The comparePassword method will ALWAYS FAIL because bcrypt.compare expects a hash.`);
    }
    
    for (const testPw of testPasswords) {
      try {
        const result = await bcrypt.compare(testPw, u.password);
        console.log(`  bcrypt.compare('${testPw}', storedHash) = ${result}`);
      } catch (err: any) {
        console.log(`  bcrypt.compare('${testPw}', storedHash) = ERROR: ${err.message}`);
      }
    }
    
    // Also test via Mongoose model method
    const userDoc = await User.findById(u._id);
    if (userDoc) {
      for (const testPw of testPasswords) {
        try {
          const result = await userDoc.comparePassword(testPw);
          console.log(`  model.comparePassword('${testPw}') = ${result}`);
        } catch (err: any) {
          console.log(`  model.comparePassword('${testPw}') = ERROR: ${err.message}`);
        }
      }
    }
    console.log('');
  }

  await mongoose.disconnect();
  process.exit(0);
}

diagnose().catch(err => { console.error(err); process.exit(1); });
