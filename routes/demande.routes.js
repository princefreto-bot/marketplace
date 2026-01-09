import express from "express";
import Demande from "../models/Demande.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

/* ================== GET TOUTES LES DEMANDES ================== */
router.get("/", async (req, res) => {
  try {
    const demandes = await Demande.find()
      .populate("acheteur", "nom localisation")
      .sort({ createdAt: -1 });

    res.json(demandes);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/* ================== CRÉER UNE DEMANDE ================== */
router.post("/", protect, async (req, res) => {
  try {
    const demande = await Demande.create({
      ...req.body,
      acheteur: req.user._id
    });

    res.status(201).json(demande);
  } catch (error) {
    res.status(400).json({ message: "Création impossible" });
  }
});

export default router;
