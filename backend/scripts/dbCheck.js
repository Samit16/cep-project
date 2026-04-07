const mongoose = require('mongoose');
require('dotenv').config();

async function fix() {
  await mongoose.connect(process.env.DATABASE_URL);
  const db = mongoose.connection.db;

  // Remove old passwordHash field from admins
  const res1 = await db.collection('admins').updateMany({}, { $unset: { passwordHash: '' } });
  console.log('Admins: removed stale passwordHash from', res1.modifiedCount, 'doc(s)');

  // Check all users
  const users = await db.collection('users').find({}).toArray();
  console.log('\nUsers in DB:', users.length);
  for (const u of users) {
    const isHashed = (u.password || '').startsWith('$2b');
    console.log('  Username:', u.username, '| Role:', u.role, '| Password is bcrypt hash:', isHashed);
  }

  // Reset any bcrypt-hashed passwords to plain text
  const hashedUsers = users.filter(u => (u.password || '').startsWith('$2b'));
  if (hashedUsers.length > 0) {
    console.log('\nFixing', hashedUsers.length, 'user(s) with hashed passwords...');
    await db.collection('users').updateMany(
      { password: { $regex: /^\$2b/ } },
      { $set: { password: 'password123' } }
    );
    console.log('Done - all reset to password123');
  }

  // Verify admin doc is clean
  const admin = await db.collection('admins').findOne({ username: 'admin' });
  console.log('\nFinal admin doc keys:', Object.keys(admin));
  console.log('Admin password:', admin.password);

  await mongoose.disconnect();
}

fix();
