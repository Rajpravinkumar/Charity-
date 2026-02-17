import mongoose from "mongoose";

const withdrawalRequestSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 1 },
    note: { type: String, default: "" },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    reviewedAt: { type: Date, default: null }
  },
  { timestamps: true, collection: "WithdrawRequest" }
);

export default mongoose.model("WithdrawalRequest", withdrawalRequestSchema);
