// javascript
// models/StockTransaction.js
import mongoose from "mongoose";

const StockTransactionSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  type: { type: String, enum: ["procure", "distribute", "adjustment"], required: true },
  quantity: { type: Number, required: true }, // positive quantity
  unitPrice: { type: Number },
  balanceAfter: { type: Number, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  performedByRoleSnapshot: { type: String },
  notes: { type: String },
  invoice: {
    fileUrl: { type: String }, // recommended: store file in S3 and save URL here
    fileName: { type: String },
    fileMimeType: { type: String }
  }
}, { timestamps: true });

export default mongoose.model("StockTransaction", StockTransactionSchema);
