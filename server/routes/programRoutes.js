import express from "express";
import Program from "../models/Program.js";
import ManagementLog from "../models/ManagementLog.js";
import { requireAdminAuth, requireApprover } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const page = Math.max(Number(_req.query.page || 1), 1);
    const pageSize = Math.min(Math.max(Number(_req.query.pageSize || 20), 1), 100);
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      Program.find().sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      Program.countDocuments()
    ]);

    return res.json({
      items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch programs" });
  }
});

router.post("/", requireAdminAuth, requireApprover, async (req, res) => {
  try {
    const { title, category, description, imageUrl, imageData, receivedAmount } = req.body;

    const program = await Program.create({
      title,
      category,
      description,
      imageUrl,
      imageData,
      receivedAmount
    });
    await ManagementLog.create({
      action: "PROGRAM_CREATED",
      actorAdminId: req.admin.id,
      actorEmail: req.admin.email,
      details: `programId=${program._id}; title=${program.title}`
    });

    return res.status(201).json(program);
  } catch (error) {
    return res.status(400).json({ message: "Invalid program data", error: error.message });
  }
});

router.patch("/:id/amount", requireAdminAuth, requireApprover, async (req, res) => {
  try {
    const { amount } = req.body;
    const updated = await Program.findByIdAndUpdate(
      req.params.id,
      { $set: { receivedAmount: Number(amount || 0) } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Program not found" });
    await ManagementLog.create({
      action: "PROGRAM_AMOUNT_UPDATED",
      actorAdminId: req.admin.id,
      actorEmail: req.admin.email,
      details: `programId=${updated._id}; amount=${Number(amount || 0)}`
    });
    return res.json(updated);
  } catch (error) {
    return res.status(400).json({ message: "Could not update amount", error: error.message });
  }
});

router.delete("/:id", requireAdminAuth, requireApprover, async (req, res) => {
  try {
    const deleted = await Program.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Program not found" });
    await ManagementLog.create({
      action: "PROGRAM_DELETED",
      actorAdminId: req.admin.id,
      actorEmail: req.admin.email,
      details: `programId=${deleted._id}; title=${deleted.title}`
    });
    return res.json({ message: "Program deleted", id: deleted._id });
  } catch (error) {
    return res.status(400).json({ message: "Could not delete program", error: error.message });
  }
});

export default router;
