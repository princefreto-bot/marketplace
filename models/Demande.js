import mongoose from "mongoose";

const demandeSchema = new mongoose.Schema(
  {
    titre: { type: String, required: true },
    description: { type: String, required: true },
    budget: { type: Number, required: true },
    categorie: { type: String, required: true },
    localisation: { type: String, required: true },
    images: [
      {
        url: String,
        publicId: String
      }
    ],
    acheteur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Demande", demandeSchema);
