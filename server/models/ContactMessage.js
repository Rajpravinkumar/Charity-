import mongoose from "mongoose";

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    message: { type: String, required: true, trim: true }
  },
  { timestamps: true, collection: "ContactMessage" }
);

export default mongoose.model("ContactMessage", contactMessageSchema);
