import mongoose from "mongoose";

const contractSchema = new mongoose.Schema(
  {
    // 🔑 LINK TO LOGGED-IN USER
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    fileData: {
      type: Buffer,
      required: true,
    },

    status: {
      type: String,
      enum: ["uploaded", "analyzed"],
      default: "uploaded",
    },

    riskScore: {
      type: Number,
      default: null,
    },

    extractedText: {
      type: String,
      default: "",
    },

    flags: {
      type: Array,
      default: [],
    },

    aiSummary: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

const Contract = mongoose.model("Contract", contractSchema);

export default Contract;
