import "dotenv/config";
import app from "./app.js";
import { connectToDatabase } from "./db.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    const connection = await connectToDatabase();
    const { name, host } = connection.connection;
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
