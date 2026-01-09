import express from "express";

import { authRequired } from "../middleware/auth.js";
import { adminRequired } from "../middleware/admin.js";

import { User } from "../models/User.js";
import { Demande } from "../models/Demande.js";
import { Reponse } from "../models/Reponse.js";
import { Message } from "../models/Message.js";
import { Notification } from "../models/Notification.js";
import { SocialLink } from "../models/SocialLink.js";
import { Slider } from "../models/Slider.js";
import { AdminAction } from "../models/AdminAction.js";
import { seedIfEmpty } from "../utils/seed.js";

const router = express.Router();

function toIso(d) {
  return d ? new Date(d).toISOString() : undefined;
}

function normalizeSliderToClient(sliderDoc) {
  if (!sliderDoc) return null;
  if (typeof sliderDoc.toClientJSON === "function") return sliderDoc.toClientJSON();
  const obj = sliderDoc.toObject ? sliderDoc.toObject() : sliderDoc;
  return {
    ...obj,
    image: obj.image?.url || obj.image || "",
  };
}

async function logAdminAction({ adminId, action, targetUserId, targetPostId, details }) {
  try {
    await AdminAction.create({
      adminId,
      action,
      targetUserId: targetUserId || undefined,
      targetPostId: targetPostId || undefined,
      details: details || {},
      dateCreation: new Date(),
    });
  } catch {
    // logging must never break admin operations
  }
}

// ===============
// Force Re-seed (reset database)
// ===============
router.post("/admin/reseed", authRequired(), adminRequired(), async (req, res) => {
  try {
    const result = await seedIfEmpty(true);
    await logAdminAction({ adminId: req.user._id, action: "reseed", details: result });
    return res.json({ success: true, message: "Database reset complete", ...result });
  } catch (err) {
    console.error("[RESEED ERROR]", err);
    return res.status(500).json({ message: "Server error during reseed" });
  }
});

