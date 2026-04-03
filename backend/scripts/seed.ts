import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import Admin from '../src/models/Admin';
import Member from '../src/models/Member';
import Event from '../src/models/Event';
import { encryptField } from '../src/plugins/encryption';

dotenv.config();

const dbUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/kjo_samaj';

async function seed() {
  console.log('Connecting to MongoDB at:', dbUrl);
  await mongoose.connect(dbUrl);

  // Clear existing data (OPTIONAL - uncomment if you want a fresh start)
  // await Admin.deleteMany({});
  // await Member.deleteMany({});
  // await Event.deleteMany({});

  console.log('Seeding Admin...');
  const passwordHash = await bcrypt.hash('admin123', 10);
  await Admin.findOneAndUpdate(
    { username: 'admin' },
    { username: 'admin', passwordHash },
    { upsert: true, new: true }
  );
  console.log('Admin created/updated: admin / admin123');

  console.log('Seeding Sample Members...');
  const sampleMembers = [
    {
      name: 'Shantanu Kelkar',
      contact_no: encryptField('+919999999999'),
      email: 'shantanu@example.com',
      occupation: 'Software Engineer',
      marital_status: 'Single',
      current_place: 'Mumbai',
      kutch_town: 'Mandvi',
      family_members: [],
      if_alive: true,
      active: true,
      contact_visibility: 'public' as const
    },
    {
      name: 'Amara Jain',
      contact_no: encryptField('+918888888888'),
      email: 'amara@example.com',
      occupation: 'Doctor',
      marital_status: 'Married',
      current_place: 'Pune',
      kutch_town: 'Bhuj',
      family_members: ['Samir Jain'],
      if_alive: true,
      active: true,
      contact_visibility: 'private' as const
    }
  ];

  for (const m of sampleMembers) {
    await Member.findOneAndUpdate(
      { contact_no: m.contact_no },
      m,
      { upsert: true, new: true }
    );
  }
  console.log('Sample members seeded.');

  console.log('Seeding Sample Events...');
  await Event.findOneAndUpdate(
    { title: 'KJO Annual Mahasammelan 2026' },
    {
      title: 'KJO Annual Mahasammelan 2026',
      description: 'The biggest yearly gathering of our community.',
      date: new Date('2026-12-25'),
      location: 'Reliance Corporate Park, Mumbai',
      createdBy: 'admin'
    },
    { upsert: true, new: true }
  );
  console.log('Sample event seeded.');

  console.log('Seeding Complete!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
