// javascript
// routes/inventory.js
import express from "express";
import auth from "../middleware/auth.js";
import { procure, distribute, adjust } from "../controllers/inventoryController.js";
const router = express.Router();
router.post("/procure", auth, procure);
router.post("/distribute", auth, distribute);
router.post("/adjust", auth, adjust);
export default router;
