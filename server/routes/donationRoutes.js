import express from "express";
import Donation from "../models/Donation.js";
import { requireAdminAuth, requireApprover } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const amountFromBody = Number(req.body.amount || 0);
    const donationType = req.body.donationType;
    const fallbackAmount = donationType === "monthly" ? 25 : 60;
    const amount = amountFromBody > 0 ? amountFromBody : fallbackAmount;

    const donation = await Donation.create({
      ...req.body,
      amount
    });
    return res.status(201).json(donation);
  } catch (error) {
    return res.status(400).json({ message: "Invalid donation data", error: error.message });
  }
});

router.get("/", requireAdminAuth, requireApprover, async (_req, res) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 });
    return res.json(donations);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch donations" });
  }
});

export default router;
