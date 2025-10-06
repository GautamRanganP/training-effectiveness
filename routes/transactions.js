// javascript
// routes/transactions.js
import express from "express";
import auth from "../middleware/auth.js";
import { listTransactions, getTransaction, getInvoice } from "../controllers/transactionController.js";
const router = express.Router();
router.get("/", auth, listTransactions);
router.get("/:id", auth, getTransaction);
router.get("/:id/invoice", auth, getInvoice);
export default router;
