import express from "express";
import {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  listAdmins,
  updateAdminRole
} from "../controllers/authController.js";
import { requireAdminAuth, requireApprover } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/me", requireAdminAuth, getAdminProfile);
router.get("/admins", requireAdminAuth, requireApprover, listAdmins);
router.patch("/admins/:id/role", requireAdminAuth, requireApprover, updateAdminRole);

export default router;
