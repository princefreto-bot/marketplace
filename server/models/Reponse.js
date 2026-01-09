import mongoose from "mongoose";

const ImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

const ReponseSchema = new mongoose.Schema({
  demandeId: { type: mongoose.Schema.Types.ObjectId, ref: "Demande", required: true, index: true },
  vendeurId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  images: { type: [ImageSchema], default: [] },
  dateCreation: { type: Date, default: Date.now, index: true },
});

export const Reponse = mongoose.models.Reponse || mongoose.model("Reponse", ReponseSchema);
