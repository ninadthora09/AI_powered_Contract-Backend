import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import aiRoutes from "./routes/ai.routes.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
     
// Routes
import healthRoutes from "./routes/health.routes.js";
import contractRoutes from "./routes/contract.routes.js";

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/contracts", contractRoutes);

export default app;
