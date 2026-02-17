import mongoose from "mongoose";

const programSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: "" },
    imageData: { type: String, default: "" },
    receivedAmount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model("Program", programSchema);
