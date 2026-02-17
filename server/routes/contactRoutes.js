import express from "express";
import ContactMessage from "../models/ContactMessage.js";
import { requireAdminAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const message = String(req.body.message || "").trim();

    if (!name || !email || !message) {
      return res.status(400).json({ message: "Name, email, and message are required." });
    }

    const created = await ContactMessage.create({ name, email, message });
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: "Failed to save contact message", error: error.message });
  }
});

router.get("/", requireAdminAuth, async (_req, res) => {
  try {
    const items = await ContactMessage.find().sort({ createdAt: -1 }).limit(200);
    return res.json(items);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load contact messages", error: error.message });
  }
});

export default router;
