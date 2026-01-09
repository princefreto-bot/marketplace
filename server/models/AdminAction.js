import mongoose from "mongoose";

const AdminActionSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  action: { type: String, required: true, trim: true },
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: undefined },
  targetPostId: { type: mongoose.Schema.Types.ObjectId, ref: "Demande", default: undefined },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  dateCreation: { type: Date, default: Date.now },
});

export const AdminAction = mongoose.models.AdminAction || mongoose.model("AdminAction", AdminActionSchema);
