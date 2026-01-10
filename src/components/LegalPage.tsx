import { useState } from "react";
import { ArrowLeftIcon } from "./Icons";

type Tab = "cgu" | "cgv" | "privacy" | "cookies";

interface LegalPageProps {
  onBack: () => void;
  initialTab?: Tab;
}

export default function LegalPage({ onBack, initialTab = "cgu" }: LegalPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const tabs: { id: Tab; label: string }[] = [
    { id: "cgu", label: "CGU" },
    { id: "cgv", label: "CGV" },
    { id: "privacy", label: "Confidentialité" },
    { id: "cookies", label: "Cookies" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Mentions Légales</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
          {activeTab === "cgu" && <CGUContent />}
          {activeTab === "cgv" && <CGVContent />}
          {activeTab === "privacy" && <PrivacyContent />}
          {activeTab === "cookies" && <CookiesContent />}
        </div>
      </div>
    </div>
  );
}

function CGUContent() {
  return (
    <div className="prose prose-blue max-w-none">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Conditions Générales d'Utilisation
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
      </p>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Objet</h3>
        <p className="text-gray-600 leading-relaxed">
          Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de la plateforme 
          <strong> Local Deals Togo</strong>, accessible à l'adresse du site. Local Deals Togo est une 
          plateforme de mise en relation entre acheteurs et vendeurs pour la publication et la consultation 
          de petites annonces au Togo et dans la sous-région.
        </p>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Acceptation des conditions</h3>
        <p className="text-gray-600 leading-relaxed">
          L'accès et l'utilisation de la plateforme impliquent l'acceptation sans réserve des présentes CGU. 
          Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser nos services. Nous nous réservons 
          le droit de modifier ces CGU à tout moment. Les utilisateurs seront informés de toute modification 
          substantielle.
        </p>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Inscription et compte utilisateur</h3>
        <div className="text-gray-600 leading-relaxed space-y-3">
          <p>Pour publier des annonces ou contacter des annonceurs, vous devez créer un compte en fournissant :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Un nom ou pseudonyme</li>
            <li>Une adresse email valide</li>
            <li>Un mot de passe sécurisé</li>
            <li>Un numéro de téléphone (optionnel mais recommandé)</li>
          </ul>
          <p>Vous vous engagez à :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Fournir des informations exactes et à jour</li>
            <li>Maintenir la confidentialité de vos identifiants</li>
            <li>Signaler immédiatement toute utilisation non autorisée de votre compte</li>
            <li>Ne pas créer plusieurs comptes pour contourner une suspension</li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Publication d'annonces</h3>
        <div className="text-gray-600 leading-relaxed space-y-3">
          <p><strong>4.1 Règles de publication</strong></p>
          <p>Les annonces doivent :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Être rédigées en français ou dans une langue compréhensible localement</li>
            <li>Correspondre à une catégorie appropriée</li>
            <li>Contenir une description honnête et précise du bien ou service</li>
            <li>Indiquer un prix réaliste en FCFA</li>
            <li>Inclure des photos authentiques du produit/service proposé</li>
          </ul>
          
          <p className="mt-4"><strong>4.2 Contenus interdits</strong></p>
          <p>Il est strictement interdit de publier :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Produits contrefaits, volés ou d'origine douteuse</li>
            <li>Armes, drogues, médicaments sans ordonnance</li>
            <li>Contenus à caractère pornographique ou obscène</li>
            <li>Offres d'emploi frauduleuses ou pyramidales</li>
            <li>Contenus discriminatoires, haineux ou diffamatoires</li>
            <li>Données personnelles de tiers sans consentement</li>
            <li>Annonces mensongères ou trompeuses</li>
            <li>Tout produit ou service illégal au Togo</li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Responsabilités</h3>
        <div className="text-gray-600 leading-relaxed space-y-3">
          <p><strong>5.1 Responsabilité de la plateforme</strong></p>
          <p>
            Local Deals Togo agit en qualité d'intermédiaire et n'est pas partie aux transactions 
            entre utilisateurs. Nous ne garantissons pas :
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>La qualité, légalité ou conformité des produits/services annoncés</li>
            <li>La solvabilité ou l'honnêteté des utilisateurs</li>
            <li>La réalisation effective des transactions</li>
          </ul>
          
          <p className="mt-4"><strong>5.2 Responsabilité des utilisateurs</strong></p>
          <p>Les utilisateurs sont seuls responsables :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Du contenu de leurs annonces et messages</li>
            <li>De la véracité des informations fournies</li>
            <li>Du respect des lois en vigueur</li>
            <li>De la sécurisation de leurs transactions</li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Conseils de sécurité</h3>
        <div className="text-gray-600 leading-relaxed">
          <p>Pour des transactions sûres, nous recommandons :</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Privilégier les rencontres en personne dans des lieux publics</li>
            <li>Vérifier le produit avant tout paiement</li>
            <li>Éviter les paiements à l'avance à des inconnus</li>
            <li>Se méfier des offres trop alléchantes</li>
            <li>Ne jamais communiquer vos informations bancaires sensibles</li>
            <li>Signaler tout comportement suspect à notre équipe</li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Modération et sanctions</h3>
        <div className="text-gray-600 leading-relaxed">
          <p>
            Notre équipe se réserve le droit de modérer les contenus et de prendre les mesures suivantes 
            en cas de non-respect des CGU :
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Suppression de l'annonce concernée</li>
            <li>Avertissement de l'utilisateur</li>
            <li>Suspension temporaire du compte (7, 30 ou 90 jours)</li>
            <li>Bannissement définitif de la plateforme</li>
            <li>Signalement aux autorités compétentes si nécessaire</li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">8. Propriété intellectuelle</h3>
        <p className="text-gray-600 leading-relaxed">
          L'ensemble des éléments constituant la plateforme (logo, design, textes, fonctionnalités) 
          sont protégés par le droit de la propriété intellectuelle. Toute reproduction, représentation 
          ou exploitation non autorisée est interdite. Les utilisateurs conservent les droits sur leurs 
          contenus mais accordent à Local Deals Togo une licence d'utilisation pour la diffusion sur la plateforme.
        </p>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">9. Contact</h3>
        <div className="text-gray-600 leading-relaxed">
          <p>Pour toute question concernant ces CGU, contactez-nous :</p>
          <ul className="list-none mt-2 space-y-1">
            <li>📧 Email : Princefreto@gmail.com</li>
            <li>📱 WhatsApp : +228 79 90 72 62</li>
            <li>📍 Adresse : Lomé, Togo</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

function CGVContent() {
  return (
    <div className="prose prose-blue max-w-none">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Conditions Générales de Vente
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
      </p>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Services proposés</h3>
        <div className="text-gray-600 leading-relaxed space-y-3">
          <p>Local Deals Togo propose les services suivants :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Publication gratuite</strong> : Publication d'annonces standard sans frais</li>
            <li><strong>Options de visibilité</strong> : Mise en avant payante des annonces (à venir)</li>
            <li><strong>Badges premium</strong> : Labels "Urgent", "Top", "Sponsorisé" (à venir)</li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Transactions entre utilisateurs</h3>
        <p className="text-gray-600 leading-relaxed">
          Local Deals Togo est une plateforme de mise en relation. Les transactions s'effectuent 
          directement entre acheteurs et vendeurs. La plateforme n'intervient pas dans les négociations, 
          paiements ou livraisons. Chaque partie est responsable de s'assurer de la bonne exécution 
          de la transaction.
        </p>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Prix et paiements</h3>
        <div className="text-gray-600 leading-relaxed space-y-3">
          <p>
            Les prix affichés dans les annonces sont fixés librement par les vendeurs et exprimés 
            en Francs CFA (FCFA). Local Deals Togo n'est pas responsable des erreurs de prix 
            dans les annonces.
          </p>
          <p>
            Les modalités de paiement sont convenues directement entre les parties. Nous recommandons 
            les paiements en main propre lors de la remise du bien.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Litiges</h3>
        <p className="text-gray-600 leading-relaxed">
          En cas de litige entre utilisateurs, Local Deals Togo peut, à sa discrétion, tenter 
          une médiation sans y être obligée. Les litiges non résolus doivent être portés devant 
          les tribunaux compétents de Lomé, Togo.
        </p>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Droit de rétractation</h3>
        <p className="text-gray-600 leading-relaxed">
          Les transactions entre particuliers ne sont pas soumises au droit de rétractation légal. 
          Toutefois, les vendeurs professionnels doivent respecter la réglementation en vigueur 
          concernant le droit de rétractation.
        </p>
      </section>
    </div>
  );
}

function PrivacyContent() {
  return (
    <div className="prose prose-blue max-w-none">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Politique de Confidentialité
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
      </p>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Données collectées</h3>
        <div className="text-gray-600 leading-relaxed space-y-3">
          <p>Nous collectons les données suivantes :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Données d'identification</strong> : nom, email, téléphone, mot de passe (crypté)</li>
            <li><strong>Données de profil</strong> : photo de profil, localisation</li>
            <li><strong>Données d'annonces</strong> : titres, descriptions, photos, prix</li>
            <li><strong>Données de communication</strong> : messages échangés entre utilisateurs</li>
            <li><strong>Données techniques</strong> : adresse IP, type de navigateur, historique de connexion</li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Utilisation des données</h3>
        <div className="text-gray-600 leading-relaxed space-y-3">
          <p>Vos données sont utilisées pour :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Gérer votre compte et authentifier vos connexions</li>
            <li>Publier et afficher vos annonces</li>
            <li>Permettre la communication entre utilisateurs</li>
            <li>Envoyer des notifications relatives à votre activité</li>
            <li>Améliorer nos services et votre expérience</li>
            <li>Prévenir les fraudes et abus</li>
            <li>Respecter nos obligations légales</li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Partage des données</h3>
        <div className="text-gray-600 leading-relaxed space-y-3">
          <p>Vos données peuvent être partagées avec :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Autres utilisateurs</strong> : informations publiques de votre profil et annonces</li>
            <li><strong>Prestataires techniques</strong> : hébergement (Render, MongoDB Atlas), stockage images (Cloudinary)</li>
            <li><strong>Autorités</strong> : si requis par la loi ou décision de justice</li>
          </ul>
          <p>Nous ne vendons jamais vos données personnelles à des tiers.</p>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Sécurité des données</h3>
        <div className="text-gray-600 leading-relaxed">
          <p>Nous mettons en œuvre des mesures de sécurité appropriées :</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Chiffrement des mots de passe (bcrypt)</li>
            <li>Connexions sécurisées (HTTPS)</li>
            <li>Authentification par token JWT</li>
            <li>Hébergement sur des serveurs sécurisés</li>
            <li>Accès restreint aux données personnelles</li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Conservation des données</h3>
        <p className="text-gray-600 leading-relaxed">
          Vos données sont conservées tant que votre compte est actif. Après suppression de votre compte, 
          certaines données peuvent être conservées pendant une durée limitée pour des raisons légales 
          ou de sécurité (jusqu'à 12 mois). Les annonces et messages associés à un compte supprimé 
          sont anonymisés ou supprimés.
        </p>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Vos droits</h3>
        <div className="text-gray-600 leading-relaxed">
          <p>Conformément à la réglementation applicable, vous disposez des droits suivants :</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Accès</strong> : obtenir une copie de vos données</li>
            <li><strong>Rectification</strong> : corriger vos données inexactes</li>
            <li><strong>Suppression</strong> : demander l'effacement de vos données</li>
            <li><strong>Portabilité</strong> : recevoir vos données dans un format standard</li>
            <li><strong>Opposition</strong> : vous opposer à certains traitements</li>
          </ul>
          <p className="mt-3">
            Pour exercer ces droits, contactez-nous à : Princefreto@gmail.com
          </p>
        </div>
      </section>
    </div>
  );
}

function CookiesContent() {
  return (
    <div className="prose prose-blue max-w-none">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Politique des Cookies
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
      </p>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Qu'est-ce qu'un cookie ?</h3>
        <p className="text-gray-600 leading-relaxed">
          Un cookie est un petit fichier texte stocké sur votre appareil (ordinateur, smartphone, tablette) 
          lorsque vous visitez un site web. Les cookies permettent au site de mémoriser vos préférences 
          et d'améliorer votre expérience de navigation.
        </p>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Cookies utilisés</h3>
        <div className="text-gray-600 leading-relaxed space-y-3">
          <p><strong>2.1 Cookies essentiels</strong></p>
          <p>Ces cookies sont nécessaires au fonctionnement du site :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Token d'authentification</strong> : permet de maintenir votre session connectée</li>
            <li><strong>Préférences utilisateur</strong> : mémorise vos choix (langue, thème)</li>
          </ul>

          <p className="mt-4"><strong>2.2 Cookies de performance</strong></p>
          <p>Ces cookies nous aident à comprendre comment vous utilisez le site :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Statistiques de visite anonymisées</li>
            <li>Analyse des erreurs pour améliorer le service</li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Stockage local (localStorage)</h3>
        <p className="text-gray-600 leading-relaxed">
          En plus des cookies, nous utilisons le localStorage de votre navigateur pour stocker 
          de manière sécurisée votre token d'authentification. Ces données restent sur votre 
          appareil et ne sont pas envoyées à des tiers.
        </p>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Gestion des cookies</h3>
        <div className="text-gray-600 leading-relaxed">
          <p>
            Vous pouvez contrôler et supprimer les cookies via les paramètres de votre navigateur :
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Chrome</strong> : Paramètres → Confidentialité → Cookies</li>
            <li><strong>Firefox</strong> : Options → Vie privée → Cookies</li>
            <li><strong>Safari</strong> : Préférences → Confidentialité</li>
            <li><strong>Edge</strong> : Paramètres → Cookies et autorisations</li>
          </ul>
          <p className="mt-3">
            ⚠️ La suppression des cookies essentiels peut affecter le fonctionnement du site 
            et vous déconnecter de votre compte.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Cookies tiers</h3>
        <p className="text-gray-600 leading-relaxed">
          Actuellement, Local Deals Togo n'utilise pas de cookies tiers à des fins publicitaires. 
          Si cela devait changer, nous mettrons à jour cette politique et vous en informerons.
        </p>
      </section>
    </div>
  );
}
