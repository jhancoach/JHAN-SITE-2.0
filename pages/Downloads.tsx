
import React from 'react';
import { Map, PawPrint, Users, Eye, BarChart2, ArrowRight, Download, Briefcase, MapPin } from 'lucide-react';

interface DownloadsProps {
  onNavigate: (path: string) => void;
}

const Downloads: React.FC<DownloadsProps> = ({ onNavigate }) => {
  const categories = [
    {
      title: 'Personagens',
      description: 'Galeria completa de personagens ativos e passivos para download e estudo.',
      icon: <Users size={32} />,
      path: '/personagens',
    },
    {
      title: 'Pets',
      description: 'Lista de companheiros e suas habilidades com imagens em alta qualidade.',
      icon: <PawPrint size={32} />,
      path: '/pets',
    },
    {
      title: 'Carregamentos 3.0',
      description: 'Lista de itens de loadout como Mochila de Perna, Loja Tática e mais.',
      icon: <Briefcase size={32} />,
      path: '/carregamentos',
    },
    {
      title: 'Mapas',
      description: 'Mapas oficiais do competitivo em alta resolução.',
      icon: <Map size={32} />,
      path: '/mapas',
    },
    {
      title: 'Pingos dos Mapas',
      description: 'Versões específicas dos mapas para marcação de pingos e calls.',
      icon: <MapPin size={32} />,
      path: '/pingos-mapas',
    },
    {
      title: 'Visões Aéreas',
      description: 'Acesso a pastas do Google Drive com imagens aéreas para táticas.',
      icon: <Eye size={32} />,
      path: '/visoes-aereas',
    },
    {
      title: 'Safes',
      description: 'Estudo de zonas seguras e análise de rotação por mapa.',
      icon: <BarChart2 size={32} />,
      path: '/safes',
    }
  ];

  return (
    <div className="section-spacing space-y-12 animate-fade-in">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-display font-bold">
          Central de <span className="text-gold-500">Downloads</span>
        </h1>
        <p className="text-premium-muted max-w-2xl mx-auto text-lg">
          Acesse todos os recursos visuais, planilhas e imagens utilizados para análise de dados e criação de estratégias.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map((cat, idx) => (
          <div 
            key={idx}
            onClick={() => onNavigate(cat.path)}
            className="group cursor-pointer bg-graphite-800 rounded-[32px] border border-white/5 p-8 hover:border-gold-500/50 transition-all duration-300 hover:-translate-y-2 relative overflow-hidden shadow-2xl"
          >
            <div className="relative z-10 flex flex-col h-full">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-gold-500/10 text-gold-500 group-hover:scale-110 transition-transform">
                {cat.icon}
              </div>
              
              <h3 className="text-2xl font-display font-bold mb-3 group-hover:text-gold-500 transition-colors">
                {cat.title}
              </h3>
              
              <p className="text-premium-muted text-sm leading-relaxed mb-8 flex-1">
                {cat.description}
              </p>

              <div className="flex items-center text-xs font-bold text-gold-500 uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                Acessar <ArrowRight size={16} className="ml-2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Downloads;
