import express from "express";
import upload from "../config/multer.js";
import {
  uploadContract,
  analyzeContract,
} from "../controllers/contract.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// 🔐 Auth MUST come before multer
router.post(
  "/upload",
  authMiddleware,        // 1️⃣ check token
  upload.single("file"), // 2️⃣ then accept file
  uploadContract
);

router.post(
  "/analyze/:id",
  authMiddleware,        // 🔐 protect analyze too
  analyzeContract
);

export default router;
