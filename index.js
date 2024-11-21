import express from "express";
import cors from "cors";
import { connectDB } from "./db/db.js";
import dotenv from "dotenv";
import userRoutes from "./routes/user.route.js";
import productRoutes from "./routes/products.route.js";
import orderRoutes from "./routes/order.route.js";
import categoryRoutes from "./routes/category.route.js";
import adminRouter from "./utils/admin.util.js";
import morgan from "morgan";
dotenv.config();
const app = express();
app.use(morgan("dev"));
app.use("/admin", adminRouter); // AdminJS router must come before body-parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Add routes and middleware
  app.use("/api/v1/users", userRoutes);
  app.use("/api/v1/products", productRoutes);
  app.use("/api/v1/orders", orderRoutes);
  app.use("/api/v1/categories", categoryRoutes);

  // Start the server
  app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
  });
};

// Start the server and handle potential connection errors
startServer().catch((error) => console.log("Failed to start server:", error));
