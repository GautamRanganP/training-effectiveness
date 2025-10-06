// javascript
// controllers/adminController.js
import StockTransaction from "../models/StockTransaction.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

export async function getDashboard(req, res) {
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  const [procuredAgg] = await StockTransaction.aggregate([
    { $match: { type: "procure", createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: null, total: { $sum: "$quantity" } } }
  ]);
  const [distributedAgg] = await StockTransaction.aggregate([
    { $match: { type: "distribute", createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: null, total: { $sum: "$quantity" } } }
  ]);

  const lowStock = await Product.find({ currentStock: { $lte: "$reorderLevel" } }).lean().limit(50).catch(()=>[]);

  const recentTx = await StockTransaction.find({})
    .sort({ createdAt: -1 })
    .limit(20)
    .populate("product", "productId name")
    .populate("performedBy", "name email");

  res.json({
    totalProcured: procuredAgg?.total || 0,
    totalDistributed: distributedAgg?.total || 0,
    lowStock,
    recentTx
  });
}
