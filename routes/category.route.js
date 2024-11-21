import { getCategories } from "../controllers/category.controller.js";
import express from "express";
const router = express.Router();
import auth from "../middlewares/auth.middleware.js";
router.get("/", auth, getCategories);
export default router;