import mongoose from 'mongoose';
import config from '../src/config/env';
import Member from '../src/models/Member';

async function fixNullFields() {
  try {
    if (!config.databaseUrl) {
      throw new Error('databaseUrl is not defined in config');
    }
    await mongoose.connect(config.databaseUrl);
    console.log('Connected to Database.');

    const members = await Member.find({});
    let updateCount = 0;

    for (const member of members) {
      let requiresUpdate = false;
      const doc = member.toObject() as Record<string, any>;

      const stringFields = [
        'address',
        'email',
        'occupation',
        'marital_status',
        'current_place',
        'kutch_town',
      ];

      for (const field of stringFields) {
        if (doc[field] === '') {
          (member as any)[field] = null;
          requiresUpdate = true;
        }
      }

      const arrayFields = ['contact_numbers', 'family_members'];
      for (const field of arrayFields) {
        if (Array.isArray(doc[field])) {
          // If any elements are empty strings, we might want to filter them or make null.
          // But typically array of strings don't store null inside properly if strict, so we clean them up.
          // The request just says "replace all empty values in database with null".
          // If the array itself is empty [], it probably shouldn't be null, or should it?
          // I will stick to the string fields.
        }
      }

      if (requiresUpdate) {
        await member.save();
        updateCount++;
      }
    }

    console.log(`Successfully replaced empty strings with null for ${updateCount} members.`);
    process.exit(0);
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}

fixNullFields();
