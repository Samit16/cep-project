import mongoose from 'mongoose';
import config from './src/config/env';
import User from './src/models/User';
import Admin from './src/models/Admin';
import Member from './src/models/Member';

async function checkUsers() {
  try {
    await mongoose.connect(config.databaseUrl);
    console.log('Connected to DB');

    const users = await User.find({}).lean();
    console.log(`Users in User collection: ${users.length}`);
    users.forEach(u => {
      console.log(`- Username: ${u.username}, Role: ${u.role}, is_first_login: ${u.is_first_login}`);
    });

    const admins = await Admin.find({}).lean();
    console.log(`Admins in Admin collection: ${admins.length}`);
    admins.forEach(a => {
      console.log(`- Username: ${a.username}`);
    });

    const memberCount = await Member.countDocuments();
    console.log(`Total Members in DB: ${memberCount}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkUsers();
