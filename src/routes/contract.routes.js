import { Router } from "express";
import upload from "../config/multer.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { uploadContract } from "../controllers/contract.controller.js";
import { analyzeContract } from "../controllers/analyze.controller.js";
import { getContractReport } from "../controllers/report.controller.js";
import { getMyContracts } from "../controllers/contract.controller.js";


const router = Router();

// 🔐 Protect ALL routes
router.post(
  "/upload",
  authMiddleware,              // ✅ FIRST: check user
  upload.single("file"),       // ✅ THEN: accept file
  uploadContract
);

router.post(
  "/:id/analyze",
  authMiddleware,
  analyzeContract
);

router.get(
  "/:id/report",
  authMiddleware,
  getContractReport
);

router.get(
  "/",
  authMiddleware, // 🔐 must be logged in
  getMyContracts
);


export default router;
