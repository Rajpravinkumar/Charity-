import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["approver"], default: "approver" }
  },
  { timestamps: true, collection: "Admin" }
);

export default mongoose.model("Admin", adminSchema);
