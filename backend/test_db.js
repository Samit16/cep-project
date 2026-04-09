const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://kuchioswal_db:weneedastrongpassword1234@cluster0.58lr3lw.mongodb.net/kvjos_nagpur?appName=Cluster0')
  .then(async () => {
    const db = mongoose.connection.db;
    const member = await db.collection('members').findOne({"contact_numbers.0": {$exists: true}});
    console.log('Member contact numbers:', member ? member.contact_numbers : 'None');
    process.exit(0);
  });
