
import React from 'react';
import { ArrowRight, BarChart2, Map, Users, Shield } from 'lucide-react';
import { APP_LOGO, BIBLE_VERSE, BIBLE_REF } from '../constants';

interface HomeProps {
  onNavigate: (path: string) => void;
}

const ServiceCard: React.FC<{ icon: React.ReactNode, title: string, description: string, onClick: () => void }> = ({ icon, title, description, onClick }) => (
  <div 
    onClick={onClick}
    className="card-premium group cursor-pointer"
  >
    <div className="mb-6 text-gold-500 group-hover:scale-110 transition-transform w-fit p-4 bg-graphite-900/50 rounded-2xl border border-white/5">
      {icon}
    </div>
    <h3 className="text-2xl font-display font-bold mb-3">{title}</h3>
    <p className="text-graphite-600 text-sm leading-relaxed">{description}</p>
    <div className="mt-6 flex items-center gap-2 text-gold-500 font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
      Explorar <ArrowRight size={14} />
    </div>
  </div>
);

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 px-6">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-gold-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[400px] h-[400px] bg-graphite-600/20 blur-[100px] rounded-full"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-graphite-800 border border-white/10 text-gold-500 text-xs font-bold tracking-widest uppercase mb-8 animate-fade-in-down">
              <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse"></span>
              Analytics & Estratégia
            </div>

            <h1 className="text-5xl md:text-8xl font-display font-bold tracking-tighter mb-8 leading-[0.9]">
              DOMINE O <span className="text-gold-500">CAMPO DE BATALHA</span> COM DADOS
            </h1>
            
            <p className="text-xl text-premium-muted mb-12 max-w-2xl leading-relaxed">
              Transformamos estatísticas em vitórias. A plataforma definitiva para análise tática, gestão de equipe e estratégias avançadas de Free Fire.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => onNavigate('/quadro-tatico')} className="btn-gold">
                Começar Agora
              </button>
              <button onClick={() => onNavigate('/mapas')} className="px-8 py-3 rounded-full border border-white/20 font-bold hover:bg-white/5 transition-colors">
                Ver Mapas
              </button>
            </div>

            {/* Bible Verse as a subtle elegant touch */}
            <div className="mt-24 p-8 rounded-3xl bg-graphite-800/50 border border-white/5 backdrop-blur-sm max-w-3xl">
              <blockquote className="text-lg md:text-xl font-display italic text-premium-muted mb-4 leading-relaxed">
                "{BIBLE_VERSE}"
              </blockquote>
              <p className="text-gold-500 font-bold tracking-widest uppercase text-xs">— {BIBLE_REF}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-graphite-800 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
                FERRAMENTAS <span className="text-gold-500">PROFISSIONAIS</span>
              </h2>
              <p className="text-premium-muted text-lg">
                Desenvolvemos um ecossistema completo para coaches e analistas que buscam o topo da tabela.
              </p>
            </div>
            <div className="hidden md:block w-32 h-px bg-white/10 mb-6"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
              icon={<Shield size={32} />}
              title="Picks & Bans"
              description="Simulador completo de draft para treinar suas estratégias de seleção."
              onClick={() => onNavigate('/picks-bans')}
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
            <div className="absolute -inset-4 bg-gold-500/20 blur-3xl rounded-full"></div>
            <img 
              src={APP_LOGO} 
              alt="Tech Visual" 
              className="relative w-full max-w-md mx-auto rounded-[40px] shadow-2xl border border-white/10"
            />
          </div>
          <div className="space-y-8">
            <h2 className="text-4xl md:text-6xl font-display font-bold leading-tight">
              TECNOLOGIA A SERVIÇO DA <span className="text-gold-500">VITÓRIA</span>
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
                  <div className="w-5 h-5 rounded-full bg-gold-500/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-gold-500"></div>
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
