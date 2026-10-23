import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, X, User, Crosshair, PawPrint, Map, 
  ArrowRight, Sparkles, Zap, Shield, Clock, 
  Copy, Check, ExternalLink, ChevronRight, Filter, Compass
} from 'lucide-react';
import { GARENA_CHARACTERS } from '../src/data/garenaCharacters';
import { EXTRA_CHARACTERS, MAPS_DATA, MAP_LOCATIONS } from '../constants';
import PETS_DATA from '../src/data/pets.json';
import WEAPONS_DATA from '../src/data/weapons.json';

export type SearchCategory = 'todos' | 'personagens' | 'armas' | 'pets' | 'mapas';

export interface SearchResultItem {
  id: string;
  category: 'personagens' | 'armas' | 'pets' | 'mapas';
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  badge?: string;
  badgeColor?: string;
  metaInfo?: string;
  linkPath: string;
  linkText: string;
  raw?: any;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('todos');
  const [selectedItem, setSelectedItem] = useState<SearchResultItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setSelectedItem(null);
    }
  }, [isOpen]);

  // Keyboard shortcut listener (ESC to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Unified items list
  const allItems: SearchResultItem[] = useMemo(() => {
    const list: SearchResultItem[] = [];

    // 1. Characters
    GARENA_CHARACTERS.forEach(char => {
      list.push({
        id: `char-${char.id || char.name}`,
        category: 'personagens',
        title: char.name,
        subtitle: `${char.type} • ${char.role || 'Geral'}`,
        description: char.ability_introduction || char.ability || '',
        imageUrl: char.cover_img || char.character_pc || char.head_icon || '',
        badge: char.type,
        badgeColor: char.type === 'Ativo' ? 'bg-loud-500/20 text-loud-400 border-loud-500/40' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
        metaInfo: char.cooldown ? `Tempo de Recarga: ${char.cooldown}s` : undefined,
        linkPath: '/laboratorio-meta',
        linkText: 'Abrir no Laboratório',
        raw: {
          ...char,
          skillName: char.ability,
          skillIcon: char.skill_icon
        }
      });
    });

    // Extra characters if any
    EXTRA_CHARACTERS.forEach(char => {
      if (!list.some(item => item.title.toLowerCase() === char.name.toLowerCase())) {
        list.push({
          id: `extra-char-${char.name}`,
          category: 'personagens',
          title: char.name,
          subtitle: `${char.type || 'Ativo'} • Especial`,
          description: char.ability || 'Habilidade especial tática para composição competitiva.',
          imageUrl: char.imageUrl || '',
          badge: char.type || 'Ativo',
          badgeColor: 'bg-loud-500/20 text-loud-400 border-loud-500/40',
          linkPath: '/composicao',
          linkText: 'Ver na Composição',
          raw: char
        });
      }
    });

    // 2. Weapons
    WEAPONS_DATA.forEach(weapon => {
      list.push({
        id: `weapon-${weapon.name}`,
        category: 'armas',
        title: weapon.name,
        subtitle: weapon.class,
        description: weapon.description,
        imageUrl: weapon.imageUrl,
        badge: weapon.class,
        badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        linkPath: '/armas',
        linkText: 'Ver na Galeria de Armas',
        raw: weapon
      });
    });

    // 3. Pets
    PETS_DATA.forEach(pet => {
      list.push({
        id: `pet-${pet.name}`,
        category: 'pets',
        title: pet.name,
        subtitle: 'Pet Tático',
        description: pet.ability,
        imageUrl: pet.imageUrl,
        badge: 'Pet',
        badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
        linkPath: '/pets',
        linkText: 'Ver na Galeria de Pets',
        raw: pet
      });
    });

    // 4. Maps
    MAPS_DATA.forEach(mapItem => {
      const normalizedName = mapItem.name.charAt(0).toUpperCase() + mapItem.name.slice(1).toLowerCase();
      // Look up matching calls from MAP_LOCATIONS
      const calls = MAP_LOCATIONS[normalizedName] || MAP_LOCATIONS[mapItem.name] || [];
      const callsPreview = calls.length > 0 ? `Calls principais: ${calls.slice(0, 8).join(', ')}...` : 'Mapa competitivo oficial';

      list.push({
        id: `map-${mapItem.name}`,
        category: 'mapas',
        title: mapItem.name,
        subtitle: 'Mapa Competitivo',
        description: callsPreview,
        imageUrl: mapItem.imageUrl,
        badge: 'Oficial',
        badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        metaInfo: calls.length > 0 ? `${calls.length} Cidades/Calls Mapeadas` : undefined,
        linkPath: '/quadro-tatico',
        linkText: 'Abrir no Quadro Tático',
        raw: {
          ...mapItem,
          calls
        }
      });
    });

    return list;
  }, []);

  // Filtered Results
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    return allItems.filter(item => {
      // Category filter
      if (activeCategory !== 'todos' && item.category !== activeCategory) {
        return false;
      }

      if (!q) return true;

      // Title match
      if (item.title.toLowerCase().includes(q)) return true;

      // Subtitle match (e.g. "SMG", "Ativo", "Rusher")
      if (item.subtitle.toLowerCase().includes(q)) return true;

      // Description match
      if (item.description.toLowerCase().includes(q)) return true;

      // Map calls search
      if (item.category === 'mapas' && item.raw?.calls) {
        return item.raw.calls.some((c: string) => c.toLowerCase().includes(q));
      }

      return false;
    });
  }, [allItems, query, activeCategory]);

  // Keep first result selected if none or out of bounds
  useEffect(() => {
    if (filteredResults.length > 0) {
      if (!selectedItem || !filteredResults.some(r => r.id === selectedItem.id)) {
        setSelectedItem(filteredResults[0]);
      }
    } else {
      setSelectedItem(null);
    }
  }, [filteredResults, selectedItem]);

  const handleNavigate = (path: string) => {
    onClose();
    onNavigate(path);
  };

  const handleCopyDetails = (item: SearchResultItem) => {
    const text = `[${item.title.toUpperCase()}] (${item.subtitle})\n${item.description}\nJhan Medeiros Analytics`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center pt-8 sm:pt-16 p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-4xl bg-graphite-900 border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-white"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-graphite-800/80 flex items-center gap-3">
          <Search size={22} className="text-loud-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Pesquisar personagens, armas, pets, mapas ou calls (ex: Tatsuya, MP40, Waggor, Bermuda, Peak)..."
            className="w-full bg-transparent border-none outline-none text-base sm:text-lg font-bold placeholder-white/30 text-white"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg hover:bg-white/10 text-premium-muted hover:text-white transition-colors"
              title="Limpar busca"
            >
              <X size={18} />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-premium-muted hover:text-white transition-all font-mono"
            title="Fechar busca (ESC)"
          >
            ESC
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="px-4 py-2.5 border-b border-white/10 bg-graphite-950/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-black uppercase text-premium-muted tracking-widest mr-1 hidden sm:inline">
            Filtrar:
          </span>
          {[
            { id: 'todos', label: 'Todos', icon: Compass, count: allItems.length },
            { id: 'personagens', label: 'Personagens', icon: User, count: allItems.filter(i => i.category === 'personagens').length },
            { id: 'armas', label: 'Armas', icon: Crosshair, count: allItems.filter(i => i.category === 'armas').length },
            { id: 'pets', label: 'Pets', icon: PawPrint, count: allItems.filter(i => i.category === 'pets').length },
            { id: 'mapas', label: 'Mapas', icon: Map, count: allItems.filter(i => i.category === 'mapas').length },
          ].map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as SearchCategory)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-loud-500 text-graphite-950 shadow-md font-black'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={14} />
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-400'}`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Content Split View: Left Results List, Right Quick Preview */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[350px]">
          {/* Results List (7 cols on desktop) */}
          <div className="md:col-span-7 overflow-y-auto p-3 space-y-2 border-r border-white/10 custom-scrollbar max-h-[55vh] md:max-h-[60vh]">
            {filteredResults.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-3">
                <Search size={40} className="mx-auto text-gray-600" />
                <p className="text-base font-bold text-gray-300">Nenhum resultado encontrado para "{query}"</p>
                <p className="text-xs text-premium-muted max-w-sm mx-auto">
                  Tente pesquisar por nomes de personagens como "Alok", "Tatsuya", armas como "Groza", "AWM", pets como "Mr. Waggor" ou mapas como "Bermuda".
                </p>
              </div>
            ) : (
              filteredResults.map(item => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-loud-500/10 border-loud-500/60 shadow-lg'
                        : 'bg-graphite-800/60 hover:bg-graphite-800 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-xl bg-graphite-950 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Sparkles size={18} className="text-loud-500" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sm text-white truncate">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${item.badgeColor || 'bg-white/10 text-white'}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-premium-muted truncate mt-0.5">
                        {item.subtitle}
                      </p>
                      <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                        {item.description}
                      </p>
                    </div>

                    {/* Arrow Action */}
                    <ChevronRight size={16} className={`shrink-0 ${isSelected ? 'text-loud-500 translate-x-1' : 'text-gray-500'} transition-transform`} />
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Preview Panel (5 cols on desktop, hidden on mobile unless selected) */}
          <div className="hidden md:flex md:col-span-5 bg-graphite-950/60 p-5 flex-col justify-between overflow-y-auto custom-scrollbar">
            {selectedItem ? (
              <div className="space-y-4">
                {/* Header with image */}
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-graphite-900 border border-white/10 flex items-center justify-center shadow-lg">
                  {selectedItem.imageUrl ? (
                    <img
                      src={selectedItem.imageUrl}
                      alt={selectedItem.title}
                      className="w-full h-full object-contain p-2"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Compass size={40} className="text-loud-500" />
                  )}
                  {selectedItem.badge && (
                    <div className="absolute top-3 right-3">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border shadow-md ${selectedItem.badgeColor || 'bg-white/10 text-white'}`}>
                        {selectedItem.badge}
                      </span>
                    </div>
                  )}
                </div>

                {/* Identity */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">
                      {selectedItem.title}
                    </h3>
                    <button
                      onClick={() => handleCopyDetails(selectedItem)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      title="Copiar dados"
                    >
                      {copiedId === selectedItem.id ? <Check size={16} className="text-loud-400" /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="text-xs font-bold text-loud-400 uppercase tracking-wider mt-0.5">
                    {selectedItem.subtitle}
                  </p>
                </div>

                {/* Description and specific details */}
                <div className="p-3.5 rounded-2xl bg-graphite-900/90 border border-white/5 space-y-2 text-xs">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                    {selectedItem.category === 'personagens' ? 'Habilidade / Efeito' : 
                     selectedItem.category === 'armas' ? 'Especificação Balística' : 
                     selectedItem.category === 'pets' ? 'Bônus Tático' : 'Informações do Mapa'}
                  </span>
                  <p className="text-gray-200 leading-relaxed text-xs">
                    {selectedItem.description}
                  </p>
                  {selectedItem.metaInfo && (
                    <div className="pt-2 border-t border-white/5 flex items-center gap-1.5 text-loud-400 font-bold text-[11px]">
                      <Clock size={12} />
                      <span>{selectedItem.metaInfo}</span>
                    </div>
                  )}
                </div>

                {/* Map specific calls tags preview */}
                {selectedItem.category === 'mapas' && selectedItem.raw?.calls && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      Calls Mapeadas ({selectedItem.raw.calls.length}):
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar p-1">
                      {selectedItem.raw.calls.map((call: string, i: number) => (
                        <span key={i} className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/5 text-gray-300 border border-white/5">
                          {call}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Character skill icon if present */}
                {selectedItem.category === 'personagens' && selectedItem.raw?.skillIcon && (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-graphite-900/70 border border-white/5">
                    <img
                      src={selectedItem.raw.skillIcon}
                      alt={selectedItem.raw.skillName || 'Skill'}
                      className="w-10 h-10 object-contain rounded-lg bg-black/40 p-1 border border-white/10"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] text-gray-400 uppercase font-black block">Ícone de Habilidade</span>
                      <span className="text-xs font-bold text-white truncate block">{selectedItem.raw.skillName || selectedItem.title}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center p-6 text-gray-500">
                <p className="text-xs">Selecione um item da lista para visualizar a ficha técnica completa.</p>
              </div>
            )}

            {/* Bottom Actions */}
            {selectedItem && (
              <div className="pt-4 border-t border-white/10 mt-auto flex items-center gap-2">
                <button
                  onClick={() => handleNavigate(selectedItem.linkPath)}
                  className="flex-1 bg-loud-500 hover:bg-loud-400 text-graphite-950 font-black text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:scale-[1.02] cursor-pointer"
                >
                  <span>{selectedItem.linkText}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-3 bg-graphite-950 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-loud-500 animate-pulse" />
            <span>Busca indexada de <strong>{allItems.length} ativos oficiais</strong> (Personagens, Armas, Pets e Mapas)</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono text-gray-500">
            <span>Dica: Use <strong>Ctrl + K</strong> a qualquer momento</span>
          </div>
        </div>
      </div>
    </div>
  );
};
