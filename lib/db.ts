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

  // Clean and validate MongoDB URI format
  let cleanUri = MONGODB_URI.trim()
  
  // Handle common mistake: user entered "MONGODB_URI=mongodb+srv://..." instead of just the connection string
  if (cleanUri.startsWith("MONGODB_URI=")) {
    cleanUri = cleanUri.replace("MONGODB_URI=", "")
    console.log("[v0] Stripped 'MONGODB_URI=' prefix from connection string")
  }
  
  if (!cleanUri.startsWith("mongodb://") && !cleanUri.startsWith("mongodb+srv://")) {
    throw new Error(
      `Invalid MONGODB_URI format. The connection string must start with "mongodb://" or "mongodb+srv://". ` +
      `Current value starts with: "${cleanUri.substring(0, 20)}...". ` +
      `Please update the MONGODB_URI in Settings -> Vars with a valid MongoDB connection string.`
    )
  }

  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    console.log("[v0] Connecting to MongoDB...")
    cached.promise = mongoose.connect(cleanUri, {
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
