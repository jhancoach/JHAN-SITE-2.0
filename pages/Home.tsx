import React from 'react';
import { ArrowRight, BarChart2, Map, Users, Shield, Sparkles, BellRing, ScanLine, LayoutGrid, Trophy, CheckCircle2, ChevronRight, BookOpen } from 'lucide-react';
import { APP_LOGO, BIBLE_VERSE, BIBLE_REF, SITE_UPDATES_DATA } from '../constants';

interface HomeProps {
  onNavigate: (path: string) => void;
}

const ServiceCard: React.FC<{ icon: React.ReactNode, title: string, description: string, onClick: () => void }> = ({ icon, title, description, onClick }) => (
  <div 
    onClick={onClick}
    className="card-premium group cursor-pointer"
  >
    <div className="mb-6 text-loud-500 group-hover:scale-110 transition-transform w-fit p-4 bg-graphite-900/50 rounded-2xl border border-white/5">
      {icon}
    </div>
    <h3 className="text-2xl font-display font-bold mb-3">{title}</h3>
    <p className="text-graphite-600 text-sm leading-relaxed">{description}</p>
    <div className="mt-6 flex items-center gap-2 text-loud-500 font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
      Explorar <ArrowRight size={14} />
    </div>
  </div>
);

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const latestUpdates = SITE_UPDATES_DATA.slice(0, 3);

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-24 sm:pb-32 px-6">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-loud-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[400px] h-[400px] bg-graphite-600/20 blur-[100px] rounded-full"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col items-center text-center">
            
            {/* Top Announcement Pill */}
            <button
              type="button"
              onClick={() => onNavigate('/novidades')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-graphite-800 hover:bg-graphite-700 border border-loud-500/40 text-loud-400 text-xs font-bold tracking-wide uppercase mb-8 animate-fade-in-down shadow-lg shadow-loud-500/10 transition-all hover:scale-105 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-loud-500 animate-pulse"></span>
              <span>NOVIDADE: Caderno Tático do Coach com Nuvem Google</span>
              <ChevronRight size={14} className="text-loud-400" />
            </button>

            <h1 className="text-5xl md:text-8xl font-display font-bold tracking-tighter mb-8 leading-[0.9]">
              DOMINE O <span className="text-loud-500">CAMPO DE BATALHA</span> COM DADOS
            </h1>
            
            <p className="text-xl text-premium-muted mb-12 max-w-2xl leading-relaxed">
              Transformamos estatísticas em vitórias. A plataforma definitiva para análise tática, gestão de equipe e estratégias avançadas de Free Fire.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => onNavigate('/caderno-coach')} className="btn-loud flex items-center justify-center gap-2 cursor-pointer">
                <BookOpen size={18} />
                <span>Caderno do Coach</span>
              </button>
              <button onClick={() => onNavigate('/quadro-tatico')} className="px-8 py-3 rounded-full border border-loud-500/50 text-loud-400 font-bold hover:bg-loud-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer">
                <span>Quadro Tático</span>
              </button>
              <button onClick={() => onNavigate('/novidades')} className="px-8 py-3 rounded-full border border-white/20 font-bold hover:bg-white/5 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                <Sparkles size={16} />
                <span>Ver Novidades</span>
              </button>
            </div>

            {/* Bible Verse as a subtle elegant touch */}
            <div className="mt-20 p-8 rounded-3xl bg-graphite-800/50 border border-white/5 backdrop-blur-sm max-w-3xl">
              <blockquote className="text-lg md:text-xl font-display italic text-premium-muted mb-4 leading-relaxed">
                "{BIBLE_VERSE}"
              </blockquote>
              <p className="text-loud-500 font-bold tracking-widest uppercase text-xs">— {BIBLE_REF}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Updates Highlight Section */}
      <section className="bg-graphite-900/90 border-y border-white/10 py-16 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-loud-400 text-xs font-black uppercase tracking-widest">
                <BellRing size={14} className="animate-pulse" />
                <span>Recém Chegados</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-white">
                Últimas <span className="text-loud-500">Novidades</span> do Site
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/novidades')}
              className="text-xs font-bold text-loud-400 hover:text-loud-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Ver todas as atualizações e changelog completo</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestUpdates.map((update, idx) => (
              <div
                key={update.id || idx}
                className="bg-graphite-800/80 hover:bg-graphite-800 border border-white/10 hover:border-loud-500/40 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between group shadow-xl"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded bg-loud-500/20 text-loud-400 border border-loud-500/30 uppercase tracking-wider">
                      {update.tag}
                    </span>
                    <span className="text-xs font-mono text-gray-400 font-bold">
                      {update.version}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-loud-400 transition-colors">
                    {update.title}
                  </h3>
                  <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">
                    {update.description}
                  </p>
                </div>

                <div className="pt-6 border-t border-white/5 mt-4">
                  <button
                    type="button"
                    onClick={() => update.linkPath ? onNavigate(update.linkPath) : onNavigate('/novidades')}
                    className="w-full bg-white/5 group-hover:bg-loud-500 text-gray-300 group-hover:text-black font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>{update.linkText || 'Acessar'}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-graphite-800 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
                FERRAMENTAS <span className="text-loud-500">PROFISSIONAIS</span>
              </h2>
              <p className="text-premium-muted text-lg">
                Desenvolvemos um ecossistema completo para coaches e analistas que buscam o topo da tabela.
              </p>
            </div>
            <div className="hidden md:block w-32 h-px bg-white/10 mb-6"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <ServiceCard 
              icon={<BookOpen size={32} />}
              title="Caderno do Coach"
              description="Anotações táticas e chamadas por mapa e safe sincronizadas na nuvem."
              onClick={() => onNavigate('/caderno-coach')}
            />
            <ServiceCard 
              icon={<Map size={32} />}
              title="Análise de Mapas"
              description="Estudo detalhado de rotações, safes e loot em todos os mapas competitivos."
              onClick={() => onNavigate('/mapas')}
            />
            <ServiceCard 
              icon={<Users size={32} />}
              title="Composições"
              description="Crie e visualize a sinergia perfeita entre personagens para sua equipe."
              onClick={() => onNavigate('/composicao')}
            />
             <ServiceCard 
              icon={<BarChart2 size={32} />}
              title="Dados & Stats"
              description="Visões aéreas e estatísticas de safes para tomada de decisão precisa."
              onClick={() => onNavigate('/safes')}
            />
          </div>
        </div>
      </section>

      {/* Tech/Modern Section */}
      <section className="py-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-loud-500/20 blur-3xl rounded-full"></div>
            <img 
              src={APP_LOGO} 
              alt="Tech Visual" 
              className="relative w-full max-w-md mx-auto rounded-[40px] shadow-2xl border border-white/10"
            />
          </div>
          <div className="space-y-8">
            <h2 className="text-4xl md:text-6xl font-display font-bold leading-tight">
              TECNOLOGIA A SERVIÇO DA <span className="text-loud-500">VITÓRIA</span>
            </h2>
            <p className="text-premium-muted text-lg leading-relaxed">
              Nossa plataforma utiliza as melhores práticas de design e desenvolvimento para entregar uma experiência fluida, rápida e intuitiva. Cada pixel foi pensado para facilitar a vida do analista.
            </p>
            <ul className="space-y-4">
              {[
                "Interface Ultra-Responsiva",
                "Exportação em Alta Definição",
                "Ferramentas de Desenho Profissionais",
                "Sincronização em Tempo Real"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-premium-text font-medium">
                  <div className="w-5 h-5 rounded-full bg-loud-500/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-loud-500"></div>
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
