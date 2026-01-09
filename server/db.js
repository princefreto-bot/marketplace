import mongoose from "mongoose";

export function requireEnv(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

export async function connectMongo() {
  const MONGODB_URI = requireEnv("MONGODB_URI");

  mongoose.set("strictQuery", true);

  mongoose.connection.on("connected", () => {
    console.log("✅ MongoDB connected");
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB connection error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected");
  });

  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
  });

  return mongoose;
}
