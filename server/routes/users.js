import express from "express";
import { User } from "../models/User.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Not found" });
    return res.json({ user: user.toSafeJSON() });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/users/:id", authRequired(), async (req, res) => {
  try {
    if (String(req.user._id) !== String(req.params.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updates = {};
    const allowed = ["nom", "telephone", "localisation"]; // minimal safe fields
    for (const k of allowed) {
      if (req.body?.[k] !== undefined) updates[k] = String(req.body[k]).trim();
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!user) return res.status(404).json({ message: "Not found" });

    return res.json({ user: user.toSafeJSON() });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