// ===============
// Admin Stats
// ===============
router.get("/admin/stats", authRequired(), adminRequired(), async (_req, res) => {
  try {
    const [
      totalUsers,
      totalVendeurs,
      totalAcheteurs,
      totalBanned,
      totalDemandes,
      totalReponses,
      totalMessages,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "vendeur" }),
      User.countDocuments({ role: "acheteur" }),
      User.countDocuments({ isBanned: true }),
      Demande.countDocuments({ status: { $ne: "deleted" } }),
      Reponse.countDocuments(),
      Message.countDocuments(),
    ]);

    return res.json({
      totalUsers,
      totalVendeurs,
      totalAcheteurs,
      totalBanned,
      totalDemandes,
      totalReponses,
      totalMessages,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// ===============
// Admin Users
// ===============
router.get("/admin/users", authRequired(), adminRequired(), async (_req, res) => {
  try {
    const users = await User.find({}).sort({ dateCreation: -1 });
    return res.json({ users: users.map((u) => u.toSafeJSON()) });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/admin/ban/:userId", authRequired(), adminRequired(), async (req, res) => {
  try {
    const { banType, banReason, banExpiry } = req.body || {};

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const type = banType === "temporary" ? "temporary" : "permanent";
    const reason = String(banReason || "Violation des règles").trim();

    let expiry = undefined;
    if (type === "temporary") {
      if (banExpiry) {
        const dt = new Date(banExpiry);
        if (!Number.isNaN(dt.getTime())) expiry = dt;
      }
      if (!expiry) expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    user.isBanned = true;
    user.banType = type;
    user.banReason = reason;
    user.banExpiry = expiry;
    await user.save();

    await Notification.create({
      userId: user._id,
      type: "ban",
      data: {
        title: "Compte suspendu",
        message: `Votre compte a été suspendu: ${reason}`,
        banType: type,
        banExpiry: expiry ? toIso(expiry) : undefined,
      },
      read: false,
      dateCreation: new Date(),
    });

    await logAdminAction({
      adminId: req.user._id,
      action: "ban",
      targetUserId: user._id,
      details: { banType: type, banReason: reason, banExpiry: expiry ? toIso(expiry) : undefined },
    });

    return res.json({ user: user.toSafeJSON() });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/admin/unban/:userId", authRequired(), adminRequired(), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBanned = false;
    user.banType = undefined;
    user.banReason = undefined;
    user.banExpiry = undefined;
    await user.save();

    await Notification.create({
      userId: user._id,
      type: "admin",
      data: {
        title: "Compte réactivé",
        message: "Votre compte a été réactivé par un administrateur.",
      },
      read: false,
      dateCreation: new Date(),
    });

    await logAdminAction({
      adminId: req.user._id,
      action: "unban",
      targetUserId: user._id,
      details: {},
    });

    return res.json({ user: user.toSafeJSON() });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// Admin message notification (to a user or broadcast)
router.post("/admin/message", authRequired(), adminRequired(), async (req, res) => {
  try {
    const { userId, title, message, data } = req.body || {};

    const safeTitle = String(title || "Message admin").trim();
    const safeMessage = String(message || "").trim();

    if (!safeMessage) return res.status(400).json({ message: "Message is required" });

    const payload = {
      type: "admin",
      data: {
        title: safeTitle,
        message: safeMessage,
        ...(data && typeof data === "object" ? data : {}),
      },
      read: false,
      dateCreation: new Date(),
    };

    if (userId) {
      const u = await User.findById(String(userId));
      if (!u) return res.status(404).json({ message: "User not found" });

      await Notification.create({ ...payload, userId: u._id });
      await logAdminAction({ adminId: req.user._id, action: "admin_message", targetUserId: u._id, details: payload.data });
      return res.json({ success: true, sentTo: 1 });
    }

    const all = await User.find({}).select("_id");
    if (!all.length) return res.json({ success: true, sentTo: 0 });

    await Notification.insertMany(all.map((u) => ({ ...payload, userId: u._id })));
    await logAdminAction({ adminId: req.user._id, action: "admin_broadcast", details: { sentTo: all.length, ...payload.data } });

    return res.json({ success: true, sentTo: all.length });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// ===============
// Admin Posts (Demandes)
// ===============
router.get("/admin/posts", authRequired(), adminRequired(), async (_req, res) => {
  try {
    const docs = await Demande.find({ status: { $ne: "deleted" } })
      .sort({ dateCreation: -1 })
      .limit(500)
      .populate("acheteurId");

    const posts = docs.map((d) => {
      const obj = d.toObject ? d.toObject() : d;
      const acheteur = obj.acheteurId && obj.acheteurId.toSafeJSON ? obj.acheteurId.toSafeJSON() : undefined;
      return {
        ...obj,
        _id: String(obj._id),
        acheteurId: String(acheteur?._id || obj.acheteurId),
        acheteur,
        dateCreation: toIso(obj.dateCreation),
      };
    });

    return res.json({ posts });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/admin/posts/:id", authRequired(), adminRequired(), async (req, res) => {
  try {
    const doc = await Demande.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });

    doc.status = "deleted";
    await doc.save();

    await logAdminAction({ adminId: req.user._id, action: "delete_post", targetPostId: doc._id, details: {} });

    return res.json({ success: true });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// ===============
// Admin Social Links CRUD
// ===============
router.get("/admin/social-links", authRequired(), adminRequired(), async (_req, res) => {
  try {
    const links = await SocialLink.find({}).sort({ order: 1 });
    return res.json({ socialLinks: links });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/admin/social-links", authRequired(), adminRequired(), async (req, res) => {
  try {
    const { platform, url, icon, isActive, order } = req.body || {};
    if (!platform || !url || !icon) return res.status(400).json({ message: "Missing fields" });

    const link = await SocialLink.create({
      platform: String(platform).trim(),
      url: String(url).trim(),
      icon: String(icon).trim(),
      isActive: isActive === false ? false : true,
      order: Number.isFinite(Number(order)) ? Number(order) : 1,
    });

    await logAdminAction({ adminId: req.user._id, action: "create_social_link", details: { id: link._id } });

    return res.status(201).json({ socialLink: link });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/admin/social-links/:id", authRequired(), adminRequired(), async (req, res) => {
  try {
    const updates = {};
    const allowed = ["platform", "url", "icon", "isActive", "order"]; 
    for (const k of allowed) {
      if (req.body?.[k] === undefined) continue;
      if (k === "order") updates[k] = Number(req.body[k]);
      else if (k === "isActive") updates[k] = Boolean(req.body[k]);
      else updates[k] = String(req.body[k]).trim();
    }

    const link = await SocialLink.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!link) return res.status(404).json({ message: "Not found" });

    await logAdminAction({ adminId: req.user._id, action: "update_social_link", details: { id: link._id, updates } });

    return res.json({ socialLink: link });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/admin/social-links/:id", authRequired(), adminRequired(), async (req, res) => {
  try {
    const link = await SocialLink.findByIdAndDelete(req.params.id);
    if (!link) return res.status(404).json({ message: "Not found" });

    await logAdminAction({ adminId: req.user._id, action: "delete_social_link", details: { id: link._id } });

    return res.json({ success: true });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// ===============
// Admin Sliders CRUD
// ===============
router.get("/admin/sliders", authRequired(), adminRequired(), async (_req, res) => {
  try {
    const sliders = await Slider.find({}).sort({ order: 1 });
    return res.json({ sliders: sliders.map(normalizeSliderToClient) });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/admin/sliders", authRequired(), adminRequired(), async (req, res) => {
  try {
    const { title, description, image, buttonText, buttonLink, isActive, order } = req.body || {};
    if (!title) return res.status(400).json({ message: "Title is required" });

    const slider = await Slider.create({
      title: String(title).trim(),
      description: String(description || "").trim(),
      image: image
        ? typeof image === "string"
          ? { url: String(image).trim(), publicId: "admin_url" }
          : { url: String(image.url || "").trim(), publicId: String(image.publicId || "admin"), }
        : undefined,
      buttonText: String(buttonText || "").trim(),
      buttonLink: String(buttonLink || "").trim(),
      isActive: isActive === false ? false : true,
      order: Number.isFinite(Number(order)) ? Number(order) : 1,
    });

    await logAdminAction({ adminId: req.user._id, action: "create_slider", details: { id: slider._id } });

    return res.status(201).json({ slider: normalizeSliderToClient(slider) });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/admin/sliders/:id", authRequired(), adminRequired(), async (req, res) => {
  try {
    const updates = {};
    const allowed = ["title", "description", "image", "buttonText", "buttonLink", "isActive", "order"]; 

    for (const k of allowed) {
      if (req.body?.[k] === undefined) continue;
      if (k === "order") updates[k] = Number(req.body[k]);
      else if (k === "isActive") updates[k] = Boolean(req.body[k]);
      else if (k === "image") {
        const image = req.body.image;
        updates.image = image
          ? typeof image === "string"
            ? { url: String(image).trim(), publicId: "admin_url" }
            : { url: String(image.url || "").trim(), publicId: String(image.publicId || "admin"), }
          : undefined;
      } else {
        updates[k] = String(req.body[k]).trim();
      }
    }

    const slider = await Slider.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!slider) return res.status(404).json({ message: "Not found" });

    await logAdminAction({ adminId: req.user._id, action: "update_slider", details: { id: slider._id, updates } });

    return res.json({ slider: normalizeSliderToClient(slider) });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/admin/sliders/:id", authRequired(), adminRequired(), async (req, res) => {
  try {
    const slider = await Slider.findByIdAndDelete(req.params.id);
    if (!slider) return res.status(404).json({ message: "Not found" });

    await logAdminAction({ adminId: req.user._id, action: "delete_slider", details: { id: slider._id } });

    return res.json({ success: true });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
