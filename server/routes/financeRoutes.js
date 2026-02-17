import express from "express";
import Donation from "../models/Donation.js";
import Withdrawal from "../models/Withdrawal.js";
import WithdrawalRequest from "../models/WithdrawalRequest.js";
import ManagementLog from "../models/ManagementLog.js";
import { requireAdminAuth, requireApprover } from "../middleware/authMiddleware.js";

const router = express.Router();

function parsePaging(query) {
  const page = Math.max(Number(query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize || 10), 1), 100);
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip };
}

function toCsvValue(value) {
  if (value === undefined || value === null) return "";
  const stringValue = String(value);
  if (stringValue.includes(",") || stringValue.includes("\"") || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, "\"\"")}"`;
  }
  return stringValue;
}

async function buildOverview() {
  const donationAgg = await Donation.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]);
  const withdrawalAgg = await Withdrawal.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]);

  const totalReceived = donationAgg[0]?.total || 0;
  const totalWithdrawn = withdrawalAgg[0]?.total || 0;
  const balance = totalReceived - totalWithdrawn;

  return { totalReceived, totalWithdrawn, balance };
}

router.get("/overview", requireAdminAuth, async (_req, res) => {
  try {
    const totals = await buildOverview();
    const donationCount = await Donation.countDocuments();
    const withdrawalCount = await Withdrawal.countDocuments();
    const pendingRequestCount = await WithdrawalRequest.countDocuments({ status: "pending" });
    const pendingRequestAgg = await WithdrawalRequest.aggregate([
      { $match: { status: "pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const pendingRequestedAmount = pendingRequestAgg[0]?.total || 0;
    const lastWithdrawal = await Withdrawal.findOne().sort({ createdAt: -1 });

    return res.json({
      ...totals,
      donationCount,
      withdrawalCount,
      pendingRequestCount,
      pendingRequestedAmount,
      lastWithdrawal
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load finance overview", error: error.message });
  }
});

router.get("/withdrawals", requireAdminAuth, async (_req, res) => {
  try {
    const { page, pageSize, skip } = parsePaging(_req.query);
    const [items, total] = await Promise.all([
      Withdrawal.find().sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      Withdrawal.countDocuments()
    ]);
    return res.json({
      items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load withdrawals" });
  }
});

router.get("/donations", requireAdminAuth, requireApprover, async (req, res) => {
  try {
    const { country, paymentMethod, dateFrom, dateTo } = req.query;
    const { page, pageSize, skip } = parsePaging(req.query);

    const filter = {};
    if (country) filter.country = { $regex: `^${String(country).trim()}$`, $options: "i" };
    if (paymentMethod) filter.paymentMethod = String(paymentMethod).trim();
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const [items, total] = await Promise.all([
      Donation.find(filter)
        .select("name email amount paymentMethod donationType country createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      Donation.countDocuments(filter)
    ]);

    return res.json({
      items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load donations", error: error.message });
  }
});

router.get("/donations/export.csv", requireAdminAuth, requireApprover, async (req, res) => {
  try {
    const { country, paymentMethod, dateFrom, dateTo } = req.query;
    const filter = {};
    if (country) filter.country = { $regex: `^${String(country).trim()}$`, $options: "i" };
    if (paymentMethod) filter.paymentMethod = String(paymentMethod).trim();
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const donations = await Donation.find(filter)
      .select("name email country amount paymentMethod donationType createdAt")
      .sort({ createdAt: -1 })
      .limit(5000);

    const headers = ["name", "email", "country", "amount", "paymentMethod", "donationType", "createdAt"];
    const rows = donations.map((item) =>
      [
        toCsvValue(item.name),
        toCsvValue(item.email),
        toCsvValue(item.country),
        toCsvValue(item.amount),
        toCsvValue(item.paymentMethod),
        toCsvValue(item.donationType),
        toCsvValue(item.createdAt?.toISOString?.() || item.createdAt)
      ].join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    return res
      .status(200)
      .setHeader("Content-Type", "text/csv; charset=utf-8")
      .setHeader("Content-Disposition", "attachment; filename=donations.csv")
      .send(csv);
  } catch (error) {
    return res.status(500).json({ message: "Failed to export donations CSV", error: error.message });
  }
});

router.get("/withdraw-requests", requireAdminAuth, async (_req, res) => {
  try {
    const { page, pageSize, skip } = parsePaging(_req.query);
    const filter = {};
    if (_req.query.status) filter.status = String(_req.query.status).trim();
    const [items, total] = await Promise.all([
      WithdrawalRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      WithdrawalRequest.countDocuments(filter)
    ]);
    return res.json({
      items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load withdrawal requests" });
  }
});

router.get("/management-logs", requireAdminAuth, requireApprover, async (req, res) => {
  try {
    const { page, pageSize, skip } = parsePaging(req.query);
    const [items, total] = await Promise.all([
      ManagementLog.find().sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      ManagementLog.countDocuments()
    ]);

    return res.json({
      items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load management logs", error: error.message });
  }
});

router.post("/withdraw-request", requireAdminAuth, async (req, res) => {
  try {
    const amount = Number(req.body.amount || 0);
    const note = String(req.body.note || "").trim();

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Withdrawal amount must be greater than 0" });
    }

    const request = await WithdrawalRequest.create({
      amount,
      note,
      requestedBy: req.admin.id
    });
    await ManagementLog.create({
      action: "WITHDRAW_REQUEST_CREATED",
      actorAdminId: req.admin.id,
      actorEmail: req.admin.email,
      details: `amount=${amount}; note=${note || "none"}`
    });

    return res.status(201).json(request);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create withdrawal request", error: error.message });
  }
});

router.patch("/withdraw-requests/:id/approve", requireAdminAuth, requireApprover, async (req, res) => {
  try {
    const request = await WithdrawalRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Withdrawal request not found" });
    if (request.status !== "pending") return res.status(400).json({ message: "Request already reviewed" });

    const totals = await buildOverview();
    if (request.amount > totals.balance) {
      return res.status(400).json({ message: "Insufficient balance to approve this withdrawal" });
    }

    const withdrawal = await Withdrawal.create({
      amount: request.amount,
      note: request.note,
      adminId: req.admin.id
    });

    request.status = "approved";
    request.approvedBy = req.admin.id;
    request.reviewedAt = new Date();
    await request.save();
    await ManagementLog.create({
      action: "WITHDRAW_REQUEST_APPROVED",
      actorAdminId: req.admin.id,
      actorEmail: req.admin.email,
      details: `requestId=${request._id}; amount=${request.amount}`
    });

    return res.json({ request, withdrawal });
  } catch (error) {
    return res.status(500).json({ message: "Failed to approve withdrawal request", error: error.message });
  }
});

router.patch("/withdraw-requests/:id/reject", requireAdminAuth, requireApprover, async (req, res) => {
  try {
    const request = await WithdrawalRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Withdrawal request not found" });
    if (request.status !== "pending") return res.status(400).json({ message: "Request already reviewed" });

    request.status = "rejected";
    request.approvedBy = req.admin.id;
    request.reviewedAt = new Date();
    await request.save();
    await ManagementLog.create({
      action: "WITHDRAW_REQUEST_REJECTED",
      actorAdminId: req.admin.id,
      actorEmail: req.admin.email,
      details: `requestId=${request._id}; amount=${request.amount}`
    });

    return res.json(request);
  } catch (error) {
    return res.status(500).json({ message: "Failed to reject withdrawal request", error: error.message });
  }
});

export default router;
