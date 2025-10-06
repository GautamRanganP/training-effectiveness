// javascript
import express from "express";
import Training from "../models/Training.js";
import { authMiddleware, adminOnly } from "../middleware/auth.js";
import mongoose from "mongoose";

const router = express.Router();

// Create training (owner auto set)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { trainingCode, trainingEffectivenessPercent } = req.body;
    if (trainingCode == null || trainingEffectivenessPercent == null) {
      return res.status(400).json({ message: "trainingCode and trainingEffectivenessPercent are required" });
    }

    const training = new Training({
      trainingCode,
      trainingEffectivenessPercent,
      owner: req.user.id
    });

    await training.save();
    res.status(201).json(training);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Duplicate trainingCode for this user" });
    }
    console.error("Create training error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/owners", authMiddleware, adminOnly, async (req, res) => {
  try {
    const owners = await Training.aggregate([
      { $group: { _id: "$owner", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          id: "$_id",
          name: "$user.name",
          email: "$user.email",
          count: 1
        }
      },
      { $sort: { name: 1 } }
    ]).exec();

    res.json({ owners: owners.map(o => ({ id: String(o.id), name: o.name || "Unknown", email: o.email, count: o.count })) });
  } catch (err) {
    console.error("Failed to load owners:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get current user's trainings
router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const trainings = await Training.find({ owner: req.user.id }).sort({ updatedAt: -1 });
    res.json(trainings);
  } catch (err) {
    console.error("Get mine error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// javascript
router.get("/", authMiddleware, adminOnly, async (req, res) => {
  try {
    const match = {};

    if (req.query.ownerId) {
      const ownerId = String(req.query.ownerId).trim();
      if (!mongoose.Types.ObjectId.isValid(ownerId)) {
        return res.status(400).json({ message: "Invalid ownerId" });
      }
      // instantiate ObjectId with `new`
      match.owner = new mongoose.Types.ObjectId(ownerId);
    }

    const trainings = await Training.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "ownerInfo"
        }
      },
      { $unwind: { path: "$ownerInfo", preserveNullAndEmptyArrays: true } },
      { $addFields: { ownerName: "$ownerInfo.name" } },
      { $project: { ownerInfo: 0 } },
      { $sort: { owner: 1, updatedAt: -1 } }
    ]).exec();

    res.json(trainings);
  } catch (err) {
    console.error("Admin list error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single training (owner or admin)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const t = await Training.findById(req.params.id);
    if (!t) return res.status(404).json({ message: "Not found" });
    if (t.owner.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json(t);
  } catch (err) {
    console.error("Get training error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update training (owner or admin) - append version
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) return res.status(404).json({ message: "Not found" });

    if (training.owner.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Save previous state snapshot
    training.versions.push({
      trainingCode: training.trainingCode,
      trainingEffectivenessPercent: training.trainingEffectivenessPercent,
      updatedBy: req.user.id,
      updatedAt: new Date()
    });

    if (req.body.trainingCode !== undefined) training.trainingCode = req.body.trainingCode;
    if (req.body.trainingEffectivenessPercent !== undefined) {
      training.trainingEffectivenessPercent = req.body.trainingEffectivenessPercent;
    }

    await training.save();
    res.json(training);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "Duplicate trainingCode for this user" });
    console.error("Update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete training (owner or admin)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) return res.status(404).json({ message: "Not found" });

    if (training.owner.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Use model-level deletion to avoid relying on document.remove()
    await Training.findByIdAndDelete(req.params.id);

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// Admin: list all trainings (optional owner filter)
// javascript



export default router;
