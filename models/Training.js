// javascript
import mongoose from "mongoose";

const { Schema } = mongoose;

const TrainingVersionSchema = new Schema({
  trainingCode: String,
  trainingEffectivenessPercent: Number,
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const TrainingSchema = new Schema({
  trainingCode: { type: String, required: true, trim: true },
  trainingEffectivenessPercent: { type: Number, required: true, min: 0, max: 100 },
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  versions: [TrainingVersionSchema]
}, { timestamps: true });

// Allow same trainingCode across users, but unique per owner
// TrainingSchema.index({ owner: 1, trainingCode: 1 }, { unique: true });

export default mongoose.model("Training", TrainingSchema);
