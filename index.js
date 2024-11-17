import express from "express";
import { connectDB } from "./db/db.js";
import dotenv from "dotenv";
import userRoutes from "./routes/user.route.js";
import adminRouter from "./utils/admin.util.js";

dotenv.config();
const app = express();
app.use("/admin", adminRouter); // AdminJS router must come before body-parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Add routes and middleware
  app.use("/api/v1/users", userRoutes);

  // Start the server
  app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
  });
};

// Start the server and handle potential connection errors
startServer().catch((error) => console.log("Failed to start server:", error));
