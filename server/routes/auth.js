import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Demande } from "../models/Demande.js";
import { Reponse } from "../models/Reponse.js";
import { Notification } from "../models/Notification.js";
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

    const previousLogin = user.lastLogin || new Date(0);
    user.lastLogin = new Date();
    await user.save();

    // Pour les vendeurs : créer des notifications pour les nouvelles demandes depuis la dernière connexion
    if (user.role === "vendeur") {
      try {
        // Trouver les nouvelles demandes créées depuis la dernière connexion
        const newDemandes = await Demande.find({
          dateCreation: { $gt: previousLogin },
          status: "active",
          acheteurId: { $ne: user._id } // Pas ses propres demandes
        })
          .populate("acheteurId", "nom")
          .sort({ dateCreation: -1 })
          .limit(10); // Maximum 10 notifications

        // Créer une notification pour chaque nouvelle demande
        for (const demande of newDemandes) {
          // Vérifier si une notification existe déjà pour cette demande
          const existingNotif = await Notification.findOne({
            userId: user._id,
            type: "nouvelle_demande",
            "data.demandeId": demande._id.toString()
          });

          if (!existingNotif) {
            const budgetStr = demande.budget ? ` - ${demande.budget.toLocaleString()} FCFA` : "";
            await Notification.create({
              userId: user._id,
              type: "nouvelle_demande",
              data: {
                demandeId: demande._id.toString(),
                demandeTitre: demande.titre,
                categorie: demande.categorie,
                message: `${demande.categorie}: "${demande.titre}"${budgetStr}`
              }
            });
          }
        }
      } catch (notifErr) {
        // Ne pas bloquer la connexion si les notifications échouent
        console.error("Error creating vendor login notifications:", notifErr);
      }
    }

    // Pour les acheteurs : créer des notifications pour les nouvelles réponses à leurs demandes
    if (user.role === "acheteur") {
      try {
        // Trouver les demandes de cet acheteur
        const mesDemandes = await Demande.find({ acheteurId: user._id, status: "active" });
        const mesDemandeIds = mesDemandes.map(d => d._id);

        if (mesDemandeIds.length > 0) {
          // Trouver les nouvelles réponses depuis la dernière connexion
          const newReponses = await Reponse.find({
            demandeId: { $in: mesDemandeIds },
            dateCreation: { $gt: previousLogin }
          })
            .populate("vendeurId", "nom")
            .populate("demandeId", "titre")
            .sort({ dateCreation: -1 })
            .limit(10);

          // Créer une notification pour chaque nouvelle réponse
          for (const reponse of newReponses) {
            // Vérifier si une notification existe déjà pour cette réponse
            const existingNotif = await Notification.findOne({
              userId: user._id,
              type: "reponse",
              "data.reponseId": reponse._id.toString()
            });

            if (!existingNotif) {
              const vendeurNom = reponse.vendeurId?.nom || "Un vendeur";
              const demandeTitre = reponse.demandeId?.titre || "votre demande";
              await Notification.create({
                userId: user._id,
                type: "reponse",
                data: {
                  reponseId: reponse._id.toString(),
                  demandeId: reponse.demandeId?._id?.toString() || "",
                  demandeTitre: demandeTitre,
                  vendeurId: reponse.vendeurId?._id?.toString() || "",
                  vendeurNom: vendeurNom,
                  message: `${vendeurNom} a répondu à "${demandeTitre}"`
                }
              });
            }
          }
        }
      } catch (notifErr) {
        // Ne pas bloquer la connexion si les notifications échouent
        console.error("Error creating buyer login notifications:", notifErr);
      }
    }

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
