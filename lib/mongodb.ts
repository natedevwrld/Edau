import type { Mongoose } from 'mongoose';

const MONGODB_URI = (process.env.MONGODB_URI_KEY || process.env.MONGODB_URI || '').trim();

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.mongooseCache || { conn: null, promise: null };

if (!globalThis.mongooseCache) {
  globalThis.mongooseCache = cached;
}

async function getMongoose() {
  if (typeof window !== 'undefined') {
    throw new Error('Database connection is only available on the server');
  }

  const mongooseModule = await import('mongoose');
  mongooseModule.default.set('strictQuery', true);
  return mongooseModule.default as Mongoose;
}

function getFriendlyMongoError(error: unknown) {
  if (error instanceof Error && error.message) {
    const message = error.message.toLowerCase();
    if (message.includes('querysrv') || message.includes('enotfound') || message.includes('econnrefused') || message.includes('timed out')) {
      return new Error('We are having trouble reaching our product catalog right now. Please try again shortly.');
    }

    if (message.includes('missing') || message.includes('environment variable')) {
      return new Error('The store database is not configured yet. Please try again later.');
    }
  }

  return new Error('We are having trouble loading the store right now. Please try again shortly.');
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!MONGODB_URI) {
    throw getFriendlyMongoError(new Error('Missing MONGODB_URI_KEY environment variable'));
  }

  if (!cached.promise) {
    const mongooseClient = await getMongoose();
    cached.promise = mongooseClient.connect(MONGODB_URI, {
      dbName: 'edaufarm',
      serverSelectionTimeoutMS: 7000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
      retryWrites: true,
      family: 4,
      autoIndex: true,
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw getFriendlyMongoError(error);
  }
}

export default dbConnect;
