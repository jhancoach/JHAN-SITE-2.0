
import React from 'react';
import { ArrowRight, BarChart2, Map, Users, Shield } from 'lucide-react';
import { APP_LOGO, BIBLE_VERSE, BIBLE_REF } from '../constants';

interface HomeProps {
  onNavigate: (path: string) => void;
}

const ServiceCard: React.FC<{ icon: React.ReactNode, title: string, description: string, onClick: () => void }> = ({ icon, title, description, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer border border-gray-100 dark:border-gray-700 hover:-translate-y-1 group"
  >
    <div className="mb-4 text-brand-500 group-hover:scale-110 transition-transform w-fit p-3 bg-brand-50 dark:bg-brand-900/30 rounded-xl">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{description}</p>
  </div>
);

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-16 animate-fade-in">
      {/* Hero Section */}
      <section className="text-center py-10 md:py-20 flex flex-col items-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-brand-500 blur-2xl opacity-20 rounded-full"></div>
          <img 
            src={APP_LOGO} 
            alt="Logo Grande" 
            className="relative w-32 h-32 md:w-48 md:h-48 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-2xl"
          />
        </div>
        
        <blockquote className="max-w-3xl mx-auto text-lg md:text-2xl font-serif italic text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
          {BIBLE_VERSE}
        </blockquote>
        <p className="text-brand-500 font-semibold mb-10">— {BIBLE_REF}</p>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
          Bem Vindo ao Site do Jhan
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-2xl">
          Análise de dados, estratégias de mapa e gerenciamento de equipe para o cenário competitivo de Free Fire.
        </p>
      </section>

      {/* Services Section */}
      <section className="py-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Nossos Serviços</h2>
          <div className="w-20 h-1 bg-brand-500 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      </section>
    </div>
  );
};

export default Home;
