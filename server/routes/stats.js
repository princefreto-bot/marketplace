import express from "express";
import { User } from "../models/User.js";
import { Demande } from "../models/Demande.js";
import { Reponse } from "../models/Reponse.js";
import { Message } from "../models/Message.js";

const router = express.Router();

// GET /api/stats
router.get("/stats", async (_req, res) => {
  try {
    const [totalUsers, totalDemandes, totalReponses, totalMessages] = await Promise.all([
      User.countDocuments(),
      Demande.countDocuments({ status: { $ne: "deleted" } }),
      Reponse.countDocuments(),
      Message.countDocuments(),
    ]);

    return res.json({ totalUsers, totalDemandes, totalReponses, totalMessages });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
