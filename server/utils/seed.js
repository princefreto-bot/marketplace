import { User } from "../models/User.js";
import { Demande } from "../models/Demande.js";
import { Slider } from "../models/Slider.js";
import { SocialLink } from "../models/SocialLink.js";

export async function seedIfEmpty() {
  const userCount = await User.countDocuments();
  if (userCount > 0) return { seeded: false };

  // IMPORTANT: User model already hashes password in pre-save.
  // Provide plaintext here.
  const [admin, acheteur, vendeur1, vendeur2] = await User.create([
    {
      role: "admin",
      nom: "Admin Local Deals",
      email: "admin@localdeals.tg",
      password: "admin123",
      telephone: "+228 79 90 72 62",
      localisation: "Lomé, Togo",
      dateCreation: new Date(),
      lastLogin: new Date(),
    },
    {
      role: "acheteur",
      nom: "Marie Dupont",
      email: "marie@test.com",
      password: "password123",
      telephone: "+228 90 12 34 56",
      localisation: "Lomé, Togo",
      dateCreation: new Date(),
      lastLogin: new Date(),
    },
    {
      role: "vendeur",
      nom: "Jean Kokou",
      email: "jean@test.com",
      password: "password123",
      telephone: "+228 91 23 45 67",
      localisation: "Kara, Togo",
      dateCreation: new Date(),
      lastLogin: new Date(),
    },
    {
      role: "vendeur",
      nom: "Sophie Mensah",
      email: "sophie@test.com",
      password: "password123",
      telephone: "+228 92 34 56 78",
      localisation: "Sokodé, Togo",
      dateCreation: new Date(),
      lastLogin: new Date(),
    },
  ]);

  // Sliders
  await Slider.create([
    {
      title: "Bienvenue sur Local Deals Togo",
      description: "La première plateforme de petites annonces 100% togolaise",
      image: { url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200", publicId: "seed_slider_1" },
      buttonText: "Découvrir",
      buttonLink: "#demandes",
      isActive: true,
      order: 1,
    },
    {
      title: "Achetez et Vendez Facilement",
      description: "Des milliers d'offres près de chez vous",
      image: { url: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200", publicId: "seed_slider_2" },
      buttonText: "Publier une annonce",
      buttonLink: "#publier",
      isActive: true,
      order: 2,
    },
    {
      title: "Rejoignez la Communauté",
      description: "Plus de 10 000 utilisateurs nous font confiance",
      image: { url: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200", publicId: "seed_slider_3" },
      buttonText: "S'inscrire",
      buttonLink: "#inscription",
      isActive: true,
      order: 3,
    },
  ]);

  // Social links
  await SocialLink.create([
    { platform: "Facebook", url: "https://facebook.com/localdeals", icon: "facebook", isActive: true, order: 1 },
    { platform: "WhatsApp", url: "https://wa.me/22879907262", icon: "whatsapp", isActive: true, order: 2 },
    { platform: "Instagram", url: "https://instagram.com/localdeals", icon: "instagram", isActive: true, order: 3 },
  ]);

  // 3 demandes d'exemple
  await Demande.create([
    {
      acheteurId: acheteur._id,
      titre: "Recherche iPhone 14 Pro Max",
      description: "Je cherche un iPhone 14 Pro Max en bon état. Couleur noir ou violet, 256GB minimum.",
      budget: 450000,
      images: [
        { url: "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400", publicId: "seed_iphone_1" },
      ],
      categorie: "Électronique",
      localisation: "Lomé, Togo",
      badge: "urgent",
      status: "active",
      dateCreation: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      acheteurId: acheteur._id,
      titre: "Appartement F3 à louer",
      description: "Cherche un appartement F3 à Tokoin ou Djidjolé. Budget 150 000 FCFA/mois.",
      budget: 150000,
      images: [
        { url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400", publicId: "seed_apt_1" },
      ],
      categorie: "Immobilier",
      localisation: "Lomé, Togo",
      badge: "top",
      status: "active",
      dateCreation: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      acheteurId: acheteur._id,
      titre: "Toyota Corolla 2018+",
      description: "Recherche Toyota Corolla 2018 ou plus récente, kilométrage < 80 000 km.",
      budget: 8500000,
      images: [
        { url: "https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=400", publicId: "seed_toyota_1" },
      ],
      categorie: "Véhicules",
      localisation: "Lomé, Togo",
      badge: "sponsored",
      status: "active",
      dateCreation: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  ]);

  return { seeded: true, adminId: admin._id, acheteurId: acheteur._id, vendeur1Id: vendeur1._id, vendeur2Id: vendeur2._id };
}
