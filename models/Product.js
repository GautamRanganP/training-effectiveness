// javascript
// models/Product.js
import mongoose from "mongoose";

function pad(num, size = 6) {
  let s = String(num);
  while (s.length < size) s = "0" + s;
  return s;
}

const WarehouseStockSchema = new mongoose.Schema({
  warehouseCode: { type: String, required: true, trim: true, uppercase: true },
  quantity: { type: Number, default: 0, min: 0 }
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  productId: { type: String, unique: true, trim: true, uppercase: true }, // human-readable id
  name: { type: String, required: true, trim: true },
  category: { type: String, trim: true, uppercase: true, default: "GEN" },
  description: { type: String },
  unit: { type: String, default: "pcs" },
  currentStock: { type: Number, default: 0, min: 0 },
  stockByWarehouse: { type: [WarehouseStockSchema], default: [] },
  reorderLevel: { type: Number, default: 0, min: 0 },
  metadata: { type: mongoose.Schema.Types.Mixed },
  images: [{ url: String, alt: String }]
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

ProductSchema.virtual("id").get(function () {
  return this._id.toString();
});

ProductSchema.pre("save", async function (next) {
  if (this.productId) return next();
  const categoryPart = (this.category || "GEN").toUpperCase();
  const yearPart = new Date().getFullYear();
  const counterId = `product:${categoryPart}:${yearPart}`;
  const { default: Counter } = await import("./Counter.js");
  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  this.productId = `PRD-${categoryPart}-${yearPart}-${pad(counter.seq, 6)}`.toUpperCase();
  next();
});

ProductSchema.methods.recomputeCurrentStockFromWarehouses = function () {
  const total = (this.stockByWarehouse || []).reduce((acc, w) => acc + (w.quantity || 0), 0);
  this.currentStock = total;
  return this.currentStock;
};

export default mongoose.model("Product", ProductSchema);
