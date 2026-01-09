import express from "express";
import { Slider } from "../models/Slider.js";
import { SocialLink } from "../models/SocialLink.js";
import { seedIfEmpty } from "../utils/seed.js";

const router = express.Router();

function sliderToClient(sliderDoc) {
  const obj = sliderDoc.toObject ? sliderDoc.toObject() : sliderDoc;
  return {
    _id: String(obj._id),
    title: obj.title,
    description: obj.description,
    image: obj.image?.url || obj.image || "",
    buttonText: obj.buttonText,
    buttonLink: obj.buttonLink,
    isActive: Boolean(obj.isActive),
    order: Number(obj.order || 1),
  };
}

// Public sliders for hero
router.get("/sliders", async (_req, res) => {
  try {
    const sliders = await Slider.find({ isActive: true }).sort({ order: 1, _id: 1 }).limit(50);
    return res.json({ sliders: sliders.map(sliderToClient) });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// Public social links for footer
router.get("/social-links", async (_req, res) => {
  try {
    const socialLinks = await SocialLink.find({ isActive: true }).sort({ order: 1, _id: 1 }).limit(50);
    return res.json({ socialLinks });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// Public init endpoint (seeds DB if empty, safe to call multiple times)
router.post("/init", async (_req, res) => {
  try {
    const result = await seedIfEmpty(false);
    if (result.seeded) {
      return res.json({ success: true, message: "Database initialized with test data", seeded: true });
    }
    return res.json({ success: true, message: "Database already has data", seeded: false });
  } catch (err) {
    console.error("[INIT ERROR]", err);
    return res.status(500).json({ message: "Server error during init" });
  }
});

// Public force reset (for debugging - remove in true production)
router.post("/reset", async (_req, res) => {
  try {
    const result = await seedIfEmpty(true);
    return res.json({ success: true, message: "Database reset complete", ...result });
  } catch (err) {
    console.error("[RESET ERROR]", err);
    return res.status(500).json({ message: "Server error during reset" });
  }
});

export default router;
