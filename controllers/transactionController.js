// javascript
// controllers/transactionController.js
import StockTransaction from "../models/StockTransaction.js";

export async function listTransactions(req, res) {
  const { product, type, skip = 0, limit = 50, startDate, endDate } = req.query;
  const filter = {};
  if (product) filter.product = product;
  if (type) filter.type = type;
  if (startDate || endDate) filter.createdAt = {};
  if (startDate) filter.createdAt.$gte = new Date(startDate);
  if (endDate) filter.createdAt.$lte = new Date(endDate);
  const txs = await StockTransaction.find(filter)
    .sort({ createdAt: -1 })
    .skip(Number(skip))
    .limit(Math.min(200, Number(limit)))
    .populate("product", "productId name")
    .populate("performedBy", "name email");
  res.json(txs);
}

export async function getTransaction(req, res) {
  const tx = await StockTransaction.findById(req.params.id)
    .populate("product", "productId name")
    .populate("performedBy", "name email");
  if (!tx) return res.status(404).json({ message: "Not found" });
  res.json(tx);
}

export async function getInvoice(req, res) {
  const tx = await StockTransaction.findById(req.params.id);
  if (!tx || !tx.invoice || !tx.invoice.fileUrl) return res.status(404).json({ message: "Invoice not found" });
  // recommended: redirect to S3 signed URL or proxy
  res.json({ fileUrl: tx.invoice.fileUrl, fileName: tx.invoice.fileName, fileMimeType: tx.invoice.fileMimeType });
}
