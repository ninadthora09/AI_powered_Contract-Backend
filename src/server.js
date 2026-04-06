import dotenv from "dotenv";
dotenv.config(); //  MUST be first

import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

app.listen(PORT, () => {
  console.log("GROQ KEY LOADED:", !!process.env.GROQ_API_KEY);
  console.log(`🚀 Server running on port ${PORT}`);
});
