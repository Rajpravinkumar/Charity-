import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 1 },
    donationType: { type: String, enum: ["monthly", "once"], required: true },
    selectedQuote: { type: String, required: true },
    paymentMethod: { type: String, enum: ["qr", "creditcard", "debitcard"], required: true }
  },
  { timestamps: true, collection: "Donate" }
);

export default mongoose.model("Donation", donationSchema);
