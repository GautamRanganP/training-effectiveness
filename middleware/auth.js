// javascript
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid Authorization header" });
  }
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select("-password");
    if (!user) return res.status(401).json({ message: "User not found" });
    req.user = { id: user._id.toString(), role: user.role };
    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin privileges required" });
  }
  next();
}
