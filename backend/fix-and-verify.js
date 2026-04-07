require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const dbUrl = process.env.DATABASE_URL;

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String,
  member_id: mongoose.Schema.Types.ObjectId,
  is_first_login: Boolean,
  is_active: Boolean,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function run() {
  await mongoose.connect(dbUrl);
  
  const users = await User.find({ role: 'committee' }).lean();
  
  for (const u of users) {
    console.log('USERNAME: ' + u.username);
    console.log('PASSWORD FIRST 10 CHARS: ' + u.password.substring(0, 10));
    console.log('PASSWORD LAST 10 CHARS: ' + u.password.substring(u.password.length - 10));
    console.log('PASSWORD LENGTH: ' + u.password.length);
    
    // Fix: rehash with known password using updateOne (bypasses pre-save hook)
    const newHash = await bcrypt.hash('harshitvivek_123', 10);
    console.log('NEW HASH FIRST 10: ' + newHash.substring(0, 10));
    console.log('NEW HASH LENGTH: ' + newHash.length);
    
    // Verify new hash works
    const verify = await bcrypt.compare('harshitvivek_123', newHash);
    console.log('NEW HASH VERIFY: ' + verify);
    
    // Update directly in MongoDB (bypass Mongoose hooks)
    await User.collection.updateOne(
      { _id: u._id },
      { $set: { password: newHash, is_first_login: false } }
    );
    console.log('UPDATED in DB (bypassed hooks)');
    
    // Read back and verify
    const updated = await User.findById(u._id).lean();
    const finalVerify = await bcrypt.compare('harshitvivek_123', updated.password);
    console.log('FINAL VERIFY: ' + finalVerify);
    console.log('STORED HASH FIRST 10: ' + updated.password.substring(0, 10));
  }
  
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
