// javascript
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import trainingRoutes from "./routes/trainings.js";
import exportRoutes from "./routes/export.js";
import productRoutes from "./routes/products.js"

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// app.use(cors());

const allowedOrigins = [process.env.DEV_URL, process.env.FRONTEND_URL];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser tools like Postman
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

app.options("*", cors());
app.use(express.json());
app.use(morgan("dev"));

if (!process.env.MONGODB_URI) {
  console.error("Missing MONGODB_URI in environment");
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error("Missing JWT_SECRET in environment");
  process.exit(1);
}

await connectDB(process.env.MONGODB_URI);

// Routes
app.get("/", (req, res) => res.json({ message: "Training backend up" }));
app.use("/api/auth", authRoutes);
app.use("/api/trainings", trainingRoutes);
app.use("/api/report-excel", exportRoutes);
app.use("/api/products", productRoutes);

// Generic error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (!res.headersSent) res.status(500).json({ message: "Server error" });
  else res.end();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
