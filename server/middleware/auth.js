import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

function getTokenFromReq(req) {
  const h = req.headers.authorization || "";
  const [type, token] = h.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
}

export function authRequired() {
  return async (req, res, next) => {
    try {
      const token = getTokenFromReq(req);
      if (!token) return res.status(401).json({ message: "Unauthorized" });

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.sub);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      // Auto-unban if temporary ban expired
      if (user.isBanned && user.banType === "temporary" && user.banExpiry) {
        if (new Date(user.banExpiry).getTime() <= Date.now()) {
          user.isBanned = false;
          user.banType = undefined;
          user.banReason = undefined;
          user.banExpiry = undefined;
          await user.save();
        }
      }

      if (user.isBanned) {
        return res.status(403).json({
          message: "Account banned",
          banType: user.banType,
          banReason: user.banReason,
          banExpiry: user.banExpiry ? new Date(user.banExpiry).toISOString() : undefined,
        });
      }

      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  };
}
