
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
    },
    {
      title: 'Mapeamento Tático',
      description: 'Ferramenta interativa de mapa. Adicione nomes, arraste posições e crie estratégias visuais completas.',
      icon: <Map size={32} />,
      path: '/mapeamento',
    },
    {
      title: 'Montar Elenco',
      description: 'Gerencie sua line-up, staff e folha salarial. Crie cards de jogadores com funções, fotos e definições.',
      icon: <Contact size={32} />,
      path: '/montar-elenco',
    },
    {
      title: 'Estatísticas & Dados',
      description: 'Calculadora profissional de desempenho individual e coletivo (Abates, Pontos, KDA) com gráficos visuais.',
      icon: <BarChart2 size={32} />,
      path: '/estatisticas',
    },
    {
      title: 'Encontrar Line',
      description: 'Crie um anúncio como jogador (Free Agent) ou cruze dados para sugerir e formar lines competitivas.',
      icon: <Users size={32} />,
      path: '/encontrar-line',
    },
    {
      title: 'Montar Composição',
      description: 'Simule e monte sua squad ideal escolhendo personagens ativos, passivos e pets para encontrar a sinergia perfeita.',
      icon: <Users size={32} />,
      path: '/composicao',
    },
    {
      title: 'Picks & Bans',
      description: 'Simulador de draft competitivo. Treine estratégias de seleção e bloqueio de personagens contra o time adversário.',
      icon: <Shield size={32} />,
      path: '/picks-bans',
    }
  ];

  return (
    <div className="section-spacing space-y-12 animate-fade-in">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-tighter">
          Ferramentas de <span className="text-loud-500">Jogo</span>
        </h1>
        <p className="text-premium-muted max-w-2xl mx-auto text-lg leading-relaxed">
          Suite completa de ferramentas táticas e analíticas para elevar o nível da sua equipe competitiva.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tools.map((tool, idx) => (
          <div 
            key={idx}
            onClick={() => onNavigate(tool.path)}
            className="group cursor-pointer bg-graphite-800 rounded-[40px] border border-white/5 p-10 hover:border-loud-500/50 transition-all duration-300 hover:-translate-y-2 relative overflow-hidden flex flex-col justify-between min-h-[320px] shadow-2xl"
          >
            <div>
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8 bg-loud-500/10 text-loud-500 shadow-sm group-hover:scale-110 transition-transform">
                    {tool.icon}
                </div>
                
                <h3 className="text-2xl font-display font-bold mb-4 group-hover:text-loud-500 transition-colors uppercase tracking-tight">
                    {tool.title}
                </h3>
                
                <p className="text-premium-muted text-base leading-relaxed mb-8">
                    {tool.description}
                </p>
            </div>

            <div className="flex items-center text-xs font-bold text-loud-500 uppercase tracking-widest group-hover:translate-x-2 transition-transform">
              Acessar Ferramenta <ArrowRight size={18} className="ml-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameHub;
