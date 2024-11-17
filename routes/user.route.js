import {
  register,
  login,
  forgetPassword,
  refreshToken
} from "../controllers/user.controller.js";
import express from "express";
import auth  from "../middlewares/auth.middleware.js";
import { authorizeAdmin } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.put("/forget-password", forgetPassword);

router.post("/refresh-token", refreshToken);

export default router;