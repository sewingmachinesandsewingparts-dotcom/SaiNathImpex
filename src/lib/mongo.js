import mongoose from "mongoose";

const DEFAULT_MONGODB_URI = "mongodb://127.0.0.1:27017/stitch-parts-finder";
const MONGODB_URI = (process.env.MONGODB_URI || DEFAULT_MONGODB_URI).trim();

const globalWithMongoose = globalThis;
const cached = globalWithMongoose.mongoose || { conn: null, promise: null };
if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = cached;
}

async function connectMongo() {
  if (cached.conn) {
    return cached.conn;
  }

  // Helper to try connecting to a given MongoDB URI
  const tryConnect = async (uri) => {
    try {
      const conn = await mongoose.connect(uri, {
        dbName: "stitch-parts-finder",
        serverSelectionTimeoutMS: 5000,
        bufferCommands: false,
      });
      console.info(`MongoDB connected to ${uri}`);
      return conn;
    } catch (err) {
      console.warn(`MongoDB connection attempt to ${uri} failed: ${err.message}`);
      return null;
    }
  };

  // First try primary (Atlas) URI, then fallback to local instance
  const primaryConn = await tryConnect(MONGODB_URI);
  if (primaryConn) {
    cached.conn = primaryConn;
    cached.promise = Promise.resolve(primaryConn);
    return primaryConn;
  }

  const fallbackConn = await tryConnect(DEFAULT_MONGODB_URI);
  if (fallbackConn) {
    cached.conn = fallbackConn;
    cached.promise = Promise.resolve(fallbackConn);
    return fallbackConn;
  }

  console.error("Both MongoDB connection attempts failed.");
  cached.promise = null;
  return null;
}

async function isMongoConnected() {
  const conn = await connectMongo();
  return !!conn;
}

export { MONGODB_URI, isMongoConnected };
export default connectMongo;
