import * as AdminJS from "adminjs"; // Importing AdminJS as a namespace
import * as AdminJSMongoose from "@adminjs/mongoose"; // Importing @adminjs/mongoose as a namespace
import AdminJSExpress from "@adminjs/express"; // Importing AdminJS Express adapter
import session from "express-session"; // Import express-session
import MongoDBStore from "connect-mongodb-session"; // Import the MongoDB store
import User from "../models/user.model.js"; // Assuming User model is in this path
import Category from "../models/category.model.js";
import Product from "../models/product.model.js";
import dotenv from "dotenv";
import { dark, noSidebar, light } from "@adminjs/themes"; // Import the dark theme from AdminJS
import bcrypt from "bcryptjs"; // Import bcrypt for password hashing
import Order from "../models/order.model.js";

dotenv.config();

// Register Mongoose Adapter with AdminJS
AdminJS.default.registerAdapter(AdminJSMongoose);

// Initialize AdminJS
const admin = new AdminJS.default({
  rootPath: "/admin",
  resources: [
    {
      resource: User,
      options: {
        listProperties: ["email", "name", "role", "phone", "cart"], // Display these properties in the list view
        filterProperties: ["email", "role"],
        editProperties: ["name", "email", "role", "password", "phone"], // Edit these properties in the edit view
        actions: {
          edit: {
            before: async (request) => {
              if (request.payload && request.payload.password) {
                const hashedPassword = await bcrypt.hash(
                  request.payload.password,
                  10
                ); // Hash the password
                request.payload = {
                  ...request.payload,
                  password: hashedPassword, // Replace the plain password with the hashed password
                };
              }
              return request;
            },
          },
          new: {
            before: async (request) => {
              if (request.payload && request.payload.password) {
                const bcrypt = await import("bcrypt"); // Import bcrypt
                const hashedPassword = await bcrypt.hash(
                  request.payload.password,
                  10
                ); // Hash the password
                request.payload = {
                  ...request.payload,
                  password: hashedPassword, // Replace the plain password with the hashed password
                };
              }
              return request;
            },
          },
        },
      },
    },
    {
      resource: Category,
      options: {
        listProperties: ["name", "categoryImage"],
        editProperties: ["name", "categoryImage"],
      },
    },
    {
      resource: Order,
      options: {
        properties: {
          totalPrice: {
            isVisible: true, // Visible in the list and edit views
            type: "number",
            isReadOnly: true, // Total price should not be edited directly
          },
          orderItems: {
            isArray: true, // Indicate that orderItems is an array of objects
            properties: {
              name: { isVisible: true },
              quantity: {
                isVisible: true, // Make sure quantity is visible
                type: "number", // Define the field type explicitly
              },
              image: { isVisible: true },
              price: { isVisible: true },
            },
          },
          filterProperties: [
            "createdAt",
            "isDelivered",
            "isOutForDelivery",
            "isOrderShipped",
          ],
          user: {
            isVisible: { list: false, edit: true, show: true },
          },
          shippingAddress: {
            isVisible: {
              list: true, // Displayed in the list view
              edit: false, // Hidden in the edit form
              show: true, // Displayed in the show view
            },
            isDisabled: true, // Prevents editing the field
          },
          isDelivered: {
            isVisible: { list: true, edit: true, show: true },
          },
          isOutForDelivery: {
            isVisible: { list: true, edit: true, show: true },
          },
          isOrderShipped: {
            isVisible: { list: true, edit: true, show: true },
          },
        },
      },
    },
    {
      resource: Product,
      options: {
        listProperties: [
          "name",
          "category",
          "price",
          "discount",
          "inStock",
          "rating",
          "productImage",
          "description",
        ],
        editProperties: [
          "name",
          "category",
          "price",
          "discount",
          "inStock",
          "productImage",
          "rating",
          "description",
        ],
      },
    },
  ],
  branding: {
    companyName: "Grocer - Dashboard",
    favicon:
      "https://res.cloudinary.com/ansalpandey/image/upload/v1731832509/c3mnxwig5gsfrpuls4bw.png",
    withMadeWithLove: false,
    // logo: "https://res.cloudinary.com/ansalpandey/image/upload/v1731832509/c3mnxwig5gsfrpuls4bw.png",
  },
  defaultTheme: dark.id,
  availableThemes: [dark, light, noSidebar],
});

// Create MongoDB session store
const mongoDBStoreInstance = new MongoDBStore(session); // Renamed the variable to avoid conflict
const store = new mongoDBStoreInstance({
  uri: process.env.MONGODB_URI,
  collection: "admin_sessions",
  expires: 1000 * 60 * 60 * 24 * 30 * 3, // Expire after 3 months
});

// Error handling for session store
store.on("error", (error) => {
  console.error("Session Store Error:", error);
});

// Authenticate AdminJS users
const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
  admin,
  {
    authenticate: async (email, password) => {
      const user = await User.findOne({ email });
      if (
        user &&
        (await user.isPasswordCorrect(password)) &&
        user.role === "admin"
      ) {
        return user;
      }
      return null;
    },
    cookieName: "adminjs",
    cookiePassword: process.env.SESSION_SECRET,
  },
  null,
  {
    store,
    resave: false,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
  }
);

export default adminRouter;
