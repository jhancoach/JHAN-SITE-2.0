
import React, { useState } from 'react';
import { Menu, X, Sun, Moon, Youtube, Instagram, Twitter, MessageCircle, Globe } from 'lucide-react';
import { NAV_ITEMS_KEYS, SOCIAL_LINKS, APP_LOGO } from '../constants';
import { translations, Language } from '../translations';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (path: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate, language, setLanguage }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const t = translations[language];

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'Youtube': return <Youtube size={20} />;
      case 'Instagram': return <Instagram size={20} />;
      case 'X': return (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
      case 'Twitter': return <Twitter size={20} />;
      case 'Discord': return (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
             <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 13.46 13.46 0 0 0-.59 1.22 18.288 18.288 0 0 0-5.526 0 13.46 13.46 0 0 0-.59-1.22.074.074 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/>
        </svg>
      );
      default: return null;
    }
  };

  const LangSelector = () => (
    <div className="relative group">
      <button className="flex items-center gap-1 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300">
        <Globe size={18} />
        <span className="uppercase text-xs font-bold">{language}</span>
      </button>
      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hidden group-hover:block w-32 overflow-hidden z-[60]">
        {Object.keys(translations).map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang as Language)}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-500 hover:text-white transition-colors flex items-center gap-2 ${language === lang ? 'bg-gray-100 dark:bg-gray-700 font-bold' : ''}`}
          >
            {lang === 'pt' && '🇧🇷 PT'}
            {lang === 'en' && '🇺🇸 EN'}
            {lang === 'es' && '🇪🇸 ES'}
            {lang === 'th' && '🇹🇭 TH'}
            {lang === 'id' && '🇮🇩 ID'}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div 
              className="flex items-center gap-3 cursor-pointer" 
              onClick={() => onNavigate('/')}
            >
              <img 
                src={APP_LOGO} 
                alt="Jhan Medeiros Logo" 
                className="h-10 w-10 rounded-full object-cover border-2 border-brand-500" 
              />
              <span className="font-bold text-xl tracking-tight hidden sm:block">
                JHAN<span className="text-brand-500">MEDEIROS</span>
              </span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden xl:flex items-center gap-6">
              {NAV_ITEMS_KEYS.map((item) => (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`text-sm font-medium transition-colors hover:text-brand-500 ${
                    currentPage === item.path ? 'text-brand-500' : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {t.nav[item.key as keyof typeof t.nav]}
                </button>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 border-r border-gray-300 dark:border-gray-600 pr-4">
                {SOCIAL_LINKS.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`transition-colors ${link.color} text-gray-500 dark:text-gray-400`}
                    title={link.name}
                  >
                    {getIcon(link.icon)}
                  </a>
                ))}
              </div>
              
              <LangSelector />

              <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <button 
                className="xl:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="xl:hidden absolute top-full left-0 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 shadow-lg animate-fade-in-down">
            <nav className="flex flex-col gap-4">
              {NAV_ITEMS_KEYS.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    onNavigate(item.path);
                    setIsMenuOpen(false);
                  }}
                  className={`text-left text-base font-medium py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    currentPage === item.path ? 'text-brand-500 bg-gray-50 dark:bg-gray-800' : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {t.nav[item.key as keyof typeof t.nav]}
                </button>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-10 mt-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={APP_LOGO} alt="Logo" className="h-8 w-8 rounded-full" />
                <span className="font-bold text-lg">JHAN<span className="text-brand-500">MEDEIROS</span></span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Data Analyst.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-brand-500">{t.footer.contact}</h3>
              <div className="flex gap-4">
                {SOCIAL_LINKS.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:scale-110 transition-transform"
                  >
                    {getIcon(link.icon)}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-brand-500">{t.footer.rights}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                &copy; {new Date().getFullYear()} Jhan Medeiros. {t.footer.rights}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
