
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
          <h2 className="text-3xl font-bold">Safes</h2>
          <p className="text-gray-500">Visualize as zonas seguras e dados detalhados da planilha.</p>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-300 px-4 py-2 rounded-lg font-mono text-sm font-bold">
            {filteredData.length} Registros
            </div>
            <div className="flex bg-gray-200 dark:bg-gray-800 rounded-lg p-1">
                <button 
                    onClick={() => setViewMode('gallery')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'gallery' ? 'bg-white dark:bg-gray-700 shadow text-brand-500' : 'text-gray-500'}`}
                    title="Visualização em Galeria"
                >
                    <LayoutGrid size={20} />
                </button>
                <button 
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 shadow text-brand-500' : 'text-gray-500'}`}
                    title="Visualização em Tabela Completa"
                >
                    <List size={20} />
                </button>
            </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 text-gray-500 mr-2">
          <Filter size={20} />
          <span className="font-medium hidden md:inline">Filtros:</span>
        </div>
        
        {/* Search Input */}
        <div className="relative w-full md:w-64 flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 pl-10 pr-8 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
            />
            {searchTerm && (
                <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 p-1"
                >
                    <X size={14} />
                </button>
            )}
        </div>
        
        <select 
          value={selectedMap} 
          onChange={(e) => setSelectedMap(e.target.value)}
          className="w-full md:w-auto bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 outline-none focus:border-brand-500 cursor-pointer"
        >
          {uniqueMaps.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <select 
          value={selectedSafeNum} 
          onChange={(e) => setSelectedSafeNum(e.target.value)}
          className="w-full md:w-auto bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 outline-none focus:border-brand-500 cursor-pointer"
        >
          {uniqueSafeNums.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-20">Carregando dados da planilha...</div>
      ) : (
        <>
            {viewMode === 'gallery' ? (
                <>
                    {filteredData.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">
                            <Search size={40} className="mx-auto mb-2 opacity-20" />
                            <p>Nenhum resultado encontrado.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredData.map((row, idx) => {
                            const img = getImage(row);
                            
                            // Only render card if we found an image url
                            if (!img) return null;

                            return (
                                <div 
                                  key={idx} 
                                  className="group relative block rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                                >
                                  <div className="relative aspect-video bg-gray-100 dark:bg-gray-900">
                                      <img 
                                        src={img} 
                                        alt={`${getMap(row)} ${getSafe(row)}`} 
                                        className="w-full h-full object-cover" 
                                        loading="lazy" 
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).parentElement!.classList.add('flex', 'items-center', 'justify-center');
                                            (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-xs text-gray-500">Erro ao carregar imagem</span>';
                                        }}
                                      />
                                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                          <a 
                                            href={img} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white p-3 rounded-full transition-colors border border-white/20"
                                            title="Visualizar"
                                          >
                                            <Eye size={24} />
                                          </a>
                                          <a 
                                            href={img} 
                                            download
                                            className="bg-brand-500 hover:bg-brand-600 text-gray-900 p-3 rounded-full transition-colors shadow-lg"
                                            title="Baixar"
                                          >
                                            <Download size={24} />
                                          </a>
                                      </div>
                                  </div>
                                  <div className="p-4">
                                      <p className="font-bold text-lg dark:text-white truncate">{getMap(row)}</p>
                                      <p className="text-gray-500 dark:text-gray-400 text-sm truncate">{getSafe(row)}</p>
                                      <a 
                                        href={img} 
                                        download 
                                        className="mt-3 flex items-center justify-center gap-2 w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 rounded-lg text-sm font-medium transition-colors"
                                      >
                                        <Download size={16} /> Baixar Imagem
                                      </a>
                                  </div>
                                </div>
                            );
                        })}
                        </div>
                    )}
                </>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase font-bold whitespace-nowrap">
                            <tr>
                                {headers.map(h => <th key={h} className="px-6 py-3">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                            {filteredData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    {headers.map(h => {
                                        const val = row[h];
                                        const isUrl = val?.toString().startsWith('http');
                                        const isImage = isUrl && /\.(jpg|jpeg|png|webp|gif)$/i.test(val);
                                        
                                        return (
                                            <td key={h} className="px-6 py-4 whitespace-nowrap">
                                                {isImage ? (
                                                    <a href={val} target="_blank" rel="noopener" className="block w-16 h-10 overflow-hidden rounded border border-gray-200 dark:border-gray-600 hover:scale-150 transition-transform origin-left relative z-0 hover:z-10">
                                                        <img src={val} className="w-full h-full object-cover" alt="Preview" />
                                                    </a>
                                                ) : isUrl ? (
                                                    <a href={val} target="_blank" rel="noopener" className="text-brand-500 hover:underline truncate max-w-[200px] block">
                                                        {val}
                                                    </a>
                                                ) : (
                                                    val
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
