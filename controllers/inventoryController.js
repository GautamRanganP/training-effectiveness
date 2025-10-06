// javascript
// controllers/inventoryController.js
import mongoose from "mongoose";
import Product from "../models/Product.js";
import StockTransaction from "../models/StockTransaction.js";

async function createTxAndUpdateProduct(session, product, type, quantity, performedBy, notes = "", invoice = null, unitPrice = null) {
  const qty = Math.abs(quantity);
  const newStock = type === "procure" ? product.currentStock + qty : product.currentStock - qty;
  if (newStock < 0) throw new Error("Insufficient stock");
  product.currentStock = newStock;
  await product.save({ session });

  const tx = new StockTransaction({
    product: product._id,
    type,
    quantity: qty,
    unitPrice,
    balanceAfter: newStock,
    performedBy,
    performedByRoleSnapshot: "adminOrUser",
    notes,
    invoice
  });
  await tx.save({ session });
  return { product, tx };
}

export async function procure(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { productId, quantity, notes, invoice, unitPrice } = req.body;
    if (!quantity || quantity <= 0) throw new Error("Quantity must be > 0");
    const product = await Product.findOne({ _id: productId }).session(session);
    if (!product) throw new Error("Product not found");
    const result = await createTxAndUpdateProduct(session, product, "procure", quantity, req.user._id, notes, invoice, unitPrice);
    await session.commitTransaction();
    session.endSession();
    res.json(result);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: err.message });
  }
}

export async function distribute(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { productId, quantity, notes, invoice } = req.body;
    if (!quantity || quantity <= 0) throw new Error("Quantity must be > 0");
    const product = await Product.findOne({ _id: productId }).session(session);
    if (!product) throw new Error("Product not found");
    if (product.currentStock < quantity) throw new Error("Insufficient stock");
    const result = await createTxAndUpdateProduct(session, product, "distribute", quantity, req.user._id, notes, invoice);
    await session.commitTransaction();
    session.endSession();
    res.json(result);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: err.message });
  }
}

export async function adjust(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { productId, newStock, notes } = req.body;
    if (newStock == null || newStock < 0) throw new Error("Invalid newStock");
    const product = await Product.findOne({ _id: productId }).session(session);
    if (!product) throw new Error("Product not found");
    const qty = Math.abs(newStock - product.currentStock);
    const type = "adjustment";
    product.currentStock = newStock;
    await product.save({ session });

    const tx = new StockTransaction({
      product: product._id,
      type,
      quantity: qty,
      balanceAfter: newStock,
      performedBy: req.user._id,
      performedByRoleSnapshot: req.user.role,
      notes
    });
    await tx.save({ session });
    await session.commitTransaction();
    session.endSession();
    res.json({ product, tx });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: err.message });
  }
}
