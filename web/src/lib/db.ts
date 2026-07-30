import mongoose from 'mongoose';

const mongodbUri = process.env.DATABASE_URL;

if (!mongodbUri) {
  throw new Error('Please define the DATABASE_URL environment variable inside .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      retryWrites: true,
      w: 'majority',
      maxPoolSize: 10,
    };

    cached.promise = mongoose
      .connect(mongodbUri!, opts)
      .then((mongoose) => {
        console.log('[DB] Connected to MongoDB');
        return mongoose;
      })
      .catch((err) => {
        console.error('[DB] MongoDB connection error:', err);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Extend global namespace for TypeScript
declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

export default connectToDatabase;
