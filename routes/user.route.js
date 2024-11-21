import {
  register,
  login,
  forgetPassword,
  refreshToken,
  updateUserInfo,
  getUserProfile
} from "../controllers/user.controller.js";
import express from "express";
import auth  from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.put("/forget-password", forgetPassword);
router.put("/update-user", auth, updateUserInfo);
router.post("/refresh-token", refreshToken);
router.get("/profile", auth, getUserProfile);

export default router;