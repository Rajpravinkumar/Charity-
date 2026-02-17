import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 1 },
    note: { type: String, default: "" },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true }
  },
  { timestamps: true, collection: "Withdraw" }
);

export default mongoose.model("Withdrawal", withdrawalSchema);
