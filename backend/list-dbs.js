const mongoose = require('mongoose');

async function listDbs() {
  await mongoose.connect('mongodb+srv://kuchioswal_db:weneedastrongpassword1234@cluster0.58lr3lw.mongodb.net/?retryWrites=true&w=majority');
  const adminDb = mongoose.connection.db.admin();
  const dbs = await adminDb.listDatabases();
  console.log(JSON.stringify(dbs.databases.map(d => d.name)));
  process.exit(0);
}

listDbs().catch(console.error);
