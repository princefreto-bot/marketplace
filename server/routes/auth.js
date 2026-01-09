import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

router.post("/register", async (req, res) => {
  try {
    const { role, nom, email, password, telephone, localisation } = req.body || {};

    if (!nom || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const safeRole = role === "vendeur" ? "vendeur" : "acheteur";

    const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) return res.status(409).json({ message: "Email already used" });

    const user = await User.create({
      role: safeRole,
      nom: String(nom).trim(),
      email: String(email).toLowerCase().trim(),
      password: String(password),
      telephone: telephone ? String(telephone).trim() : "",
      localisation: localisation ? String(localisation).trim() : "",
      lastLogin: new Date(),
    });

    const token = signToken(user._id);
    return res.json({ token, user: user.toSafeJSON() });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Missing credentials" });

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    if (user.isBanned) {
      return res.status(403).json({ message: "Account banned", banReason: user.banReason });
    }

    const ok = await bcrypt.compare(String(password), user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user._id);
    return res.json({ token, user: user.toSafeJSON() });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/me", authRequired(), async (req, res) => {
  // req.user is Mongoose model instance
  return res.json({ user: req.user.toSafeJSON() });
});

export default router;
