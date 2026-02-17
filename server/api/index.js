import "dotenv/config";
import app from "../app.js";
import { connectToDatabase } from "../db.js";

export default async function handler(req, res) {
  try {
    await connectToDatabase();
    return app(req, res);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to connect to MongoDB",
      error: error.message
    });
  }
}
