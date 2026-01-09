import express from "express";
import { Notification } from "../models/Notification.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

function canAccessUser(req, userId) {
  return String(req.user._id) === String(userId) || req.user.role === "admin";
}

function notifToClient(doc) {
  const n = doc.toObject ? doc.toObject({ virtuals: false }) : doc;
  return {
    _id: String(n._id),
    userId: String(n.userId),
    type: n.type,
    data: n.data || {},
    read: Boolean(n.read),
    dateCreation: n.dateCreation ? new Date(n.dateCreation).toISOString() : new Date().toISOString(),
  };
}

// GET /api/notifications/:userId (auth)
router.get("/notifications/:userId", authRequired(), async (req, res) => {
  try {
    const userId = String(req.params.userId);
    if (!canAccessUser(req, userId)) return res.status(403).json({ message: "Forbidden" });

    const docs = await Notification.find({ userId })
      .sort({ dateCreation: -1 })
      .limit(500);

    return res.json({ notifications: docs.map(notifToClient) });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/notifications/:userId/unread (auth)
router.get("/notifications/:userId/unread", authRequired(), async (req, res) => {
  try {
    const userId = String(req.params.userId);
    if (!canAccessUser(req, userId)) return res.status(403).json({ message: "Forbidden" });

    const docs = await Notification.find({ userId, read: false })
      .sort({ dateCreation: -1 })
      .limit(500);

    return res.json({ notifications: docs.map(notifToClient) });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/notifications/:userId/count (auth)
router.get("/notifications/:userId/count", authRequired(), async (req, res) => {
  try {
    const userId = String(req.params.userId);
    if (!canAccessUser(req, userId)) return res.status(403).json({ message: "Forbidden" });

    const count = await Notification.countDocuments({ userId, read: false });
    return res.json({ count });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/notifications/:id/read (auth)
router.put("/notifications/:id/read", authRequired(), async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.status(404).json({ message: "Not found" });

    if (!canAccessUser(req, notif.userId)) return res.status(403).json({ message: "Forbidden" });

    notif.read = true;
    await notif.save();

    return res.json({ notification: notifToClient(notif) });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/notifications/:userId/read-all (auth)
router.put("/notifications/:userId/read-all", authRequired(), async (req, res) => {
  try {
    const userId = String(req.params.userId);
    if (!canAccessUser(req, userId)) return res.status(403).json({ message: "Forbidden" });

    await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
