
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
      case 'X': return <Twitter size={20} />;
      case 'Discord': return <MessageCircle size={20} />;
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
