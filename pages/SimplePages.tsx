
import React, { useState, useEffect } from 'react';
import { MAPS_DATA, AERIAL_LINKS, SHEETS, EXTRA_CHARACTERS } from '../constants';
import { parseCSV, findValue } from '../utils';
import { Download, ExternalLink, User, Eye, Search, X, Heart, Target, Star, ArrowRight } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Resource } from '../types';

export const FirestoreGridGalleryPage: React.FC<{ 
    title: string, 
    collectionName: string,
    staticItems?: { name: string; imageUrl: string; category?: string }[] 
}> = ({ title, collectionName, staticItems = [] }) => {
    const [dynamicItems, setDynamicItems] = useState<Resource[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('Todos');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
            setDynamicItems(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [collectionName]);

    const allItems = [...staticItems, ...dynamicItems];
    
    const categories = ['Todos', ...Array.from(new Set(allItems.map(item => item.category).filter(Boolean)))];

    const displayItems = allItems.filter(item => {
        const matchesFilter = activeFilter === 'Todos' || item.category === activeFilter;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="section-spacing space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <h2 className="text-4xl md:text-5xl font-display font-bold">{title}</h2>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-premium-muted" size={20} />
                        <input 
                            type="text" 
                            placeholder="Buscar nome..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-graphite-800 border border-white/10 rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-loud-500 transition-all text-premium-text"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-premium-muted hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    
                    {categories.length > 1 && (
                        <div className="flex flex-wrap gap-1 bg-graphite-800 p-1 rounded-2xl md:rounded-full border border-white/10 self-start sm:self-auto max-w-full">
                            {categories.map(f => (
                                <button 
                                    key={f}
                                    onClick={() => setActiveFilter(f as string)}
                                    className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                                        activeFilter === f 
                                        ? 'bg-loud-500 text-graphite-900 shadow-lg' 
                                        : 'text-premium-muted hover:text-white'
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                 <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <div className="w-12 h-12 border-4 border-loud-500/20 border-t-loud-500 rounded-full animate-spin"></div>
                    <p className="text-premium-muted font-display uppercase tracking-widest text-sm">Carregando...</p>
                 </div>
            ) : displayItems.length === 0 ? (
                <div className="text-center py-32 text-premium-muted bg-graphite-800 rounded-[40px] border border-white/5">
                    <Search size={64} className="mx-auto mb-6 opacity-10" />
                    <p className="text-xl font-display">Nenhum recurso encontrado.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 animate-fade-in">
                    {displayItems.map((item, idx) => (
                        <div key={item.id || idx} className="card-premium group flex flex-col p-4">
                            <div className="relative aspect-square rounded-2xl overflow-hidden bg-graphite-900 mb-4 border border-white/5">
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110" loading="lazy" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-graphite-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                    <a href={item.imageUrl} target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full border border-white/10"><Eye size={18}/></a>
                                    <a href={item.imageUrl} download className="bg-loud-500 hover:bg-loud-600 text-graphite-900 p-2 rounded-full shadow-lg"><Download size={18}/></a>
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col items-center mb-4 text-center">
                                <p className="font-display font-bold text-sm truncate w-full text-graphite-900 uppercase" title={item.name}>{item.name}</p>
                                {item.category && <p className="text-[10px] text-graphite-500 font-bold uppercase tracking-widest">{item.category}</p>}
                            </div>
                            <a href={item.imageUrl} download className="flex items-center justify-center gap-2 w-full bg-graphite-900 text-loud-500 hover:bg-loud-500 hover:text-graphite-900 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"><Download size={14} /> Baixar</a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const About: React.FC = () => (
  <div className="max-w-4xl mx-auto space-y-12 animate-fade-in py-12">
    <div className="text-center space-y-4">
      <h1 className="text-5xl font-display font-bold text-loud-500">Sobre Jhan Medeiros</h1>
      <p className="italic text-premium-muted text-xl max-w-2xl mx-auto">"Os dados nos mostram claramente as áreas em que precisamos focar para melhorar."</p>
    </div>

    <div className="bg-graphite-800 p-10 rounded-[32px] border border-white/5 space-y-12 text-premium-text leading-relaxed shadow-2xl">
      <p className="text-lg">
        Olá meu nome é <strong className="text-loud-500">Jansey Medeiros</strong> mais conhecido como Jhan, sou analista de dados e mapas e atualmente faço parte da <strong className="text-loud-500">Loud</strong> como Analista de Free Fire desempenho e mapa.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <h3 className="text-2xl font-display font-bold text-loud-500 flex items-center gap-2">
              <Target size={24} /> Formação
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 p-4 bg-graphite-900/50 rounded-2xl border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-loud-500"></div>
                FORMAÇÃO EM ANÁLISE DE DADOS - CFAD – XPERIUN
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-display font-bold text-loud-500 flex items-center gap-2">
              <Star size={24} /> Histórico Profissional
            </h3>
            <ul className="space-y-3">
              {[
                { title: "ANALISTA DE DESEMPENHO E MAPA", company: "LOUD SNICKERS (EM ANDAMENTO)", highlight: true },
                { title: "ANALISTA DE DESEMPENHO E SCOUT", company: "TEAM SOLID 2025/2026" },
                { title: "ANALISTA DE DESEMPENHO", company: "ALFA 34 2024" },
                { title: "ANALISTA DE DESEMPENHO", company: "E1 LBFF 2023/2024" },
                { title: "ANALISTA DE DADOS GERAIS", company: "MUNDIAL 2023 (FURIOUS GAMING)" },
              ].map((job, i) => (
                <li key={i} className={`p-4 rounded-2xl border border-white/5 ${job.highlight ? 'bg-loud-500/10 border-loud-500/20' : 'bg-graphite-900/50'}`}>
                  <div className={`font-bold ${job.highlight ? 'text-loud-500' : 'text-premium-text'}`}>{job.title}</div>
                  <div className="text-xs text-premium-muted uppercase tracking-widest mt-1">{job.company}</div>
                </li>
              ))}
            </ul>
          </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-2xl font-display font-bold text-loud-500 border-b border-white/10 pb-4">Conquistas & Campeonatos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            "FINALISTA E TOP 4 COMISSÃO TÉCNICA LBFF 2023 (E1)",
            "TOP 2 COPA FF – 2024 (E1)",
            "TOP 3 COPA NOBRU 2024 (ALFA34)",
            "TOP 5 MUNDIAL 2025 (TEAM SOLID)",
            "TOP 4 COPA FF 2025 (TEAM SOLID)",
            "TOP 4 FASE CLASSIFICATÓRIA WB 2025 SPLIT 1 (TEAM SOLID)",
            "TOP 2 FASE CLASSIFICATÓRIA WB 2025 SPLIT 2 (TEAM SOLID)",
            "TOP 2 FINAL WB 2025 SPLIT 2 (TEAM SOLID)",
            "TOP 2 CS SQUAD 4X4 WB 2025 (TEAM SOLID)",
            "TOP 3 FINAL COPA FF 2026 (TEAM SOLID)",
            "TOP 5 FINAL WB 2026 SPLIT 1 (TEAM SOLID)"
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-loud-500/10 flex items-center justify-center text-loud-500">
                <Target size={16} />
              </div>
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-2xl font-display font-bold text-loud-500 border-b border-white/10 pb-4">O que faço</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            "Planejamento de Jogo",
            "Organização Tática e Estratégica",
            "Detalhes e Nuances Estratégicas",
            "Análise de Videos",
            "Cultura e Mentalidade Vencedora",
            "Montagem de Elenco e Scout",
            "Criação de Plataformas de Estudos"
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-graphite-900/30 rounded-2xl border border-white/5 hover:border-loud-500/30 transition-colors">
              <div className="w-2 h-2 rounded-full bg-loud-500"></div>
              <span className="font-medium">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MVV Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 mt-12 border-t border-white/10">
          <div className="bg-graphite-900 p-8 rounded-3xl text-center hover:border-loud-500/30 border border-white/5 transition-all group">
              <div className="w-16 h-16 mx-auto bg-loud-500/10 text-loud-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Target size={32} />
              </div>
              <h4 className="font-display font-bold text-xl mb-3 uppercase tracking-widest">Missão</h4>
              <p className="text-premium-muted text-sm leading-relaxed">Tocar vidas através da minha vida com Cristo.</p>
          </div>

          <div className="bg-graphite-900 p-8 rounded-3xl text-center hover:border-loud-500/30 border border-white/5 transition-all group">
              <div className="w-16 h-16 mx-auto bg-loud-500/10 text-loud-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Eye size={32} />
              </div>
              <h4 className="font-display font-bold text-xl mb-3 uppercase tracking-widest">Visão</h4>
              <p className="text-premium-muted text-sm leading-relaxed">Inspirar as pessoas a serem suas melhores versões não apenas no jogo mas como na vida.</p>
          </div>

          <div className="bg-graphite-900 p-8 rounded-3xl text-center hover:border-loud-500/30 border border-white/5 transition-all group">
              <div className="w-16 h-16 mx-auto bg-loud-500/10 text-loud-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Heart size={32} />
              </div>
              <h4 className="font-display font-bold text-xl mb-3 uppercase tracking-widest">Valores</h4>
              <p className="text-premium-muted text-sm leading-relaxed">Agir com transparência, honestidade, fazer sempre o que é certo.</p>
          </div>
      </div>
    </div>
  </div>
);

export const MapsPage: React.FC = () => (
  <div className="section-spacing space-y-12">
    <div className="space-y-4">
      <h2 className="text-4xl md:text-5xl font-display font-bold">Mapas <span className="text-loud-500">Oficiais</span></h2>
      <p className="text-premium-muted text-lg">Clique no card para fazer o download do mapa em alta resolução.</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {MAPS_DATA.map((map) => (
        <div key={map.name} className="group relative rounded-[32px] overflow-hidden shadow-2xl border border-white/10 bg-graphite-800 transition-all hover:-translate-y-2">
           <div className="aspect-video relative">
             <img src={map.imageUrl} alt={map.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
             <div className="absolute inset-0 bg-graphite-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                 <a 
                   href={map.imageUrl} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-full transition-all border border-white/20 hover:scale-110"
                   title="Visualizar"
                 >
                   <Eye size={24} />
                 </a>
                 <a 
                   href={map.imageUrl} 
                   download
                   className="bg-loud-500 hover:bg-loud-600 text-graphite-900 p-4 rounded-full transition-all shadow-xl hover:scale-110"
                   title="Baixar"
                 >
                   <Download size={24} />
                 </a>
             </div>
             <div className="absolute bottom-6 left-6">
                <div className="bg-graphite-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                  <span className="text-white font-display font-bold text-xl uppercase tracking-widest">{map.name}</span>
                </div>
             </div>
           </div>
        </div>
      ))}
    </div>
  </div>
);

export const AerialView: React.FC = () => (
  <div className="section-spacing space-y-12">
    <div className="space-y-4">
      <h2 className="text-4xl md:text-5xl font-display font-bold">Visões <span className="text-loud-500">Aéreas</span></h2>
      <p className="text-premium-muted text-lg">Acesse pastas completas com imagens aéreas para estudo tático.</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {AERIAL_LINKS.map((link) => (
        <a 
          key={link.name} 
          href={link.url} 
          target="_blank"
          className="flex items-center justify-between p-8 bg-graphite-800 rounded-[32px] border border-white/5 hover:border-loud-500/50 transition-all shadow-xl group"
        >
          <div className="flex items-center gap-6">
             <div className="p-4 bg-loud-500/10 text-loud-500 rounded-2xl group-hover:scale-110 transition-transform">
               <ExternalLink size={32} />
             </div>
             <span className="font-display font-bold text-2xl">{link.name}</span>
          </div>
          <div className="flex items-center gap-2 text-loud-500 font-bold text-sm uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
            Acessar <ArrowRight size={18} />
          </div>
        </a>
      ))}
    </div>
  </div>
);

// Reusable component for Static Grid Gallery (Manual Items)
export const StaticGridGalleryPage: React.FC<{ 
    title: string, 
    items: { name: string; imageUrl: string }[]
}> = ({ title, items }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const displayItems = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="section-spacing space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <h2 className="text-4xl md:text-5xl font-display font-bold">{title}</h2>
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-premium-muted" size={20} />
                    <input 
                        type="text" 
                        placeholder="Buscar nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-graphite-800 border border-white/10 rounded-full py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-loud-500 transition-all text-premium-text"
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-premium-muted hover:text-white"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {displayItems.length === 0 ? (
                <div className="text-center py-32 text-premium-muted bg-graphite-800 rounded-[40px] border border-white/5">
                    <Search size={64} className="mx-auto mb-6 opacity-10" />
                    <p className="text-xl font-display">Nenhum item encontrado.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 animate-fade-in">
                    {displayItems.map((item, idx) => (
                        <div key={idx} className="card-premium group flex flex-col p-4">
                            <div className="relative aspect-square rounded-2xl overflow-hidden bg-graphite-900 mb-4 border border-white/5">
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                                {/* Overlay */}
                                <div className="absolute inset-0 bg-graphite-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                    <a href={item.imageUrl} target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full border border-white/10"><Eye size={18}/></a>
                                    <a href={item.imageUrl} download className="bg-loud-500 hover:bg-loud-600 text-graphite-900 p-2 rounded-full shadow-lg"><Download size={18}/></a>
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col items-center mb-4">
                                <p className="font-display font-bold text-center text-sm truncate w-full text-graphite-900" title={item.name}>{item.name}</p>
                            </div>
                            <a href={item.imageUrl} download className="flex items-center justify-center gap-2 w-full bg-graphite-900 text-loud-500 hover:bg-loud-500 hover:text-graphite-900 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"><Download size={14} /> Baixar</a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Reusable component for Pets and Characters gallery logic
export const GridGalleryPage: React.FC<{ 
    sheetUrl: string, 
    title: string, 
    filterType?: boolean,
    imageFit?: 'cover' | 'contain'
}> = ({ sheetUrl, title, filterType, imageFit = 'cover' }) => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'Todos' | 'Ativo' | 'Passivo'>('Todos');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setLoading(true);
        parseCSV(sheetUrl).then(data => {
            const mapped = data.map((row: any) => {
                const name = findValue(row, ['NOME', 'Nome', 'Name', 'Pet', 'Personagem', 'Title', 'Titulo'], false) || 'Desconhecido';
                const image = findValue(row, ['IMAGEM', 'Imagem', 'Image', 'Foto', 'Url', 'Link', 'Icon', 'Icone'], true);
                
                let typeRaw = findValue(row, ['TIPO', 'Tipo', 'Type', 'Categoria'], false) || 'Geral';
                let type = 'Geral';
                
                if (typeRaw.toLowerCase().includes('ativ')) {
                    type = 'Ativo';
                } else if (typeRaw.toLowerCase().includes('passiv')) {
                    type = 'Passivo';
                } else {
                    type = typeRaw;
                }

                const description = findValue(row, ['DESCRIÇÃO', 'Descricao', 'Descrição', 'Habilidade', 'Skill', 'Info'], false) || '';
                
                return { name, image, type, description };
            }).filter(i => i.image);
            
            if (title === 'Personagens') {
                const extraMapped = EXTRA_CHARACTERS.map(c => ({
                    name: c.name,
                    image: c.imageUrl,
                    type: c.type || 'Geral',
                    description: c.ability || ''
                }));
                mapped.push(...extraMapped);
            }

            setItems(mapped);
            setLoading(false);
        });
    }, [sheetUrl, title]);

    const displayItems = items.filter(item => {
        const matchesFilter = activeFilter === 'Todos' || item.type === activeFilter;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="section-spacing space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <h2 className="text-4xl md:text-5xl font-display font-bold">{title}</h2>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    {/* Search Input */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-premium-muted" size={20} />
                        <input 
                            type="text" 
                            placeholder="Buscar nome..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-graphite-800 border border-white/10 rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-loud-500 transition-all text-premium-text"
                        />
                    </div>

                    {/* Filter Buttons */}
                    {filterType && (
                        <div className="flex gap-1 bg-graphite-800 p-1 rounded-full border border-white/10 self-start sm:self-auto">
                            {['Todos', 'Ativo', 'Passivo'].map(f => (
                                <button 
                                    key={f}
                                    onClick={() => setActiveFilter(f as any)}
                                    className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                                        activeFilter === f 
                                        ? 'bg-loud-500 text-graphite-900 shadow-lg' 
                                        : 'text-premium-muted hover:text-white'
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="w-12 h-12 border-4 border-loud-500/20 border-t-loud-500 rounded-full animate-spin"></div>
                <p className="text-premium-muted font-display uppercase tracking-widest text-sm">Carregando dados...</p>
              </div>
            ) : (
                 displayItems.length === 0 ? (
                    <div className="text-center py-32 text-premium-muted bg-graphite-800 rounded-[40px] border border-white/5">
                        <Search size={64} className="mx-auto mb-6 opacity-10" />
                        <p className="text-xl font-display">Nenhum item encontrado.</p>
                    </div>
                 ) : (
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 animate-fade-in">
                    {displayItems.map((item, idx) => (
                        <div 
                            key={idx}
                            className="card-premium group flex flex-col p-4"
                        >
                            <div className="relative aspect-square rounded-2xl overflow-hidden bg-graphite-900 mb-4 border border-white/5">
                                <img 
                                    src={item.image} 
                                    alt={item.name} 
                                    className={`w-full h-full transition-transform duration-500 group-hover:scale-110 ${imageFit === 'contain' ? 'object-contain p-4' : 'object-cover object-top'}`}
                                    loading="lazy"
                                />
                                {/* Overlay with buttons */}
                                <div className="absolute inset-0 bg-graphite-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                     <a 
                                        href={item.image} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full border border-white/10 transition-all"
                                        title="Visualizar"
                                     >
                                         <Eye size={18} />
                                     </a>
                                     <a 
                                        href={item.image} 
                                        download
                                        className="bg-loud-500 hover:bg-loud-600 text-graphite-900 p-2 rounded-full shadow-xl transition-all"
                                        title="Baixar"
                                     >
                                         <Download size={18} />
                                     </a>
                                </div>
                                {/* Badge for Type */}
                                {filterType && item.type !== 'Geral' && (
                                    <div className={`absolute bottom-2 right-2 text-[10px] px-2 py-1 rounded-lg font-bold uppercase shadow-lg ${
                                        item.type === 'Ativo' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                                    }`}>
                                        {item.type}
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-1 flex flex-col items-center mb-4">
                                <p className="font-display font-bold text-center text-sm truncate w-full text-graphite-900" title={item.name}>{item.name}</p>
                                
                                {item.description && (
                                    <p className="text-[10px] text-center text-graphite-600 line-clamp-2 leading-tight mt-1" title={item.description}>
                                        {item.description}
                                    </p>
                                )}
                            </div>

                            <a 
                                href={item.image} 
                                download 
                                className="flex items-center justify-center gap-2 w-full bg-graphite-900 text-loud-500 hover:bg-loud-500 hover:text-graphite-900 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                            >
                                <Download size={14} /> Baixar
                            </a>
                        </div>
                    ))}
                 </div>
                 )
            )}
        </div>
    );
}
