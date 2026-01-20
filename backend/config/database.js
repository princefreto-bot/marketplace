/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Configuration de la Base de Données MongoDB
 * ═══════════════════════════════════════════════════════════════════════════
 */

import mongoose from 'mongoose';

/**
 * Connexion à MongoDB
 */
export const connectDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('MONGODB_URI non défini dans les variables d\'environnement');
    }

    // Options de connexion
    const options = {
      // Nouvelles options recommandées pour Mongoose 8+
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    // Connexion
    const conn = await mongoose.connect(mongoURI, options);

    console.log(`📦 MongoDB connecté: ${conn.connection.host}`);

    // Gestion des événements de connexion
    mongoose.connection.on('error', (err) => {
      console.error('❌ Erreur MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB déconnecté');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnecté');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('📦 Connexion MongoDB fermée (SIGINT)');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);
    process.exit(1);
  }
};

/**
 * Déconnexion de MongoDB
 */
export const disconnectDatabase = async () => {
  try {
    await mongoose.connection.close();
    console.log('📦 Connexion MongoDB fermée');
  } catch (error) {
    console.error('❌ Erreur lors de la déconnexion:', error);
  }
};

export default { connectDatabase, disconnectDatabase };
