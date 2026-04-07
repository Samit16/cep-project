const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const config = require('./src/config/env').default;
const User = require('./src/models/User').default;

async function run() {
  await mongoose.connect(config.databaseUrl);
  
  const users = await User.find({ role: 'committee' }).lean();
  console.log('COMMITTEE_COUNT=' + users.length);
  
  for (const u of users) {
    console.log('---');
    console.log('USERNAME=' + u.username);
    console.log('PASSWORD_RAW=' + u.password);
    console.log('PASSWORD_LENGTH=' + u.password.length);
    console.log('IS_BCRYPT=' + u.password.startsWith('$2'));
    console.log('IS_FIRST_LOGIN=' + u.is_first_login);
    console.log('IS_ACTIVE=' + u.is_active);
    console.log('MEMBER_ID=' + u.member_id);
    
    const testPw = 'harshitvivek_123';
    try {
      const match = await bcrypt.compare(testPw, u.password);
      console.log('BCRYPT_COMPARE_' + testPw + '=' + match);
    } catch(e) {
      console.log('BCRYPT_ERROR=' + e.message);
    }
    
    // Try loading via model to test comparePassword
    const doc = await User.findById(u._id);
    if (doc) {
      try {
        const match2 = await doc.comparePassword(testPw);
        console.log('MODEL_COMPARE_' + testPw + '=' + match2);
      } catch(e) {
        console.log('MODEL_ERROR=' + e.message);
      }
    }
  }
  
  // Also check admins
  const Admin = require('./src/models/Admin').default;
  const admins = await Admin.find({}).lean();
  console.log('---');
  console.log('ADMIN_COUNT=' + admins.length);
  for (const a of admins) {
    console.log('ADMIN_USERNAME=' + a.username);
  }
  
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
