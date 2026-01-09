import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinary } from "../config/cloudinary.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => {
    const original = file?.originalname || "upload";
    const ext = original.split(".").pop()?.toLowerCase();
    return {
      folder: "local-deals-togo",
      resource_type: "image",
      format: ext && ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : undefined,
    };
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
});

router.post("/upload", authRequired(), upload.any(), async (req, res) => {
  try {
    const files = req.files || [];
    const first = Array.isArray(files) ? files[0] : null;
    if (!first) return res.status(400).json({ message: "No file uploaded" });
    const url = first.path;
    const publicId = first.filename;
    if (!url || !publicId) {
      return res.status(500).json({ message: "Upload failed" });
    }
    return res.status(201).json({ url, publicId });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/upload/base64", authRequired(), async (req, res) => {
  try {
    const { base64 } = req.body || {};
    if (!base64 || !String(base64).trim()) {
      return res.status(400).json({ message: "Missing base64" });
    }
    let data = String(base64).trim();
    if (!data.startsWith("data:")) {
      data = `data:image/jpeg;base64,${data}`;
    }
    const result = await cloudinary.uploader.upload(data, {
      folder: "local-deals-togo",
      resource_type: "image",
    });
    return res.status(201).json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/upload/:publicId", authRequired(), async (req, res) => {
  try {
    const publicId = String(req.params.publicId || "").trim();
    if (!publicId) return res.status(400).json({ message: "Missing publicId" });
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    return res.json({ result });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;