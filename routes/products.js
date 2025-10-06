// javascript
// routes/products.js
import express from "express";
import {authMiddleware} from "../middleware/auth.js"
// import admin from "../middleware/admin.js";
import { createProduct, listProducts, getProduct, updateProduct, deleteProduct } from "../controllers/productController.js";
const router = express.Router();
router.post("/", authMiddleware, createProduct);
router.get("/", authMiddleware, listProducts);
// router.get("/:id", auth, getProduct);
// router.patch("/:id", auth, admin, updateProduct);
// router.delete("/:id", auth, admin, deleteProduct);
export default router;
