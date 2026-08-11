const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/stitch-parts-finder');
  const db = mongoose.connection.db;
  const parts = await db.collection('parts').find({}).limit(10).toArray();
  const imagesInfo = parts.map(p => ({
    sku: p.sku,
    images: p.images,
    gallery: p.gallery
  }));
  console.log(JSON.stringify(imagesInfo, null, 2));
  process.exit(0);
}
run().catch(console.error);
