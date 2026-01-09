import mongoose from "mongoose";

const ImageSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true },
    publicId: { type: String, trim: true },
  },
  { _id: false }
);

const SliderSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 140 },
  description: { type: String, default: "", trim: true, maxlength: 300 },
  image: { type: ImageSchema, default: undefined },
  buttonText: { type: String, default: "", trim: true },
  buttonLink: { type: String, default: "", trim: true },
  isActive: { type: Boolean, default: true, index: true },
  order: { type: Number, default: 1 },
});

SliderSchema.methods.toClientJSON = function toClientJSON() {
  const obj = this.toObject();
  obj.image = obj.image?.url || obj.image || "";
  return obj;
};

export const Slider = mongoose.models.Slider || mongoose.model("Slider", SliderSchema);
