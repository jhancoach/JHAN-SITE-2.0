
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
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      title: 'Pets',
      description: 'Lista de companheiros e suas habilidades com imagens em alta qualidade.',
      icon: <PawPrint size={32} />,
      path: '/pets',
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    },
    {
      title: 'Carregamentos 3.0',
      description: 'Lista de itens de loadout como Mochila de Perna, Loja Tática e mais.',
      icon: <Briefcase size={32} />,
      path: '/carregamentos',
      color: 'text-pink-500',
      bg: 'bg-pink-500/10'
    },
    {
      title: 'Mapas',
      description: 'Mapas oficiais do competitivo em alta resolução.',
      icon: <Map size={32} />,
      path: '/mapas',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      title: 'Pingos dos Mapas',
      description: 'Versões específicas dos mapas para marcação de pingos e calls.',
      icon: <MapPin size={32} />,
      path: '/pingos-mapas',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    {
      title: 'Visões Aéreas',
      description: 'Acesso a pastas do Google Drive com imagens aéreas para táticas.',
      icon: <Eye size={32} />,
      path: '/visoes-aereas',
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/10'
    },
    {
      title: 'Safes',
      description: 'Estudo de zonas seguras e análise de rotação por mapa.',
      icon: <BarChart2 size={32} />,
      path: '/safes',
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
          Central de Downloads
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          Acesse todos os recursos visuais, planilhas e imagens utilizados para análise de dados e criação de estratégias.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat, idx) => (
          <div 
            key={idx}
            onClick={() => onNavigate(cat.path)}
            className="group cursor-pointer bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-2xl hover:border-brand-500 dark:hover:border-brand-500 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
          >
            {/* Background Decor */}
            <div className={`absolute top-0 right-0 p-20 opacity-5 rounded-bl-full transition-transform group-hover:scale-150 ${cat.bg.replace('/10', '/30')}`} />

            <div className="relative z-10 flex flex-col h-full">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${cat.bg} ${cat.color}`}>
                {cat.icon}
              </div>
              
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors">
                {cat.title}
              </h3>
              
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6 flex-1">
                {cat.description}
              </p>

              <div className="flex items-center text-sm font-semibold text-brand-500 group-hover:translate-x-2 transition-transform">
                Acessar <ArrowRight size={16} className="ml-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Downloads;
