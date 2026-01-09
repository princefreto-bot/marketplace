import mongoose from "mongoose";

const ImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

const DemandeSchema = new mongoose.Schema({
  acheteurId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  titre: { type: String, required: true, trim: true, maxlength: 140 },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  budget: { type: Number, required: true, min: 0 },
  images: { type: [ImageSchema], default: [] },
  categorie: {
    type: String,
    enum: [
      "Électronique",
      "Mode & Vêtements",
      "Maison & Jardin",
      "Véhicules",
      "Services",
      "Loisirs & Sports",
      "Immobilier",
      "Autre",
    ],
    required: true,
    index: true,
  },
  localisation: { type: String, required: true, trim: true, maxlength: 140 },
  badge: { type: String, enum: ["new", "urgent", "top", "sponsored"], default: undefined, index: true },
  status: { type: String, enum: ["active", "closed", "deleted"], default: "active", index: true },
  dateCreation: { type: Date, default: Date.now, index: true },
});

export const Demande = mongoose.models.Demande || mongoose.model("Demande", DemandeSchema);
