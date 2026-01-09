import express from "express";
import { Demande } from "../models/Demande.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

// Frontend uses category IDs; DB stores French labels (enum).
const CATEGORY_ID_TO_LABEL = {
  electronique: "Électronique",
  mode: "Mode & Vêtements",
  maison: "Maison & Jardin",
  vehicules: "Véhicules",
  services: "Services",
  loisirs: "Loisirs & Sports",
  immobilier: "Immobilier",
  autre: "Autre",
};

const CATEGORY_LABEL_TO_ID = Object.fromEntries(
  Object.entries(CATEGORY_ID_TO_LABEL).map(([id, label]) => [label, id])
);

function normalizeCategorieToLabel(input) {
  if (!input) return null;
  const v = String(input).trim();
  if (!v) return null;
  if (CATEGORY_ID_TO_LABEL[v]) return CATEGORY_ID_TO_LABEL[v];
  if (CATEGORY_LABEL_TO_ID[v]) return v; // already label
  return v; // allow if matches enum; validation later
}

function demandeToClient(doc) {
  const d = doc.toObject ? doc.toObject({ virtuals: false }) : doc;
  const acheteurDoc = d.acheteurId && typeof d.acheteurId === "object" && d.acheteurId.toSafeJSON
    ? d.acheteurId
    : null;

  const dateCreation = d.dateCreation ? new Date(d.dateCreation).toISOString() : new Date().toISOString();

  return {
    _id: String(d._id),
    acheteurId: String(acheteurDoc ? acheteurDoc._id : d.acheteurId),
    acheteur: acheteurDoc ? acheteurDoc.toSafeJSON() : undefined,
    titre: d.titre,
    description: d.description,
    budget: d.budget,
    images: Array.isArray(d.images) ? d.images : [],
    categorie: CATEGORY_LABEL_TO_ID[d.categorie] || d.categorie,
    categorieLabel: d.categorie,
    localisation: d.localisation,
    badge: d.badge || undefined,
    status: d.status === "deleted" ? "closed" : d.status,
    dateCreation,
  };
}

// POST /api/demandes (auth)
router.post("/demandes", authRequired(), async (req, res) => {
  try {
    const { titre, description, budget, images, categorie, localisation, badge } = req.body || {};

    if (!titre || !description || budget === undefined || budget === null || !categorie || !localisation) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const catLabel = normalizeCategorieToLabel(categorie);

    const payload = {
      acheteurId: req.user._id,
      titre: String(titre).trim(),
      description: String(description).trim(),
      budget: Number(budget),
      images: Array.isArray(images)
        ? images
            .slice(0, 5)
            .filter((x) => x && x.url && x.publicId)
            .map((x) => ({ url: String(x.url), publicId: String(x.publicId) }))
        : [],
      categorie: catLabel,
      localisation: String(localisation).trim(),
      badge: badge ? String(badge) : "new",
      status: "active",
      dateCreation: new Date(),
    };

    // Validate category against enum by letting Mongoose validate
    const demande = await Demande.create(payload);

    // Create notification for vendors
    const vendors = await User.find({ role: "vendeur", isBanned: false }).select("_id nom");
    if (vendors.length) {
      const notifDocs = vendors.map((v) => ({
        userId: v._id,
        type: "nouvelle_demande",
        data: {
          title: "Nouvelle demande",
          message: `Nouvelle demande: \"${demande.titre}\"`,
          demandeId: String(demande._id),
        },
        read: false,
        dateCreation: new Date(),
      }));
      await Notification.insertMany(notifDocs);
    }

    const populated = await Demande.findById(demande._id).populate("acheteurId");
    return res.status(201).json({ demande: demandeToClient(populated) });
  } catch (err) {
    // Mongoose validation error => 400
    if (err?.name === "ValidationError") {
      return res.status(400).json({ message: "Invalid data", details: err.message });
    }
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/demandes?search=&categorie=
router.get("/demandes", async (req, res) => {
  try {
    const { search, categorie } = req.query || {};

    const filter = { status: { $ne: "deleted" } };

    const catLabel = normalizeCategorieToLabel(categorie);
    if (catLabel) filter.categorie = catLabel;

    if (search && String(search).trim()) {
      const q = String(search).trim();
      filter.$or = [
        { titre: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    const docs = await Demande.find(filter)
      .sort({ dateCreation: -1 })
      .limit(200)
      .populate("acheteurId");

    return res.json({ demandes: docs.map(demandeToClient) });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/demandes/:id
router.get("/demandes/:id", async (req, res) => {
  try {
    const doc = await Demande.findById(req.params.id).populate("acheteurId");
    if (!doc || doc.status === "deleted") return res.status(404).json({ message: "Not found" });
    return res.json({ demande: demandeToClient(doc) });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/demandes/:id (auth owner or admin)
router.delete("/demandes/:id", authRequired(), async (req, res) => {
  try {
    const doc = await Demande.findById(req.params.id);
    if (!doc || doc.status === "deleted") return res.status(404).json({ message: "Not found" });

    const isOwner = String(doc.acheteurId) === String(req.user._id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Forbidden" });

    doc.status = "deleted";
    await doc.save();

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
