import mongoose from "mongoose";

const SocialLinkSchema = new mongoose.Schema({
  platform: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true },
  icon: { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 1 },
});

export const SocialLink = mongoose.models.SocialLink || mongoose.model("SocialLink", SocialLinkSchema);
