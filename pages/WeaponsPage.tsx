import React, { useState } from 'react';
import WEAPONS_DATA from '../src/data/weapons.json';
import { Eye, Search, X } from 'lucide-react';

export const WeaponsPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const displayItems = WEAPONS_DATA.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.class.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="section-spacing space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <h2 className="text-4xl md:text-5xl font-display font-bold">Armas</h2>
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-premium-muted" size={20} />
                    <input 
                        type="text" 
                        placeholder="Buscar arma ou classe..."
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
                    <p className="text-xl font-display">Nenhuma arma encontrada.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 animate-fade-in">
                    {displayItems.map((item, idx) => (
                        <div key={idx} className="card-premium group flex flex-col p-4 rounded-3xl bg-graphite-800 border border-white/10">
                            <div className="relative aspect-video rounded-2xl overflow-hidden bg-graphite-900 mb-4 border border-white/5">
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                                <div className="absolute inset-0 bg-graphite-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                    <a href={item.imageUrl} target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full border border-white/10"><Eye size={18}/></a>
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col items-center mb-4">
                                <p className="font-display font-bold text-center text-sm truncate w-full text-white" title={item.name}>{item.name}</p>
                                <p className="text-[10px] text-loud-500 font-bold uppercase tracking-wider">{item.class}</p>
                                <p className="text-[10px] text-premium-muted mt-1 text-center line-clamp-2">{item.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
