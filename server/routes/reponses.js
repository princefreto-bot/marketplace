import express from "express";
import { Reponse } from "../models/Reponse.js";
import { Demande } from "../models/Demande.js";
import { Notification } from "../models/Notification.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

function reponseToClient(doc) {
  const r = doc.toObject ? doc.toObject({ virtuals: false }) : doc;

  const vendeurDoc = r.vendeurId && typeof r.vendeurId === "object" && r.vendeurId.toSafeJSON
    ? r.vendeurId
    : null;

  const demandeDoc = r.demandeId && typeof r.demandeId === "object" ? r.demandeId : null;

  return {
    _id: String(r._id),
    demandeId: String(demandeDoc?._id || r.demandeId),
    demande: demandeDoc
      ? {
          _id: String(demandeDoc._id),
          acheteurId: String(demandeDoc.acheteurId),
          titre: demandeDoc.titre,
          budget: demandeDoc.budget,
          categorie: demandeDoc.categorie,
          localisation: demandeDoc.localisation,
          badge: demandeDoc.badge || undefined,
          status: demandeDoc.status,
          dateCreation: demandeDoc.dateCreation ? new Date(demandeDoc.dateCreation).toISOString() : undefined,
        }
      : undefined,
    vendeurId: String(vendeurDoc?._id || r.vendeurId),
    vendeur: vendeurDoc ? vendeurDoc.toSafeJSON() : undefined,
    message: r.message,
    images: Array.isArray(r.images) ? r.images : [],
    dateCreation: r.dateCreation ? new Date(r.dateCreation).toISOString() : new Date().toISOString(),
  };
}

// POST /api/demandes/:id/reponses (auth, vendeur)
router.post("/demandes/:id/reponses", authRequired(), async (req, res) => {
  try {
    if (req.user.role !== "vendeur") {
      return res.status(403).json({ message: "Only vendors can respond" });
    }

    const demandeId = req.params.id;
    const { message, images } = req.body || {};

    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const demande = await Demande.findById(demandeId);
    if (!demande || demande.status === "deleted") {
      return res.status(404).json({ message: "Demande not found" });
    }

    // Prevent vendor responding to own demande
    if (String(demande.acheteurId) === String(req.user._id)) {
      return res.status(400).json({ message: "Cannot respond to your own demande" });
    }

    // Prevent duplicates (one response per vendor per demande)
    const existing = await Reponse.findOne({ demandeId: demande._id, vendeurId: req.user._id });
    if (existing) {
      return res.status(409).json({ message: "You already responded to this demande" });
    }

    const reponse = await Reponse.create({
      demandeId: demande._id,
      vendeurId: req.user._id,
      message: String(message).trim(),
      images: Array.isArray(images)
        ? images
            .slice(0, 5)
            .filter((x) => x && x.url && x.publicId)
            .map((x) => ({ url: String(x.url), publicId: String(x.publicId) }))
        : [],
      dateCreation: new Date(),
    });

    // Notify buyer
    await Notification.create({
      userId: demande.acheteurId,
      type: "reponse",
      data: {
        title: "Nouvelle réponse",
        message: `${req.user.nom} a répondu à votre demande \"${demande.titre}\"`,
        demandeId: String(demande._id),
      },
      read: false,
      dateCreation: new Date(),
    });

    const populated = await Reponse.findById(reponse._id)
      .populate("vendeurId")
      .populate("demandeId");

    return res.status(201).json({ reponse: reponseToClient(populated) });
  } catch (err) {
    if (err?.name === "ValidationError") {
      return res.status(400).json({ message: "Invalid data", details: err.message });
    }
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/reponses
// Optional query: demandeId, vendeurId, acheteurId
router.get("/reponses", async (req, res) => {
  try {
    const { demandeId, vendeurId, acheteurId } = req.query || {};

    const filter = {};
    if (demandeId) filter.demandeId = String(demandeId);
    if (vendeurId) filter.vendeurId = String(vendeurId);

    // If acheteurId provided: return responses for demandes owned by acheteurId
    if (acheteurId) {
      const demandeIds = await Demande.find({ acheteurId: String(acheteurId), status: { $ne: "deleted" } }).select("_id");
      filter.demandeId = { $in: demandeIds.map((d) => d._id) };
    }

    const docs = await Reponse.find(filter)
      .sort({ dateCreation: -1 })
      .limit(500)
      .populate("vendeurId")
      .populate("demandeId");

    return res.json({ reponses: docs.map(reponseToClient) });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
