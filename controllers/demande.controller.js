import Demande from "../models/Demande.js";

export const getDemandes = async (req, res) => {
  const demandes = await Demande.find().sort({ createdAt: -1 });
  res.json(demandes);
};

export const createDemande = async (req, res) => {
  try {
    const demande = await Demande.create({
      ...req.body,
      user: req.user.id
    });
    res.status(201).json(demande);
  } catch (error) {
    res.status(400).json({ message: "Erreur création demande" });
  }
};
