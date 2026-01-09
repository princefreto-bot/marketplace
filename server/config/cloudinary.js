import { v2 as cloudinary } from "cloudinary";

export function requireCloudinaryEnv() {
  const required = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];
  for (const k of required) {
    const v = process.env[k];
    if (!v || !String(v).trim()) {
      throw new Error(`Missing required environment variable: ${k}`);
    }
  }
}

requireCloudinaryEnv();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };
