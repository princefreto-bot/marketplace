import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: {
    type: String,
    enum: ["message", "reponse", "nouvelle_demande", "admin", "ban"],
    required: true,
    index: true,
  },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  read: { type: Boolean, default: false, index: true },
  dateCreation: { type: Date, default: Date.now, index: true },
});

export const Notification =
  mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
