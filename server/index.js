import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import donationRoutes from "./routes/donationRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import programRoutes from "./routes/programRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/we-all-with-you";

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

async function startServer() {
  try {
    await mongoose.connect(MONGO_URI);
    const { name, host } = mongoose.connection;
    console.log(`Connected MongoDB: db=${name} host=${host}`);
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB", error.message);
    process.exit(1);
  }
}

startServer();
