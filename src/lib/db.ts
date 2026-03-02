import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };
// Always cache globally — prevents connection leaks on hot reload and ensures
// a failed promise is visible across requests in the same function instance.
global.mongoose = cached;

export async function connectDB(): Promise<typeof mongoose | null> {
  if (!MONGODB_URI) return null;

  // Return cached connection only if it's still live.
  if (cached.conn && mongoose.connection.readyState === 1) return cached.conn;

  // If the underlying connection dropped, reset so we reconnect cleanly.
  if (cached.conn && mongoose.connection.readyState !== 1) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 10_000,
        socketTimeoutMS: 45_000,
        maxPoolSize: 5,
        bufferCommands: false,
      })
      .catch((err) => {
        // Reset so the next request retries instead of re-awaiting a dead promise.
        cached.promise = null;
        throw err;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
