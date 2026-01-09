import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const AvatarSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true },
    publicId: { type: String, trim: true },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["acheteur", "vendeur", "admin"],
    default: "acheteur",
    index: true,
  },
  nom: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  password: { type: String, required: true, minlength: 6 },
  telephone: { type: String, default: "", trim: true },
  localisation: { type: String, default: "", trim: true },
  avatar: { type: AvatarSchema, default: undefined },

  isBanned: { type: Boolean, default: false, index: true },
  banType: { type: String, enum: ["temporary", "permanent"], default: undefined },
  banReason: { type: String, default: undefined },
  banExpiry: { type: Date, default: undefined },

  dateCreation: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
});

UserSchema.pre("save", async function preSave(next) {
  try {
    if (!this.isModified("password")) return next();
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (err) {
    next(err);
  }
});

UserSchema.methods.toSafeJSON = function toSafeJSON() {
  const obj = this.toObject({ virtuals: false });
  delete obj.password;
  // Compat front actuel: avatar attendu comme string parfois
  if (!obj.avatar || !obj.avatar.url) {
    obj.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(obj.nom)}&background=2563EB&color=fff`;
  } else {
    obj.avatar = obj.avatar.url;
  }
  // Compat front: banExpiry en string
  if (obj.banExpiry instanceof Date) obj.banExpiry = obj.banExpiry.toISOString();
  obj.dateCreation = new Date(obj.dateCreation).toISOString();
  obj.lastLogin = new Date(obj.lastLogin).toISOString();
  return obj;
};

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
