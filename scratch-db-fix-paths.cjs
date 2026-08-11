require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/stitch-parts-finder');
  const db = mongoose.connection.db;

  const result1 = await db.collection('parts').updateMany(
    {},
    { $pull: { images: { $regex: '^/images/products/' } } }
  );
  
  const result2 = await db.collection('parts').updateMany(
    {},
    { $pull: { gallery: { url: { $regex: '^/images/products/' } } } }
  );

  console.log('Removed from images array:', result1.modifiedCount, 'documents');
  console.log('Removed from gallery array:', result2.modifiedCount, 'documents');

  process.exit(0);
}
run().catch(console.error);
