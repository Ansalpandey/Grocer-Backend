import * as AdminJS from 'adminjs'; // Importing AdminJS as a namespace
import * as AdminJSMongoose from '@adminjs/mongoose'; // Importing @adminjs/mongoose as a namespace
import AdminJSExpress from '@adminjs/express'; // Importing AdminJS Express adapter
import session from 'express-session'; // Import express-session
import MongoDBStore from 'connect-mongodb-session'; // Import the MongoDB store
import User from '../models/user.model.js'; // Assuming User model is in this path
import Category from '../models/category.model.js';
import Product from '../models/product.model.js';
import dotenv from 'dotenv';
import { dark, noSidebar, light } from '@adminjs/themes'; // Import the dark theme from AdminJS
import bcrypt from 'bcryptjs'; // Import bcrypt for password hashing

dotenv.config();

// Register Mongoose Adapter with AdminJS
AdminJS.default.registerAdapter(AdminJSMongoose);

// Initialize AdminJS
const admin = new AdminJS.default({
  rootPath: '/admin',
  resources: [
    {
      resource: User,
      options: {
        listProperties: ['email', 'name', 'role'],
        filterProperties: ['email', 'role'],
        editProperties: ['name', 'email', 'role', 'password'],
        actions: {
          edit: {
            before: async (request) => {
              if (request.payload && request.payload.password) {
                const hashedPassword = await bcrypt.hash(request.payload.password, 10); // Hash the password
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
                const bcrypt = await import('bcrypt'); // Import bcrypt
                const hashedPassword = await bcrypt.hash(request.payload.password, 10); // Hash the password
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
        listProperties: ['name', 'image'],
        editProperties: ['name', 'image'],
      },
    },
    {
      resource: Product,
      options: {
        listProperties: ['name', 'category', 'price', 'discount', 'inStock'],
        editProperties: ['name', 'category', 'price', 'discount', 'inStock', 'productImages'],
      },
    },
  ],
  branding: {
    companyName: 'Humara Apna Bazaar - Dashboard',
    favicon: 'https://res.cloudinary.com/ansalpandey/image/upload/v1731832509/c3mnxwig5gsfrpuls4bw.png',
    withMadeWithLove: false,
    logo: 'https://res.cloudinary.com/ansalpandey/image/upload/v1731832509/c3mnxwig5gsfrpuls4bw.png',
  },
  defaultTheme: dark.id,
  availableThemes: [dark, light, noSidebar],
});

// Create MongoDB session store
const mongoDBStoreInstance = new MongoDBStore(session); // Renamed the variable to avoid conflict
const store = new mongoDBStoreInstance({
  uri: process.env.MONGODB_URI,
  collection: 'admin_sessions',
});

// Error handling for session store
store.on('error', (error) => {
  console.error('Session Store Error:', error);
});

// Authenticate AdminJS users
const adminRouter = AdminJSExpress.buildAuthenticatedRouter(admin, {
  authenticate: async (email, password) => {
    const user = await User.findOne({ email });
    if (user && (await user.isPasswordCorrect(password)) && user.role === 'admin') {
      return user;
    }
    return null;
  },
  cookieName: 'adminjs',
  cookiePassword: process.env.SESSION_SECRET,
}, null, {
  store,
  resave: false,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
});

export default adminRouter;
