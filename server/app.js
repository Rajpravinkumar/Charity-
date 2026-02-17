import express from "express";
import cors from "cors";
import donationRoutes from "./routes/donationRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import programRoutes from "./routes/programRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

app.get("/", (_req, res) => {
  res.json({ message: "We All With You API is running" });
});

app.use("/api/donations", donationRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/programs", programRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/contact", contactRoutes);

export default app;
