
import React, { useState } from 'react';
import { Menu, X, Sun, Moon, Youtube, Instagram, Twitter, Globe, ChevronLeft, LogIn, LogOut, Shield, Layers } from 'lucide-react';
import { NAV_ITEMS_KEYS, SOCIAL_LINKS, APP_LOGO } from '../constants';
import { translations, Language } from '../translations';
import { useAuth } from './FirebaseProvider';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (path: string) => void;
  onBack?: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate, onBack, language, setLanguage }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const t = translations[language];
  const { user, isAdmin, login, logout } = useAuth();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    const gameTools = [
      '/criar-treinos',
      '/mapeamento',
      '/montar-elenco',
      '/estatisticas',
      '/composicao',
      '/picks-bans',
      '/quadro-tatico',
      '/criar-chaveamento'
    ];

    const downloadPages = [
      '/mapas',
      '/pingos-mapas',
      '/visoes-aereas',
      '/pets',
      '/personagens',
      '/carregamentos',
      '/recursos',
      '/logos-times',
      '/safes',
      '/sala-de-aula',
      '/admin-recursos',
      '/admin-logos-times',
      '/admin-sala-de-aula'
    ];

    if (downloadPages.includes(currentPage)) {
      onNavigate('/downloads');
    } else if (gameTools.includes(currentPage)) {
      onNavigate('/jogo');
    } else {
      onNavigate('/');
    }
  };

  // Pages that should take up the full screen (no container padding, no footer)
  const isFullScreenApp = ['/mapeamento', '/quadro-tatico'].includes(currentPage);

  const currentIndex = NAV_ITEMS_KEYS.findIndex(item => item.path === currentPage);
  const prevPage = currentIndex > 0 ? NAV_ITEMS_KEYS[currentIndex - 1] : null;
  const nextPage = currentIndex < NAV_ITEMS_KEYS.length - 1 ? NAV_ITEMS_KEYS[currentIndex + 1] : null;

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
      <button className="flex items-center gap-1 p-2 rounded-md hover:bg-graphite-800 text-premium-muted">
        <Globe size={18} />
        <span className="uppercase text-xs font-bold">{language}</span>
      </button>
      <div className="absolute right-0 top-full mt-1 bg-graphite-800 border border-white/10 rounded-lg shadow-lg hidden group-hover:block w-32 overflow-hidden z-[60]">
        {Object.keys(translations).map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang as Language)}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-loud-500 hover:text-graphite-900 transition-colors flex items-center gap-2 ${language === lang ? 'bg-graphite-600 font-bold' : ''}`}
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
    <div className="min-h-screen flex flex-col bg-graphite-900 text-premium-text font-sans antialiased selection:bg-loud-500 selection:text-graphite-900">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-graphite-900/90 border-b border-white/10 shadow-lg">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-3">
          <div className="flex justify-between items-center gap-2 lg:gap-4">
            {/* Logo & Back Button */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {currentPage !== '/' && (
                <button 
                  onClick={handleBack}
                  className="flex items-center gap-1.5 p-1.5 sm:p-2 px-2.5 sm:px-3.5 rounded-full bg-graphite-800 text-loud-500 hover:bg-loud-500 hover:text-graphite-900 transition-all border border-white/10 group shadow-lg shrink-0 cursor-pointer"
                  title="Voltar"
                >
                  <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-wider hidden sm:block">Voltar</span>
                </button>
              )}
              <div 
                className="flex items-center gap-2.5 cursor-pointer group shrink-0" 
                onClick={() => onNavigate('/')}
              >
                <img 
                  src={APP_LOGO} 
                  alt="Jhan Medeiros Logo" 
                  className="h-10 w-10 sm:h-11 sm:w-11 rounded-full object-cover border-2 border-loud-500 transition-transform duration-300 group-hover:scale-105" 
                />
                <span className="font-display font-bold text-lg sm:text-xl tracking-tight hidden md:block whitespace-nowrap">
                  JHAN<span className="text-loud-500">MEDEIROS</span>
                </span>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden 2xl:flex items-center gap-5 xl:gap-6 shrink-1 min-w-0 justify-center">
              {NAV_ITEMS_KEYS.map((item) => (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`text-xs xl:text-sm font-semibold transition-all duration-200 hover:text-loud-500 relative py-1 whitespace-nowrap cursor-pointer ${
                    currentPage === item.path ? 'text-loud-500' : 'text-premium-muted'
                  }`}
                >
                  {t.nav[item.key as keyof typeof t.nav]}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-loud-500 transition-all duration-300 ${currentPage === item.path ? 'w-full' : 'w-0'}`}></span>
                </button>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="hidden lg:flex items-center gap-2.5 border-r border-white/10 pr-3">
                {SOCIAL_LINKS.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-premium-muted hover:text-loud-500 transition-all hover:scale-110"
                    title={link.name}
                  >
                    {getIcon(link.icon)}
                  </a>
                ))}
              </div>
              
              <LangSelector />

              {user ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button 
                    onClick={() => logout()}
                    className="p-1.5 rounded-md hover:bg-red-500/10 text-premium-muted hover:text-red-500 transition-colors cursor-pointer"
                    title="Sair"
                  >
                    <LogOut size={16} />
                  </button>
                  {isAdmin && (
                    <div className="flex items-center gap-0.5 bg-graphite-800 rounded-lg p-1 border border-white/5">
                      <button 
                        onClick={() => onNavigate('/admin-recursos')}
                        className={`p-1 rounded-md hover:bg-loud-500/20 transition-colors ${currentPage === '/admin-recursos' ? 'text-loud-500 bg-loud-500/20' : 'text-premium-muted hover:text-loud-500'}`}
                        title="Admin Recursos"
                      >
                        <Layers size={15} />
                      </button>
                      <button 
                        onClick={() => onNavigate('/admin-logos-times')}
                        className={`p-1 rounded-md hover:bg-loud-500/20 transition-colors ${currentPage === '/admin-logos-times' ? 'text-loud-500 bg-loud-500/20' : 'text-premium-muted hover:text-loud-500'}`}
                        title="Admin Logos de Times"
                      >
                        <Shield size={15} />
                      </button>
                      <button 
                        onClick={() => onNavigate('/admin-sala-de-aula')}
                        className={`p-1 rounded-md hover:bg-loud-500/20 transition-colors ${currentPage === '/admin-sala-de-aula' ? 'text-loud-500 bg-loud-500/20' : 'text-premium-muted hover:text-loud-500'}`}
                        title="Admin Sala de Aula"
                      >
                        <Youtube size={15} />
                      </button>
                    </div>
                  )}
                  <img src={user.photoURL || ''} alt={user.displayName || 'User'} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/10 object-cover" />
                </div>
              ) : (
                <button 
                  onClick={() => login()}
                  className="flex items-center gap-1.5 p-1.5 px-2.5 sm:px-3 rounded-xl bg-graphite-800 text-premium-muted hover:text-loud-500 hover:bg-graphite-700 transition-all border border-white/5 cursor-pointer"
                >
                  <LogIn size={16} />
                  <span className="text-[11px] font-bold uppercase hidden sm:block">Entrar</span>
                </button>
              )}

              <button 
                className="2xl:hidden p-2 rounded-lg hover:bg-graphite-800 text-gray-300 hover:text-white transition-colors cursor-pointer"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Abrir Menu"
              >
                {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile / Responsive Drawer Menu */}
        {isMenuOpen && (
          <div className="2xl:hidden absolute top-full left-0 w-full bg-graphite-900 border-b border-white/10 p-5 shadow-2xl animate-fade-in-down max-h-[85vh] overflow-y-auto">
            <nav className="flex flex-col gap-2">
              {NAV_ITEMS_KEYS.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    onNavigate(item.path);
                    setIsMenuOpen(false);
                  }}
                  className={`text-left text-base font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-between ${
                    currentPage === item.path 
                      ? 'text-loud-500 bg-graphite-800 border-l-4 border-loud-500' 
                      : 'text-premium-muted hover:bg-graphite-800/60 hover:text-white'
                  }`}
                >
                  <span>{t.nav[item.key as keyof typeof t.nav]}</span>
                  {currentPage === item.path && <ChevronLeft size={16} className="rotate-180 text-loud-500" />}
                </button>
              ))}

              <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-center gap-6">
                {SOCIAL_LINKS.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-premium-muted hover:text-loud-500 transition-colors p-2"
                    title={link.name}
                  >
                    {getIcon(link.icon)}
                  </a>
                ))}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className={`flex-grow ${isFullScreenApp ? 'h-full flex flex-col' : 'w-full'}`}>
        <div className={isFullScreenApp ? 'h-full flex flex-col' : 'container mx-auto px-4 py-8 md:py-12'}>
          {children}

          {/* Page to Page Navigation */}
          {!isFullScreenApp && currentPage !== '/' && (
            <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-6">
              {prevPage ? (
                <button 
                  onClick={() => onNavigate(prevPage.path)}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-graphite-800 border border-white/5 hover:border-loud-500/50 transition-all group w-full sm:w-auto"
                >
                  <div className="p-3 bg-graphite-900 rounded-xl text-loud-500 group-hover:scale-110 transition-transform">
                    <ChevronLeft size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-premium-muted uppercase tracking-widest">Anterior</p>
                    <p className="font-display font-bold text-lg text-white group-hover:text-loud-500 transition-colors uppercase">
                      {t.nav[prevPage.key as keyof typeof t.nav]}
                    </p>
                  </div>
                </button>
              ) : <div className="hidden sm:block" />}

              {nextPage ? (
                <button 
                  onClick={() => onNavigate(nextPage.path)}
                  className="flex items-center justify-end gap-4 p-4 rounded-2xl bg-graphite-800 border border-white/5 hover:border-loud-500/50 transition-all group w-full sm:w-auto text-right"
                >
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-premium-muted uppercase tracking-widest">Próximo</p>
                    <p className="font-display font-bold text-lg text-white group-hover:text-loud-500 transition-colors uppercase">
                      {t.nav[nextPage.key as keyof typeof t.nav]}
                    </p>
                  </div>
                  <div className="p-3 bg-graphite-900 rounded-xl text-loud-500 group-hover:scale-110 transition-transform">
                    <ChevronLeft size={24} className="rotate-180" />
                  </div>
                </button>
              ) : <div className="hidden sm:block" />}
            </div>
          )}
        </div>
      </main>

      {/* Footer - Hidden on FullScreen Apps */}
      {!isFullScreenApp && (
        <footer className="bg-graphite-800 border-t border-white/10 py-16 mt-20">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <img src={APP_LOGO} alt="Logo" className="h-10 w-10 rounded-full border border-loud-500" />
                  <span className="font-display font-bold text-xl">JHAN<span className="text-loud-500">MEDEIROS</span></span>
                </div>
                <p className="text-premium-muted max-w-xs">
                  Análise de dados, estratégias de mapa e gerenciamento de equipe para o cenário competitivo de Free Fire.
                </p>
              </div>
              
              <div>
                <h3 className="font-display font-bold text-lg mb-6 text-loud-500">{t.footer.contact}</h3>
                <div className="flex gap-4">
                  {SOCIAL_LINKS.map((link) => (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-graphite-900 border border-white/10 rounded-full hover:bg-loud-500 hover:text-graphite-900 transition-all duration-300 hover:scale-110"
                    >
                      {getIcon(link.icon)}
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-display font-bold text-lg mb-6 text-loud-500">{t.footer.rights}</h3>
                <p className="text-premium-muted">
                  &copy; {new Date().getFullYear()} Jhan Medeiros. {t.footer.rights}
                </p>
                <p className="text-xs text-premium-muted/50 mt-2">
                  Desenvolvido com foco em alta performance e tecnologia.
                </p>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;
