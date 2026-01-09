import express from "express";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import compression from "compression";
import fs from "fs";

// 🔹 Import DB et routes
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import demandeRoutes from "./routes/demande.routes.js";

// --------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config(); // Active les variables d’environnement

// 🔹 Connexion MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI non défini !");
  process.exit(1);
}

connectDB(); // Assure-toi que connectDB utilise process.env.MONGO_URI

// --------------------------------------------------
// 🔹 Création du serveur Express
const app = express();
const PORT = process.env.PORT || 3000;

// 🔹 Middleware JSON
app.use(express.json());

// 🔹 Compression pour optimiser les fichiers statiques
app.use(compression());

// --------------------------------------------------
// 🔹 ROUTES API
app.use("/api/demandes", demandeRoutes);
app.use("/api/auth", authRoutes);

// --------------------------------------------------
// 🔹 SERVIR LE FRONT (VITE BUILD)
const distPath = join(__dirname, "dist");
const indexPath = join(distPath, "index.html");

if (!fs.existsSync(distPath)) {
  console.warn("⚠️ Le dossier dist n'existe pas. Assure-toi d'avoir fait `npm run build` avant de déployer.");
}

app.use(express.static(distPath, { maxAge: "1y", etag: true }));

// SPA fallback pour React Router
app.get("*", (req, res) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(503).send("Application en cours de démarrage. Veuillez rafraîchir.");
  }
});

// --------------------------------------------------
// 🔹 LANCEMENT DU SERVEUR
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Local Deals Togo est lancé sur le port ${PORT}`);
});
