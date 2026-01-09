import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

/* ===== LOGIN ===== */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Email incorrect" });

  const isMatch = await user.matchPassword(password);
  if (!isMatch) return res.status(401).json({ message: "Mot de passe incorrect" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });

  res.json({ token, user });
});

/* ===== USER CONNECTÉ ===== */
router.get("/me", protect, (req, res) => {
  res.json(req.user);
});

export default router;
