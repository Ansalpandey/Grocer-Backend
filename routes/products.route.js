import {
  getTopProducts,
  getProductsByCategory,
  getProductsBetweenPriceRange,
  searchProducts,
  addProductToCart,
  removeProductFromCart,
  getProductsOfCart,
  getProductDetails
} from "../controllers/product.controller.js";
import express from "express";
import auth from "../middlewares/auth.middleware.js";
const router = express.Router();

router.get("/top-products", auth, getTopProducts);
router.get("/category", auth, getProductsByCategory);
router.get("/price-range", auth, getProductsBetweenPriceRange);
router.get("/search", auth, searchProducts);
router.post("/cart", auth, addProductToCart);
router.delete("/cart/:productId", auth, removeProductFromCart);
router.get("/cart", auth, getProductsOfCart);
router.get("/:productId", auth, getProductDetails);

export default router;
