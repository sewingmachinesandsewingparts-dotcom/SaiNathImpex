const mongoose = require('mongoose');
const Part = require('./src/models/Part').default;

(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/stitch-parts-finder';
  await mongoose.connect(uri);
  const parts = await Part.find({ brandSlug: 'pegasus' }).limit(15).lean();
  console.log(JSON.stringify(parts, null, 2));
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
