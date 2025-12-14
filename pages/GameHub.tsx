
import React from 'react';
import { Crosshair, Users, Shield, BarChart2, ArrowRight, Layout, Map, Contact } from 'lucide-react';

interface GameHubProps {
  onNavigate: (path: string) => void;
}

const GameHub: React.FC<GameHubProps> = ({ onNavigate }) => {
  const tools = [
    {
      title: 'Plataforma de Treinos',
      description: 'Gerencie treinos completos, crie tabelas de calls, defina rotações no mapa e gere relatórios automáticos de pontuação.',
      icon: <Crosshair size={32} />,
      path: '/criar-treinos',
      color: 'text-red-500',
      bg: 'bg-red-500/10'
    },
    {
      title: 'Mapeamento Tático',
      description: 'Ferramenta interativa de mapa. Adicione nomes, arraste posições e crie estratégias visuais completas.',
      icon: <Map size={32} />,
      path: '/mapeamento',
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    },
    {
      title: 'Montar Elenco',
      description: 'Gerencie sua line-up, staff e folha salarial. Crie cards de jogadores com funções, fotos e definições.',
      icon: <Contact size={32} />,
      path: '/montar-elenco',
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10'
    },
    {
      title: 'Estatísticas & Dados',
      description: 'Calculadora profissional de desempenho individual e coletivo (Abates, Pontos, KDA) com gráficos visuais.',
      icon: <BarChart2 size={32} />,
      path: '/estatisticas',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      title: 'Montar Composição',
      description: 'Simule e monte sua squad ideal escolhendo personagens ativos, passivos e pets para encontrar a sinergia perfeita.',
      icon: <Users size={32} />,
      path: '/composicao',
      color: 'text-brand-500',
      bg: 'bg-brand-500/10'
    },
    {
      title: 'Picks & Bans',
      description: 'Simulador de draft competitivo. Treine estratégias de seleção e bloqueio de personagens contra o time adversário.',
      icon: <Shield size={32} />,
      path: '/picks-bans',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-20">
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent uppercase">
          Ferramentas de Jogo
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg">
          Suite completa de ferramentas táticas e analíticas para elevar o nível da sua equipe competitiva.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool, idx) => (
          <div 
            key={idx}
            onClick={() => onNavigate(tool.path)}
            className="group cursor-pointer bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-2xl hover:border-brand-500 dark:hover:border-brand-500 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between min-h-[250px]"
          >
            {/* Background Decor */}
            <div className={`absolute top-0 right-0 p-32 opacity-5 rounded-bl-full transition-transform group-hover:scale-150 ${tool.bg.replace('/10', '/30')}`} />
            
            <div>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${tool.bg} ${tool.color} shadow-sm group-hover:scale-110 transition-transform`}>
                    {tool.icon}
                </div>
                
                <h3 className="text-2xl font-black mb-3 text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors uppercase">
                    {tool.title}
                </h3>
                
                <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed mb-6 font-medium">
                    {tool.description}
                </p>
            </div>

            <div className="flex items-center text-sm font-bold text-brand-500 uppercase tracking-wider group-hover:translate-x-2 transition-transform">
              Acessar Ferramenta <ArrowRight size={18} className="ml-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameHub;
