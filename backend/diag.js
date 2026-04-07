require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const dbUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/kjo_samaj';

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String,
  member_id: mongoose.Schema.Types.ObjectId,
  is_first_login: Boolean,
  is_active: Boolean,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const adminSchema = new mongoose.Schema({
  username: String,
  passwordHash: String,
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);

async function run() {
  await mongoose.connect(dbUrl);
  console.log('Connected to: ' + dbUrl);
  
  const users = await User.find({ role: 'committee' }).lean();
  console.log('COMMITTEE_COUNT=' + users.length);
  
  for (const u of users) {
    console.log('---');
    console.log('USERNAME=' + u.username);
    console.log('PASSWORD_RAW=' + u.password);
    console.log('PASSWORD_LENGTH=' + u.password.length);
    const isBcrypt = u.password.charAt(0) === '$' && u.password.charAt(1) === '2';
    console.log('IS_BCRYPT=' + isBcrypt);
    console.log('IS_FIRST_LOGIN=' + u.is_first_login);
    console.log('IS_ACTIVE=' + u.is_active);
    console.log('MEMBER_ID=' + u.member_id);
    
    const testPw = 'harshitvivek_123';
    try {
      const match = await bcrypt.compare(testPw, u.password);
      console.log('MATCH_harshitvivek_123=' + match);
    } catch(e) {
      console.log('BCRYPT_ERROR=' + e.message);
    }
  }
  
  const admins = await Admin.find({}).lean();
  console.log('---');
  console.log('ADMIN_COUNT=' + admins.length);
  for (const a of admins) {
    console.log('ADMIN_USER=' + a.username);
  }
  
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
