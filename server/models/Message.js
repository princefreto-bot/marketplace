import mongoose from "mongoose";

const ImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

const MessageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, index: true },
  demandeId: { type: mongoose.Schema.Types.ObjectId, ref: "Demande", required: true, index: true },
  demandeTitre: { type: String, required: true, trim: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  message: { type: String, default: "", trim: true, maxlength: 5000 },
  images: { type: [ImageSchema], default: [] },
  dateCreation: { type: Date, default: Date.now, index: true },
});

export const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);
