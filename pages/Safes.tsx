
import React, { useState, useEffect } from 'react';
import { parseCSV } from '../utils';
import { SHEETS } from '../constants';
import { Filter, LayoutGrid, List, Download, Eye, Search, X } from 'lucide-react';

interface SafeRow {
  [key: string]: string;
}

// Robust helper to find value in row (copied/adapted for Safes context)
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

    // 2. URL Fallback: Find first string starting with http
    if (isUrl) {
        const urlValue = values.find(v => typeof v === 'string' && v.trim().startsWith('http'));
        if (urlValue) return urlValue;
    }

    // 3. Name Fallback
    if (!isUrl) {
         const nameValue = values.find(v => 
            typeof v === 'string' && 
            !v.trim().startsWith('http') && 
            v.trim().length > 1
         );
         if (nameValue) return nameValue;
    }

    return undefined;
};

const Safes: React.FC = () => {
  const [data, setData] = useState<SafeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'gallery' | 'table'>('gallery');
  
  // Filters
  const [selectedMap, setSelectedMap] = useState<string>('Todos');
  const [selectedSafeNum, setSelectedSafeNum] = useState<string>('Todas');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadSafes = async () => {
      const result = await parseCSV(SHEETS.SAFES);
      setData(result);
      setLoading(false);
    };
    loadSafes();
  }, []);

  // Robust getters using the helper function
  const getMap = (row: SafeRow) => findValue(row, ['MAPA', 'Mapa', 'Map']) || 'Desconhecido';
  const getSafe = (row: SafeRow) => findValue(row, ['SAFE', 'Safe', 'Zona', 'Zone']) || 'Geral';
  const getImage = (row: SafeRow) => findValue(row, ['IMAGEM', 'Imagem', 'Foto', 'Url', 'Link', 'Image'], true) || '';

  const uniqueMaps = ['Todos', ...Array.from(new Set(data.map(r => getMap(r)).filter(m => m !== 'Desconhecido')))];
  const uniqueSafeNums = ['Todas', ...Array.from(new Set(data.map(r => getSafe(r)).filter(s => s !== 'Geral'))).sort()];

  const filteredData = data.filter(r => {
    const mapMatch = selectedMap === 'Todos' || getMap(r) === selectedMap;
    const safeMatch = selectedSafeNum === 'Todas' || getSafe(r) === selectedSafeNum;
    
    // Search across all values in the row
    const searchMatch = !searchTerm || Object.values(r).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return mapMatch && safeMatch && searchMatch;
  });

  // Get all headers dynamically from the first row of data
  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-display font-bold uppercase text-white italic tracking-tighter leading-none">Safes</h2>
          <p className="text-premium-muted mt-2 font-medium">Visualize as zonas seguras e dados detalhados da planilha.</p>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="bg-loud-500/10 text-loud-500 border border-loud-500/20 px-4 py-2 rounded-lg font-mono text-sm font-black uppercase tracking-widest">
            {filteredData.length} Registros
            </div>
            <div className="flex bg-graphite-800 rounded-xl p-1 border border-white/5">
                <button 
                    onClick={() => setViewMode('gallery')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'gallery' ? 'bg-loud-500 shadow-lg text-black' : 'text-premium-muted hover:text-white'}`}
                    title="Visualização em Galeria"
                >
                    <LayoutGrid size={20} />
                </button>
                <button 
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-loud-500 shadow-lg text-black' : 'text-premium-muted hover:text-white'}`}
                    title="Visualização em Tabela Completa"
                >
                    <List size={20} />
                </button>
            </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-graphite-800 p-6 rounded-[2rem] border border-white/5 shadow-2xl flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 text-loud-500 mr-2">
          <Filter size={20} />
          <span className="font-black text-xs uppercase tracking-widest hidden md:inline">Filtros</span>
        </div>
        
        {/* Search Input */}
        <div className="relative w-full md:w-64 flex-1 md:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-premium-muted" size={18} />
            <input 
                type="text" 
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-graphite-900 border border-white/5 rounded-xl py-3 pl-12 pr-10 text-sm text-white placeholder:text-premium-muted/50 focus:outline-none focus:border-loud-500/50 transition-all"
            />
            {searchTerm && (
                <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-premium-muted hover:text-white p-1"
                >
                    <X size={14} />
                </button>
            )}
        </div>
        
        <select 
          value={selectedMap} 
          onChange={(e) => setSelectedMap(e.target.value)}
          className="w-full md:w-auto bg-graphite-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-loud-500/50 cursor-pointer transition-all font-bold"
        >
          {uniqueMaps.map(m => <option key={m} value={m} className="bg-graphite-900">{m}</option>)}
        </select>

        <select 
          value={selectedSafeNum} 
          onChange={(e) => setSelectedSafeNum(e.target.value)}
          className="w-full md:w-auto bg-graphite-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-loud-500/50 cursor-pointer transition-all font-bold"
        >
          {uniqueSafeNums.map(s => <option key={s} value={s} className="bg-graphite-900">{s}</option>)}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-20 text-premium-muted font-black uppercase tracking-[0.3em] animate-pulse">Carregando dados da planilha...</div>
      ) : (
        <>
            {viewMode === 'gallery' ? (
                <>
                    {filteredData.length === 0 ? (
                        <div className="text-center py-32 text-premium-muted bg-graphite-800/50 rounded-[3rem] border border-white/5 border-dashed">
                            <Search size={64} className="mx-auto mb-6 opacity-10" />
                            <p className="font-black uppercase tracking-widest italic">Nenhum resultado encontrado</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredData.map((row, idx) => {
                            const img = getImage(row);
                            
                            // Only render card if we found an image url
                            if (!img) return null;

                            return (
                                <div 
                                  key={idx} 
                                  className="group relative block rounded-[2rem] overflow-hidden shadow-2xl transition-all border border-white/5 bg-graphite-800 hover:border-loud-500/30 hover:-translate-y-2"
                                >
                                  <div className="relative aspect-video bg-graphite-900 overflow-hidden">
                                      <img 
                                        src={img} 
                                        alt={`${getMap(row)} ${getSafe(row)}`} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                        loading="lazy" 
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).parentElement!.classList.add('flex', 'items-center', 'justify-center');
                                            (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-[10px] font-black uppercase text-premium-muted italic">Erro ao carregar imagem</span>';
                                        }}
                                      />
                                      <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 backdrop-blur-sm">
                                          <a 
                                            href={img} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-2xl transition-all border border-white/10 hover:scale-110 active:scale-95"
                                            title="Visualizar"
                                          >
                                            <Eye size={24} />
                                          </a>
                                          <a 
                                            href={img} 
                                            download
                                            className="bg-loud-500 hover:bg-loud-600 text-black p-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(58,255,0,0.4)] hover:scale-110 active:scale-95"
                                            title="Baixar"
                                          >
                                            <Download size={24} />
                                          </a>
                                      </div>
                                  </div>
                                  <div className="p-6">
                                      <div className="flex justify-between items-start mb-4">
                                          <div>
                                              <p className="font-display font-bold text-xl text-white uppercase italic tracking-tighter">{getMap(row)}</p>
                                              <p className="text-loud-500 font-black text-[10px] uppercase tracking-widest mt-1 italic">{getSafe(row)}</p>
                                          </div>
                                      </div>
                                      <a 
                                        href={img} 
                                        download 
                                        className="flex items-center justify-center gap-2 w-full bg-graphite-900 hover:bg-graphite-700 text-premium-muted hover:text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5"
                                      >
                                        <Download size={14} /> Baixar Imagem
                                      </a>
                                  </div>
                                </div>
                            );
                        })}
                        </div>
                    )}
                </>
            ) : (
                <div className="overflow-x-auto rounded-[2.5rem] border border-white/5 shadow-2xl bg-graphite-800/50">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-graphite-800 text-premium-muted text-[10px] font-black uppercase sticky top-0 backdrop-blur-md border-b border-white/5">
                            <tr>
                                {headers.map(h => <th key={h} className="px-6 py-4 tracking-widest italic">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-loud-500/5 transition-colors group">
                                    {headers.map(h => {
                                        const val = row[h];
                                        const isUrl = val?.toString().startsWith('http');
                                        const isImage = isUrl && /\.(jpg|jpeg|png|webp|gif)$/i.test(val);
                                        
                                        return (
                                            <td key={h} className="px-6 py-4 whitespace-nowrap">
                                                {isImage ? (
                                                    <a href={val} target="_blank" rel="noopener" className="block w-16 h-10 overflow-hidden rounded-lg border border-white/10 hover:scale-150 transition-transform origin-left relative z-0 hover:z-10 shadow-lg">
                                                        <img src={val} className="w-full h-full object-cover" alt="Preview" />
                                                    </a>
                                                ) : isUrl ? (
                                                    <a href={val} target="_blank" rel="noopener" className="text-loud-500 hover:underline truncate max-w-[200px] block font-bold">
                                                        {val}
                                                    </a>
                                                ) : (
                                                    <span className="text-premium-muted font-medium">{val}</span>
                                                )}
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
      )}
    </div>
  );
};

export default Safes;
