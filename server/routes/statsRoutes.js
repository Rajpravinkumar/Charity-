import express from "express";
import Donation from "../models/Donation.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const donorCount = await Donation.countDocuments();
    const donationsTotalAgg = await Donation.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]);
    const totalPaidAmount = donationsTotalAgg[0]?.total || 0;

    const sufferingCount = 309000000;
    const benefitedBase = 12400000;
    const benefitedCount = benefitedBase + donorCount * 5;

    return res.json({
      sufferingCount,
      benefitedCount,
      donorCount,
      totalPaidAmount
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load stats" });
  }
});

export default router;
