// javascript
// controllers/productController.js
import Product from "../models/Product.js";

export async function createProduct(req, res) {
  try {
    const { productId, name, category, description, unit, reorderLevel } = req.body;
    const p = new Product({ productId, name, category, description, unit, reorderLevel });
    await p.save();
    res.status(201).json(p);
  } catch (err) {
    if (err.code === 11000 && err.keyValue && err.keyValue.productId) {
      return res.status(409).json({ message: "productId already exists" });
    }
    res.status(400).json({ message: err.message });
  }
}

export async function listProducts(req, res) {
  const { q, skip = 0, limit = 50 } = req.query;
  const filter = q ? { name: { $regex: q, $options: "i" } } : {};
  const products = await Product.find(filter).skip(Number(skip)).limit(Math.min(200, Number(limit))).lean();
  res.json(products);
}

export async function getProduct(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Not found" });
  res.json(product);
}

export async function updateProduct(req, res) {
  try {
    const updates = req.body;
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: "Not found" });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function deleteProduct(req, res) {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: "Not found" });
  res.json({ message: "Deleted" });
}
