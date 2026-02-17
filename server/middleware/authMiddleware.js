import jwt from "jsonwebtoken";

export function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return res.status(401).json({ message: "Admin token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    req.admin = decoded;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireApprover(req, res, next) {
  if (!req.admin) {
    return res.status(401).json({ message: "Admin token missing" });
  }

  if (req.admin.adminRole !== "approver") {
    return res.status(403).json({ message: "Approver role required" });
  }

  return next();
}
