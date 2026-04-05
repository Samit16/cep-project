import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import Admin from '../src/models/Admin';
import Member from '../src/models/Member';
import Event from '../src/models/Event';
import { encryptField } from '../src/plugins/encryption';

dotenv.config();

const dbUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/kvjos_nagpur';

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
      first_name: 'Shantanu',
      last_name: 'Kelkar',
      address: '123 Marine Drive, Mumbai',
      contact_numbers: [encryptField('+919999999999'), encryptField('+919999990000')],
      email: 'shantanu@example.com',
      occupation: 'Software Engineer',
      marital_status: 'Single',
      current_place: 'Mumbai',
      kutch_town: 'Mandvi',
      family_members: [],
      is_alive: true,
      active: true,
      profile_complete: true,
      contact_visibility: 'public' as const
    },
    {
      first_name: 'Amara',
      last_name: 'Jain',
      address: '456 MG Road, Pune',
      contact_numbers: [encryptField('+918888888888')],
      email: 'amara@example.com',
      occupation: 'Doctor',
      marital_status: 'Married',
      current_place: 'Pune',
      kutch_town: 'Bhuj',
      family_members: ['Samir Jain'],
      is_alive: true,
      active: true,
      profile_complete: false,
      contact_visibility: 'private' as const
    }
  ];

  for (const m of sampleMembers) {
    // Search by the first number in the array for upsert matching
    await Member.findOneAndUpdate(
      { contact_numbers: m.contact_numbers[0] },
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
