// javascript
// routes/admin.js
import express from "express";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import { getDashboard } from "../controllers/adminController.js";
const router = express.Router();
router.get("/dashboard", auth, admin, getDashboard);
export default router;
