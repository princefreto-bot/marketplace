import express from "express";
import { authRequired } from "../middleware/auth.js";
import { Message } from "../models/Message.js";
import { Demande } from "../models/Demande.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";

const router = express.Router();

function stableConversationId(demandeId, userAId, userBId) {
  const a = String(userAId);
  const b = String(userBId);
  const [minId, maxId] = a < b ? [a, b] : [b, a];
  return `${String(demandeId)}_${minId}_${maxId}`;
}

function messageToClient(doc) {
  const m = doc.toObject ? doc.toObject({ virtuals: false }) : doc;
  return {
    _id: String(m._id),
    conversationId: m.conversationId,
    demandeId: String(m.demandeId),
    demandeTitre: m.demandeTitre,
    senderId: String(m.senderId),
    receiverId: String(m.receiverId),
    message: m.message || "",
    images: Array.isArray(m.images) ? m.images : [],
    dateCreation: m.dateCreation ? new Date(m.dateCreation).toISOString() : new Date().toISOString(),
  };
}

// POST /api/messages (auth)
// body: { receiverId, demandeId, demandeTitre?, message?, images? }
router.post("/messages", authRequired(), async (req, res) => {
  try {
    const { receiverId, demandeId, demandeTitre, message, images } = req.body || {};

    if (!receiverId || !demandeId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const msgText = message ? String(message).trim() : "";
    const imgs = Array.isArray(images)
      ? images
          .slice(0, 5)
          .filter((x) => x && x.url && x.publicId)
          .map((x) => ({ url: String(x.url), publicId: String(x.publicId) }))
      : [];

    if (!msgText && imgs.length === 0) {
      return res.status(400).json({ message: "Message or image is required" });
    }

    const demande = await Demande.findById(String(demandeId));
    if (!demande || demande.status === "deleted") {
      return res.status(404).json({ message: "Demande not found" });
    }

    const receiver = await User.findById(String(receiverId));
    if (!receiver) return res.status(404).json({ message: "Receiver not found" });

    const convId = stableConversationId(demande._id, req.user._id, receiver._id);

    const created = await Message.create({
      conversationId: convId,
      demandeId: demande._id,
      demandeTitre: String(demandeTitre || demande.titre || "").trim(),
      senderId: req.user._id,
      receiverId: receiver._id,
      message: msgText,
      images: imgs,
      dateCreation: new Date(),
    });

    // Notification for receiver
    await Notification.create({
      userId: receiver._id,
      type: "message",
      data: {
        title: "Nouveau message",
        message: `${req.user.nom} vous a envoyé un message`,
        conversationId: convId,
        senderId: String(req.user._id),
        demandeId: String(demande._id),
        demandeTitre: String(demande.titre),
      },
      read: false,
      dateCreation: new Date(),
    });

    return res.status(201).json({ message: messageToClient(created) });
  } catch (err) {
    if (err?.name === "ValidationError") {
      return res.status(400).json({ message: "Invalid data", details: err.message });
    }
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/messages/:conversationId (auth)
router.get("/messages/:conversationId", authRequired(), async (req, res) => {
  try {
    const conversationId = String(req.params.conversationId);

    // Ensure the requester is part of the conversation
    const one = await Message.findOne({
      conversationId,
      $or: [{ senderId: req.user._id }, { receiverId: req.user._id }],
    }).select("_id");

    if (!one) return res.status(404).json({ message: "Conversation not found" });

    const docs = await Message.find({ conversationId })
      .sort({ dateCreation: 1 })
      .limit(2000);

    return res.json({ messages: docs.map(messageToClient) });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/conversations/:userId (auth)
router.get("/conversations/:userId", authRequired(), async (req, res) => {
  try {
    const userId = String(req.params.userId);

    if (String(req.user._id) !== userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Fetch recent messages involving user, newest first
    const recent = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    })
      .sort({ dateCreation: -1 })
      .limit(3000);

    const map = new Map();
    for (const m of recent) {
      const cid = m.conversationId;
      if (!map.has(cid)) {
        map.set(cid, m);
      }
    }

    const lastMessages = Array.from(map.values());

    // Build conversations with otherUser + unreadCount (from unread message notifications)
    const conversations = [];
    for (const last of lastMessages) {
      const otherUserId = String(last.senderId) === userId ? String(last.receiverId) : String(last.senderId);
      const otherUser = await User.findById(otherUserId);

      const unreadCount = await Notification.countDocuments({
        userId,
        type: "message",
        read: false,
        "data.conversationId": last.conversationId,
      });

      conversations.push({
        conversationId: last.conversationId,
        demandeId: String(last.demandeId),
        demandeTitre: last.demandeTitre,
        otherUser: otherUser ? otherUser.toSafeJSON() : { _id: otherUserId, nom: "Utilisateur", avatar: "", role: "acheteur" },
        lastMessage: messageToClient(last),
        unreadCount,
      });
    }

    // Keep newest first
    conversations.sort((a, b) => new Date(b.lastMessage.dateCreation).getTime() - new Date(a.lastMessage.dateCreation).getTime());

    return res.json({ conversations });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/messages/:messageId (auth) - Supprimer un message (seulement l'expéditeur)
router.delete("/messages/:messageId", authRequired(), async (req, res) => {
  try {
    const messageId = String(req.params.messageId);
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    // Seul l'expéditeur ou un admin peut supprimer
    if (String(message.senderId) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Vous ne pouvez supprimer que vos propres messages" });
    }
    
    await Message.findByIdAndDelete(messageId);
    
    // Supprimer aussi les notifications liées à ce message
    await Notification.deleteMany({
      type: "message",
      "data.messageId": messageId,
    });
    
    return res.json({ success: true, message: "Message supprimé" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/conversations/:conversationId (auth) - Supprimer une conversation entière
router.delete("/conversations/:conversationId", authRequired(), async (req, res) => {
  try {
    const conversationId = String(req.params.conversationId);
    
    // Vérifier que l'utilisateur fait partie de la conversation
    const oneMessage = await Message.findOne({
      conversationId,
      $or: [{ senderId: req.user._id }, { receiverId: req.user._id }],
    });
    
    if (!oneMessage && req.user.role !== "admin") {
      return res.status(404).json({ message: "Conversation not found" });
    }
    
    // Supprimer tous les messages de la conversation
    const result = await Message.deleteMany({ conversationId });
    
    // Supprimer les notifications liées à cette conversation
    await Notification.deleteMany({
      type: "message",
      "data.conversationId": conversationId,
    });
    
    return res.json({ 
      success: true, 
      message: `Conversation supprimée (${result.deletedCount} messages)` 
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
