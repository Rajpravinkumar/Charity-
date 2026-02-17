import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import ManagementLog from "../models/ManagementLog.js";

function signAdminToken(admin) {
  return jwt.sign(
    { id: admin._id.toString(), email: admin.email, role: "admin", adminRole: "approver" },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: "7d" }
  );
}

export async function registerAdmin(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password || password.length < 6) {
      return res.status(400).json({ message: "Name, email and password (min 6 chars) are required" });
    }

    const normalizedEmail = String(email).toLowerCase();
    const existing = await Admin.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "Admin email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await Admin.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role: "approver"
    });

    await ManagementLog.create({
      action: "ADMIN_REGISTER",
      actorAdminId: admin._id,
      actorEmail: admin.email,
      details: `Registered with role=${admin.role}`
    });
    return res.status(201).json({
      message: "Admin registered successfully. Please login to continue.",
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role }
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not register admin", error: error.message });
  }
}

export async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = String(email).toLowerCase();
    const admin = await Admin.findOne({ email: normalizedEmail });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (admin.role !== "approver") {
      admin.role = "approver";
      await admin.save();
    }

    const token = signAdminToken(admin);
    return res.json({
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email, role: "approver" }
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not login admin", error: error.message });
  }
}

export async function getAdminProfile(req, res) {
  try {
    const admin = await Admin.findById(req.admin.id).select("_id name email role");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    return res.json({ admin: { id: admin._id, name: admin.name, email: admin.email, role: "approver" } });
  } catch (error) {
    return res.status(500).json({ message: "Could not load admin profile", error: error.message });
  }
}

export async function listAdmins(req, res) {
  try {
    const admins = await Admin.find().select("_id name email role createdAt").sort({ createdAt: -1 });
    return res.json(
      admins.map((admin) => ({
        ...admin.toObject(),
        role: "approver"
      }))
    );
  } catch (error) {
    return res.status(500).json({ message: "Could not load admins", error: error.message });
  }
}

export async function updateAdminRole(req, res) {
  try {
    const { role } = req.body;
    if (role !== "approver") {
      return res.status(400).json({ message: "Viewer role removed. Role must stay approver." });
    }

    const targetAdmin = await Admin.findById(req.params.id);
    if (!targetAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    targetAdmin.role = role;
    await targetAdmin.save();
    await ManagementLog.create({
      action: "ADMIN_ROLE_UPDATE",
      actorAdminId: req.admin.id,
      actorEmail: req.admin.email,
      details: `Updated ${targetAdmin.email} role to ${role}`
    });

    return res.json({
      id: targetAdmin._id,
      name: targetAdmin.name,
      email: targetAdmin.email,
      role: targetAdmin.role
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not update admin role", error: error.message });
  }
}
