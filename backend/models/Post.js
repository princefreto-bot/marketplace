import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now }
});

PostSchema.index({ createdAt: -1 });

export default mongoose.model("Post", PostSchema);
