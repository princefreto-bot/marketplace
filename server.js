import express from "express";
import dotenv from "dotenv";
import compression from "compression";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { execSync } from "child_process";

// 🔹 MongoDB + Routes
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import demandeRoutes from "./routes/demande.routes.js";

// --------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 🔹 Load environment variables
dotenv.config();

// 🔹 Vérification de MONGO_URI
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI non défini !");
  process.exit(1);
}

// 🔹 Connexion MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// ------------------------------
// Middleware
// ------------------------------
app.use(express.json());       // Parse JSON body
app.use(compression());        // Gzip compression

// ------------------------------
// Routes API
// ------------------------------
app.use("/api/demandes", demandeRoutes);
app.use("/api/auth", authRoutes);

// ------------------------------
// Frontend / SPA fallback
// ------------------------------
const distPath = join(__dirname, "dist");
const indexPath = join(distPath, "index.html");

// Build auto si dist n'existe pas
if (!fs.existsSync(indexPath)) {
  console.log("📦 Application non compilée. Compilation automatique...");
  try {
    execSync("npm run build", {
      stdio: "inherit",
      cwd: __dirname,
      env: { ...process.env, NODE_ENV: "production" }
    });
    console.log("✅ Build terminé !");
  } catch (error) {
    console.error("❌ Erreur lors du build :", error.message);
    process.exit(1);
  }
}

// Serve static files
app.use(express.static(distPath, { maxAge: "1y", etag: true }));

// SPA fallback pour toutes les routes GET non-API
app.get("/*", (req, res) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(503).send("Application en cours de démarrage. Veuillez rafraîchir.");
  }
});

// ------------------------------
// Démarrage du serveur
// ------------------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Local Deals Togo est lancé sur le port ${PORT}`);
});
