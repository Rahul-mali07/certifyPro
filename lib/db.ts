import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error("[v0] MONGODB_URI environment variable is not defined")
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null }

if (!global.mongooseCache) {
  global.mongooseCache = cached
}

export async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error("Please add MONGODB_URI to your environment variables. Go to Settings -> Vars to add it.")
  }

  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    console.log("[v0] Connecting to MongoDB...")
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    })
  }

  try {
    cached.conn = await cached.promise
    console.log("[v0] MongoDB connected successfully")
  } catch (e) {
    cached.promise = null
    console.error("[v0] MongoDB connection error:", e)
    throw e
  }

  return cached.conn
}
