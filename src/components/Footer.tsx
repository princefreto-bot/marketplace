import { FacebookIcon, WhatsAppIcon, InstagramIcon, TwitterIcon, MailIcon, LocationIcon } from './Icons';
import { useAdmin } from '../store/useStore';

interface FooterProps {
  onNavigate?: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const { getSocialLinks } = useAdmin();
  const socialLinks = getSocialLinks();

  const getSocialIcon = (icon: string) => {
    switch (icon) {
      case 'facebook':
        return <FacebookIcon className="w-5 h-5" />;
      case 'whatsapp':
        return <WhatsAppIcon className="w-5 h-5" />;
      case 'instagram':
        return <InstagramIcon className="w-5 h-5" />;
      case 'twitter':
        return <TwitterIcon className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">LD</span>
              </div>
              <span className="text-xl font-bold">
                Local Deals <span className="text-blue-400">Togo</span>
              </span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              La première plateforme de petites annonces 100% togolaise. 
              Achetez et vendez facilement près de chez vous.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link._id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all"
                >
                  {getSocialIcon(link.icon)}
                </a>
              ))}
            </div>
          </div>

          {/* Liens Utiles */}
          <div>
            <h3 className="font-semibold mb-4">Liens Utiles</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <button onClick={() => onNavigate?.('home')} className="hover:text-white transition-colors">
                  Accueil
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate?.('demandes')} className="hover:text-white transition-colors">
                  Toutes les demandes
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate?.('publish')} className="hover:text-white transition-colors">
                  Publier une annonce
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate?.('legal')} className="hover:text-white transition-colors">
                  Conditions d'utilisation
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate?.('legal')} className="hover:text-white transition-colors">
                  Politique de confidentialité
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-center gap-2">
                <WhatsAppIcon className="w-5 h-5 text-green-500" />
                <a href="https://wa.me/22879907262" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  +228 79 90 72 62
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MailIcon className="w-5 h-5 text-blue-400" />
                <a href="mailto:Princefreto@gmail.com" className="hover:text-white transition-colors">
                  Princefreto@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <LocationIcon className="w-5 h-5 text-red-400" />
                <span>Lomé, Togo</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Local Deals Togo. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
