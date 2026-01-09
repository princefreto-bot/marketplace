import express from "express";
import cors from "cors";
import compression from "compression";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

import { connectMongo, requireEnv } from "./server/db.js";
import authRoutes from "./server/routes/auth.js";
import userRoutes from "./server/routes/users.js";
import demandeRoutes from "./server/routes/demandes.js";
import reponseRoutes from "./server/routes/reponses.js";
import messageRoutes from "./server/routes/messages.js";
import notificationRoutes from "./server/routes/notifications.js";
import uploadRoutes from "./server/routes/upload.js";
import statsRoutes from "./server/routes/stats.js";
import adminRoutes from "./server/routes/admin.js";
import publicRoutes from "./server/routes/public.js";
import { seedIfEmpty } from "./server/utils/seed.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";

// Required env vars (NO fallback)
try {
  requireEnv("MONGODB_URI");
  requireEnv("JWT_SECRET");
  requireEnv("CLOUDINARY_CLOUD_NAME");
  requireEnv("CLOUDINARY_API_KEY");
  requireEnv("CLOUDINARY_API_SECRET");
} catch (e) {
  console.error("❌", e?.message || e);
  process.exit(1);
}

app.use(compression());
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "local-deals-togo" });
});

// API routes
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", demandeRoutes);
app.use("/api", reponseRoutes);
app.use("/api", messageRoutes);
app.use("/api", notificationRoutes);
app.use("/api", uploadRoutes);
app.use("/api", statsRoutes);
app.use("/api", adminRoutes);
app.use("/api", publicRoutes);


// Serve static SPA (expects `npm run build` executed by Render)
const distPath = join(__dirname, "dist");
const indexPath = join(distPath, "index.html");

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, { maxAge: "1y", etag: true }));
}

// SPA fallback (Express 5 compatible)
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api") && req.headers.accept?.includes("text/html")) {
    if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  }
  next();
});

// Start ONLY after MongoDB is connected
(async () => {
  try {
    await connectMongo();
    
    // Seed SEULEMENT si la base est vide (premier démarrage ou après reset manuel)
    // Les données persistent dans MongoDB Atlas même quand Render passe en veille
    await seedIfEmpty();

    app.listen(PORT, HOST, () => {
      console.log(`🚀 Local Deals Togo running on http://${HOST}:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect MongoDB. Server will not start.");
    console.error(err);
    process.exit(1);
  }
})();

