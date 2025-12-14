
import React, { useState, useEffect } from 'react';
import { MAPS_DATA, AERIAL_LINKS, SHEETS, EXTRA_CHARACTERS } from '../constants';
import { parseCSV } from '../utils';
import { Download, ExternalLink, User, Eye, Search, X, Heart, Target, Star } from 'lucide-react';

export const About: React.FC = () => (
  <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-4">Sobre Jhan Medeiros</h1>
      <p className="italic text-gray-500 text-lg">"Os dados nos mostram claramente as áreas em que precisamos focar para melhorar."</p>
    </div>

    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed">
      <p>
        Olá meu nome é <strong>Jansey Medeiros</strong> mais conhecido como Jhan, sou analista de dados e mapas e atualmente faço parte da <strong>Team Solid</strong> como Analista de Free Fire.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-bold text-brand-500 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">Formação</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>FORMAÇÃO EM ANÁLISE DE DADOS - CFAD – XPERIUN</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold text-brand-500 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">Histórico Profissional</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li className="font-bold text-white">ANALISTA DE DESEMPENHO E SCOUT - EM ANDAMENTO (TEAM SOLID)</li>
              <li>ANALISTA DE DESEMPENHO (ALFA 34 2024)</li>
              <li>ANALISTA DE DESEMPENHO (E1 LBFF 2023/2024)</li>
              <li>ANALISTA DE DADOS GERAIS MUNDIAL 2023 (FURIOUS GAMING)</li>
            </ul>
          </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-brand-500 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">Conquistas & Campeonatos</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>FINALISTA E TOP 4 COMISSÃO TÉCNICA LBFF 2023 (E1)</li>
          <li>TOP 2 COPA FF – 2024 (E1)</li>
          <li>TOP 3 COPA NOBRU 2024 (ALFA34)</li>
          <li>TOP 5 MUNDIAL 2025 (TEAM SOLID)</li>
          <li>TOP 4 COPA FF 2025 (TEAM SOLID)</li>
          <li>TOP 4 FASE CLASSIFICATÓRIA WB 2025 SPLIT 1 (TEAM SOLID)</li>
          <li>TOP 2 FASE CLASSIFICATÓRIA WB 2025 SPLIT 2 (TEAM SOLID)</li>
          <li>TOP 2 FINAL WB 2025 SPLIT 2 (TEAM SOLID)</li>
          <li>TOP 2 CS SQUAD 4X4 WB 2025 (TEAM SOLID)</li>
        </ul>
      </div>

      <div>
        <h3 className="text-xl font-bold text-brand-500 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">O que faço</h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-2">
             <span className="text-brand-500 mt-1.5">•</span> Planejamento de Jogo
          </li>
          <li className="flex items-start gap-2">
             <span className="text-brand-500 mt-1.5">•</span> Organização Tática e Estratégica
          </li>
          <li className="flex items-start gap-2">
             <span className="text-brand-500 mt-1.5">•</span> Detalhes e Nuances Estratégicas
          </li>
          <li className="flex items-start gap-2">
             <span className="text-brand-500 mt-1.5">•</span> Análise de Videos
          </li>
          <li className="flex items-start gap-2">
             <span className="text-brand-500 mt-1.5">•</span> Criação de Ambiente, Cultura e Mentalidade Vencedora
          </li>
          <li className="flex flex-col gap-1">
             <div className="flex items-start gap-2">
                <span className="text-brand-500 mt-1.5">•</span> Montagem de Elenco e Scout de Jogadores
             </div>
             <div className="pl-6 text-sm text-gray-400">
                - E1 2023, 2024<br/>
                - ALFA34 (INICIO 2025)
             </div>
          </li>
          <li className="flex items-start gap-2">
             <span className="text-brand-500 mt-1.5">•</span> Criação de Plataformas e acessibilidades de visualização e estudos
          </li>
        </ul>
      </div>

      {/* MVV Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl text-center hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 mx-auto bg-brand-500/10 text-brand-500 rounded-full flex items-center justify-center mb-4">
                  <Target size={24} />
              </div>
              <h4 className="font-bold text-lg mb-2 uppercase">Missão</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tocar vidas através da minha vida com Cristo.</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl text-center hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 mx-auto bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-4">
                  <Eye size={24} />
              </div>
              <h4 className="font-bold text-lg mb-2 uppercase">Visão</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Inspirar as pessoas a serem suas melhores versões não apenas no jogo mas como na vida.</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl text-center hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 mx-auto bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4">
                  <Heart size={24} />
              </div>
              <h4 className="font-bold text-lg mb-2 uppercase">Valores</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Agir com transparência, honestidade, fazer sempre o que é certo.</p>
          </div>
      </div>
    </div>
  </div>
);

export const MapsPage: React.FC = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Mapas Oficiais</h2>
    <p className="text-gray-500">Clique no card para fazer o download do mapa em alta resolução.</p>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {MAPS_DATA.map((map) => (
        <div key={map.name} className="group relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
           <div className="aspect-video relative">
             <img src={map.imageUrl} alt={map.name} className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                 <a 
                   href={map.imageUrl} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white p-2 rounded-full transition-colors border border-white/20"
                   title="Visualizar"
                 >
                   <Eye size={20} />
                 </a>
                 <a 
                   href={map.imageUrl} 
                   download
                   className="bg-brand-500 hover:bg-brand-600 text-gray-900 p-2 rounded-full transition-colors shadow-lg"
                   title="Baixar"
                 >
                   <Download size={20} />
                 </a>
             </div>
             <div className="absolute bottom-4 left-4 text-white font-black text-2xl drop-shadow-lg">{map.name}</div>
           </div>
        </div>
      ))}
    </div>
  </div>
);

export const AerialView: React.FC = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Visões Aéreas (Google Drive)</h2>
    <p className="text-gray-500">Acesse pastas completas com imagens aéreas para estudo tático.</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {AERIAL_LINKS.map((link) => (
        <a 
          key={link.name} 
          href={link.url} 
          target="_blank"
          className="flex items-center justify-between p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-500 transition-all shadow-sm hover:shadow-md group"
        >
          <div className="flex items-center gap-3">
             <div className="p-3 bg-brand-100 dark:bg-brand-900 text-brand-600 rounded-lg">
               <ExternalLink size={24} />
             </div>
             <span className="font-bold text-lg">{link.name}</span>
          </div>
          <span className="text-sm text-gray-500 group-hover:text-brand-500">Acessar Pasta &rarr;</span>
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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold">{title}</h2>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {displayItems.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    <Search size={40} className="mx-auto mb-2 opacity-20" />
                    <p>Nenhum item encontrado.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-fade-in">
                    {displayItems.map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-500 transition-all hover:-translate-y-1 shadow-sm group flex flex-col">
                            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 mb-2">
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-2" loading="lazy" />
                                {/* Overlay */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <a href={item.imageUrl} target="_blank" rel="noopener noreferrer" className="bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-sm"><Eye size={16}/></a>
                                    <a href={item.imageUrl} download className="bg-brand-500 hover:bg-brand-600 text-gray-900 p-2 rounded-full shadow-md"><Download size={16}/></a>
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col items-center">
                                <p className="font-bold text-center text-sm truncate w-full" title={item.name}>{item.name}</p>
                            </div>
                            <a href={item.imageUrl} download className="mt-2 flex items-center justify-center gap-1 w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-1.5 rounded text-xs font-medium transition-colors"><Download size={12} /> Baixar</a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Reusable value finder
const findValue = (row: any, searchKeys: string[], isUrl = false): string | undefined => {
    const keys = Object.keys(row);
    
    // 1. Try exact or fuzzy key match
    for (const sKey of searchKeys) {
        if (row[sKey]) return row[sKey];
        const foundKey = keys.find(k => k.toLowerCase().trim() === sKey.toLowerCase());
        if (foundKey && row[foundKey]) return row[foundKey];
        const partialKey = keys.find(k => k.toLowerCase().includes(sKey.toLowerCase()));
        if (partialKey && row[partialKey]) return row[partialKey];
    }
    
    const values = Object.values(row) as string[];

    // 2. URL Fallback
    if (isUrl) {
        const urlValue = values.find(v => typeof v === 'string' && v.trim().startsWith('http'));
        if (urlValue) return urlValue;
    }

    // 3. Name Fallback (Text, non-url, reasonable length)
    if (!isUrl) {
         const nameValue = values.find(v => 
            typeof v === 'string' && 
            !v.trim().startsWith('http') && 
            v.trim().length > 1 && 
            v.trim().length < 40 &&
            !['ativo', 'passivo', 'active', 'passive'].includes(v.toLowerCase().trim())
         );
         if (nameValue) return nameValue;
    }

    return undefined;
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
                
                // Enhanced Type Normalization
                let typeRaw = findValue(row, ['TIPO', 'Tipo', 'Type', 'Categoria'], false) || 'Geral';
                let type = 'Geral';
                
                // Normalizing to ensure filters work regardless of CSV variations (e.g. "Ativa", "Habilidade Ativa", "Active")
                if (typeRaw.toLowerCase().includes('ativ')) {
                    type = 'Ativo';
                } else if (typeRaw.toLowerCase().includes('passiv')) {
                    type = 'Passivo';
                } else {
                    type = typeRaw;
                }

                const description = findValue(row, ['DESCRIÇÃO', 'Descricao', 'Descrição', 'Habilidade', 'Skill', 'Info'], false) || '';
                
                return { name, image, type, description };
            }).filter(i => i.image); // Only keep items with images
            
            // Add manual characters if we are on the Characters page
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

    // Combined Filtering Logic: Filter Button AND Search Term
    const displayItems = items.filter(item => {
        const matchesFilter = activeFilter === 'Todos' || item.type === activeFilter;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold">{title}</h2>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {/* Search Input */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar nome..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Filter Buttons */}
                    {filterType && (
                        <div className="flex gap-1 bg-white dark:bg-gray-800 p-1 rounded-full border border-gray-200 dark:border-gray-700 self-start sm:self-auto">
                            {['Todos', 'Ativo', 'Passivo'].map(f => (
                                <button 
                                    key={f}
                                    onClick={() => setActiveFilter(f as any)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                                        activeFilter === f 
                                        ? 'bg-brand-500 text-gray-900 shadow-md' 
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {loading ? <p className="text-center py-20 text-gray-500">Carregando dados...</p> : (
                 displayItems.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <Search size={40} className="mx-auto mb-2 opacity-20" />
                        <p>Nenhum item encontrado.</p>
                    </div>
                 ) : (
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-fade-in">
                    {displayItems.map((item, idx) => (
                        <div 
                            key={idx}
                            className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-500 transition-all hover:-translate-y-1 shadow-sm group flex flex-col"
                        >
                            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 mb-2">
                                <img 
                                    src={item.image} 
                                    alt={item.name} 
                                    // Use object-top for characters to show face
                                    className={`w-full h-full ${imageFit === 'contain' ? 'object-contain p-2' : 'object-cover object-top'}`}
                                    loading="lazy"
                                />
                                {/* Overlay with buttons */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                     <a 
                                        href={item.image} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                                        title="Visualizar"
                                     >
                                         <Eye size={16} />
                                     </a>
                                     <a 
                                        href={item.image} 
                                        download
                                        className="bg-brand-500 hover:bg-brand-600 text-gray-900 p-2 rounded-full shadow-md transition-colors"
                                        title="Baixar"
                                     >
                                         <Download size={16} />
                                     </a>
                                </div>
                                {/* Badge for Type */}
                                {filterType && item.type !== 'Geral' && (
                                    <div className={`absolute bottom-1 right-1 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase shadow-sm ${
                                        item.type === 'Ativo' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                                    }`}>
                                        {item.type}
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-1 flex flex-col items-center">
                                <p className="font-bold text-center text-sm truncate w-full" title={item.name}>{item.name}</p>
                                
                                {item.description && (
                                    <p className="text-xs text-center text-gray-400 line-clamp-2 leading-tight mb-2" title={item.description}>
                                        {item.description}
                                    </p>
                                )}
                            </div>

                            <a 
                                href={item.image} 
                                download 
                                className="mt-2 flex items-center justify-center gap-1 w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-1.5 rounded text-xs font-medium transition-colors"
                            >
                                <Download size={12} /> Baixar
                            </a>
                        </div>
                    ))}
                 </div>
                 )
            )}
        </div>
    );
}
