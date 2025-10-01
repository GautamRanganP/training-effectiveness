// javascript
import express from "express";
import ExcelJS from "exceljs";
import Training from "../models/Training.js";
import { authMiddleware, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// Stream Excel for current user
router.get("/mine", authMiddleware, async (req, res) => {
  try {
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=training-report-${req.user.id}.xlsx`);

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });
    const worksheet = workbook.addWorksheet("Trainings");

    worksheet.columns = [
      { header: "Training Code", key: "trainingCode", width: 30 },
      { header: "Training Effectiveness (%)", key: "trainingEffectivenessPercent", width: 20 },
      { header: "Created At", key: "createdAt", width: 25 },
      { header: "Updated At", key: "updatedAt", width: 25 },
      { header: "Owner", key: "owner", width: 36 }
    ];

    const cursor = Training.find({ owner: req.user.id }).cursor();

    for await (const doc of cursor) {
      worksheet.addRow({
        trainingCode: doc.trainingCode,
        trainingEffectivenessPercent: doc.trainingEffectivenessPercent,
        createdAt: doc.createdAt ? doc.createdAt.toISOString() : "",
        updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : "",
        owner: doc.owner.toString()
      }).commit();
    }

    worksheet.commit();
    await workbook.commit();
  } catch (err) {
    console.error("Export mine error:", err);
    if (!res.headersSent) res.status(500).json({ message: "Export failed" });
    else res.end();
  }
});

// Admin: stream Excel for all or filtered by ownerId
router.get("/", authMiddleware, adminOnly, async (req, res) => {
  try {
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=training-report-all.xlsx`);

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });
    const worksheet = workbook.addWorksheet("Trainings");

    worksheet.columns = [
      { header: "Training Code", key: "trainingCode", width: 30 },
      { header: "Training Effectiveness (%)", key: "trainingEffectivenessPercent", width: 20 },
      { header: "Created At", key: "createdAt", width: 25 },
      { header: "Updated At", key: "updatedAt", width: 25 },
      { header: "Owner", key: "owner", width: 36 }
    ];

    const filter = {};
    if (req.query.ownerId) filter.owner = req.query.ownerId;

    const cursor = Training.find(filter).cursor();

    for await (const doc of cursor) {
      worksheet.addRow({
        trainingCode: doc.trainingCode,
        trainingEffectivenessPercent: doc.trainingEffectivenessPercent,
        createdAt: doc.createdAt ? doc.createdAt.toISOString() : "",
        updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : "",
        owner: doc.owner.toString()
      }).commit();
    }

    worksheet.commit();
    await workbook.commit();
  } catch (err) {
    console.error("Export all error:", err);
    if (!res.headersSent) res.status(500).json({ message: "Export failed" });
    else res.end();
  }
});

export default router;
