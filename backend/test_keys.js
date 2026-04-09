const crypto = require('crypto');
const mongoose = require('mongoose');

const algorithm = 'aes-256-gcm';

function decryptField(cipherText, keyStr) {
  const key = Buffer.from(keyStr, 'base64');
  const data = Buffer.from(cipherText, 'base64');
  const iv = data.slice(0, 12);
  const tag = data.slice(12, 28);
  const encrypted = data.slice(28);
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(tag);
  
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

mongoose.connect('mongodb+srv://kuchioswal_db:weneedastrongpassword1234@cluster0.58lr3lw.mongodb.net/kvjos_nagpur?appName=Cluster0')
  .then(async () => {
    const db = mongoose.connection.db;
    const member = await db.collection('members').findOne({"contact_numbers.0": {$exists: true}});
    
    if (!member) {
      console.log('No members found with contact numbers');
      process.exit(1);
    }
    
    const key1 = 'mcdapL15GYyovh/NuyiiRbpZlQyhmdc3mU182yYmgdc=';
    const key2 = 'QeCwHgnekmbQ3ImsyoUB3zkGuGEAuDCBb3H1qm7JTfY=';
    
    console.log('Testing Key 1:');
    try {
      console.log('Success:', decryptField(member.contact_numbers[0], key1));
    } catch(e) {
      console.log('Key 1 failed');
    }
    
    console.log('Testing Key 2:');
    try {
      console.log('Success:', decryptField(member.contact_numbers[0], key2));
    } catch(e) {
      console.log('Key 2 failed');
    }
    
    process.exit(0);
  });
