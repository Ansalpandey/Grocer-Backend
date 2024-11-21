import { createOrder, getOrders } from "../controllers/order.controller.js";
import express from "express";
import auth from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/create-order", auth, createOrder);
router.get("/", auth, getOrders);

export default router;
