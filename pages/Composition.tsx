
import React, { useState, useEffect } from 'react';
import { Camera, Plus, Trash2, Download, PawPrint, Zap, Shield, Info, RotateCcw, X, Search, Image as ImageIcon, Briefcase, ChevronDown } from 'lucide-react';
import { parseCSV, downloadDivAsImage } from '../utils';
import { SHEETS, EXTRA_CHARACTERS, LOADOUTS_DATA } from '../constants';
import { Character, Pet, PlayerComposition, LoadoutItem } from '../types';

// Robust helper to find value in row
const findValue = (row: any, searchKeys: string[], isUrl = false): string | undefined => {
    const keys = Object.keys(row);
    
    // 1. Try exact or fuzzy key match
    for (const sKey of searchKeys) {
        // Exact match
        if (row[sKey]) return row[sKey];
        // Case insensitive match on key
        const foundKey = keys.find(k => k.toLowerCase().trim() === sKey.toLowerCase());
        if (foundKey && row[foundKey]) return row[foundKey];
        // Partial match on key (e.g. 'Nome do Personagem' matches 'nome')
        const partialKey = keys.find(k => k.toLowerCase().includes(sKey.toLowerCase()));
        if (partialKey && row[partialKey]) return row[partialKey];
    }
    
    const values = Object.values(row) as string[];

    // 2. URL Fallback: Find first string starting with http
    if (isUrl) {
        const urlValue = values.find(v => typeof v === 'string' && v.trim().startsWith('http'));
        if (urlValue) return urlValue;
    }

    // 3. Name Fallback: Find first non-URL string that looks like a name
    if (!isUrl) {
         // Exclude common description/type keywords if possible, but mainly look for short text
         const nameValue = values.find(v => 
            typeof v === 'string' && 
            !v.trim().startsWith('http') && 
            v.trim().length > 1 && 
            v.trim().length < 40 && // Assume names aren't super long descriptions
            !['ativo', 'passivo', 'active', 'passive'].includes(v.toLowerCase().trim())
         );
         if (nameValue) return nameValue;
    }

    return undefined;
};

const PLAYER_ROLES = ['RUSH 1', 'RUSH 2', 'BOMBA', 'SNIPER'];

const Composition: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for 4 players with default roles
  const [players, setPlayers] = useState<PlayerComposition[]>([
    { id: 1, name: '', role: 'RUSH 1', photoUrl: null, activeChar: null, pet: null, loadout: null, passiveChars: [null, null, null] },
    { id: 2, name: '', role: 'RUSH 2', photoUrl: null, activeChar: null, pet: null, loadout: null, passiveChars: [null, null, null] },
    { id: 3, name: '', role: 'BOMBA', photoUrl: null, activeChar: null, pet: null, loadout: null, passiveChars: [null, null, null] },
    { id: 4, name: '', role: 'SNIPER', photoUrl: null, activeChar: null, pet: null, loadout: null, passiveChars: [null, null, null] },
  ]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectingFor, setSelectingFor] = useState<{playerId: number, slotType: 'active' | 'passive' | 'pet' | 'loadout', slotIndex?: number} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Load Characters
      const charsData = await parseCSV(SHEETS.CHARACTERS);
      const mappedChars: Character[] = charsData.map((row: any) => {
        const typeRaw = findValue(row, ['TIPO', 'Tipo', 'Type', 'Categoria']) || '';
        const isActive = typeRaw.toLowerCase().includes('ativ');
        
        return {
            name: findValue(row, ['NOME', 'Nome', 'Name', 'Personagem', 'Character']) || 'Desconhecido',
            imageUrl: findValue(row, ['IMAGEM', 'Imagem', 'Image', 'Foto', 'Url'], true) || '',
            type: (isActive ? 'Ativo' : 'Passivo') as 'Ativo' | 'Passivo',
            ability: findValue(row, ['DESCRIÇÃO', 'Descricao', 'Descrição', 'Habilidade', 'Skill', 'Info']) || ''
        };
      }).filter(c => c.imageUrl);

      // Add extra characters manually
      mappedChars.push(...EXTRA_CHARACTERS);

      // Load Pets
      const petsData = await parseCSV(SHEETS.PETS);
      const mappedPets: Pet[] = petsData.map((row: any) => ({
        name: findValue(row, ['NOME', 'Nome', 'Name', 'Pet']) || 'Pet',
        imageUrl: findValue(row, ['IMAGEM', 'Imagem', 'Image', 'Foto', 'Url'], true) || '',
        ability: findValue(row, ['DESCRIÇÃO', 'Descricao', 'Descrição', 'Habilidade', 'Skill', 'Info']) || ''
      })).filter(p => p.imageUrl);

      setCharacters(mappedChars);
      setPets(mappedPets);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handlePhotoUpload = (playerId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, photoUrl: url } : p));
    }
  };

  const openSelection = (playerId: number, slotType: 'active' | 'passive' | 'pet' | 'loadout', slotIndex?: number) => {
    setSelectingFor({ playerId, slotType, slotIndex });
    setSearchTerm(''); 
    setModalOpen(true);
  };

  const removeSelection = (e: React.MouseEvent, playerId: number, slotType: 'active' | 'passive' | 'pet' | 'loadout', slotIndex?: number) => {
    e.stopPropagation();
    setPlayers(prev => prev.map(p => {
        if (p.id !== playerId) return p;
        if (slotType === 'active') return { ...p, activeChar: null };
        if (slotType === 'pet') return { ...p, pet: null };
        if (slotType === 'loadout') return { ...p, loadout: null };
        if (slotType === 'passive' && typeof slotIndex === 'number') {
            const newPassives = [...p.passiveChars];
            newPassives[slotIndex] = null;
            return { ...p, passiveChars: newPassives };
        }
        return p;
    }));
  };

  const updatePlayerRole = (playerId: number, newRole: string) => {
      setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, role: newRole } : p));
  };

  const selectItem = (item: Character | Pet | LoadoutItem) => {
    if (!selectingFor) return;

    setPlayers(prev => prev.map(p => {
      if (p.id !== selectingFor.playerId) return p;

      // Handle Pet Selection
      if (selectingFor.slotType === 'pet') {
        return { ...p, pet: item as Pet };
      }

      // Handle Loadout Selection
      if (selectingFor.slotType === 'loadout') {
          return { ...p, loadout: item as LoadoutItem };
      }

      // Handle Character Selection
      const char = item as Character;

      // Validation 1: Unique char per player (Active or Passive)
      const allPlayerChars = [p.activeChar, ...p.passiveChars].filter(c => c !== null);
      if (allPlayerChars.some(c => c?.name === char.name)) {
        alert("Este personagem já está equipado neste jogador.");
        return p;
      }

      // Active Slot Logic
      if (selectingFor.slotType === 'active') {
        // Validation 2: Unique active skill per team
        const isTeamActiveDuplicate = prev.some(otherPlayer => 
          otherPlayer.id !== p.id && otherPlayer.activeChar?.name === char.name
        );
        
        if (isTeamActiveDuplicate) {
          alert("Habilidade ativa já em uso por outro jogador do time.");
          return p;
        }
        
        return { ...p, activeChar: char };
      } 
      
      // Passive Slot Logic
      if (selectingFor.slotType === 'passive' && typeof selectingFor.slotIndex === 'number') {
        // Validation: Passives can be repeated across team, but not on same player (checked above)
        const newPassives = [...p.passiveChars];
        newPassives[selectingFor.slotIndex] = char;
        return { ...p, passiveChars: newPassives };
      }

      return p;
    }));
    setModalOpen(false);
  };

  // Filter list strictly based on slot type AND search term
  const getListToDisplay = () => {
    if (!selectingFor) return [];
    
    let list: (Character | Pet | LoadoutItem)[] = [];
    
    if (selectingFor.slotType === 'pet') {
        list = pets;
    } else if (selectingFor.slotType === 'loadout') {
        list = LOADOUTS_DATA;
    } else if (selectingFor.slotType === 'active') {
        list = characters.filter(c => c.type === 'Ativo');
    } else if (selectingFor.slotType === 'passive') {
        list = characters.filter(c => c.type === 'Passivo');
    }

    if (!searchTerm) return list;

    return list.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const displayList = getListToDisplay();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-brand-500 to-yellow-600 bg-clip-text text-transparent">
                Montar Squad
            </h2>
            <p className="text-gray-500 text-sm">Monte a composição perfeita com habilidades, pets e loadouts.</p>
        </div>
        <div className="flex gap-2">
            <button 
            onClick={() => {
                if(confirm('Deseja resetar toda a composição?')) {
                    setPlayers(prev => prev.map(p => ({ ...p, activeChar: null, pet: null, loadout: null, passiveChars: [null, null, null] })));
                }
            }}
            className="flex items-center gap-2 bg-gray-200 dark:bg-gray-800 hover:bg-red-100 hover:text-red-600 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl font-medium transition-colors"
            >
            <RotateCcw size={18} />
            Resetar
            </button>
            
            {/* UPDATED BUTTON */}
            <button 
            onClick={() => downloadDivAsImage('comp-builder', 'minha-squad')}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-gray-900 px-6 py-2.5 rounded-xl font-bold shadow-lg hover:shadow-brand-500/25 transition-all animate-pulse"
            >
            <ImageIcon size={20} />
            SALVAR EM PNG
            </button>
        </div>
      </div>

      <div id="comp-builder" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl">
        {players.map((player) => (
          <div 
            key={player.id} 
            className="flex flex-col gap-4 bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-brand-500/50 transition-all duration-300 relative group"
          >
            {/* Player Header */}
            <div className="flex items-center gap-4">
              <label className="relative cursor-pointer hover:scale-105 transition-transform group/avatar">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center overflow-hidden border-2 border-brand-500 shadow-md">
                  {player.photoUrl ? (
                    <img src={player.photoUrl} alt="Player" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="text-gray-400" />
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">
                    Alterar
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(player.id, e)} />
              </label>
              <div className="flex-1">
                 <input 
                    type="text" 
                    placeholder={`Jogador ${player.id}`}
                    className="bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-brand-500 outline-none w-full py-1 text-lg font-bold text-gray-800 dark:text-gray-100 placeholder-gray-400"
                    value={player.name}
                    onChange={(e) => setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, name: e.target.value } : p))}
                  />
                  {/* Role Selector */}
                  <div className="relative mt-1">
                      <select
                        value={player.role}
                        onChange={(e) => updatePlayerRole(player.id, e.target.value)}
                        className="appearance-none bg-transparent text-xs font-bold text-brand-500 uppercase outline-none cursor-pointer hover:text-brand-400 transition-colors pr-4 w-full"
                      >
                        {PLAYER_ROLES.map(role => (
                            <option key={role} value={role} className="bg-gray-800 text-white">{role}</option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-brand-500 pointer-events-none" />
                  </div>
              </div>
            </div>

            {/* Main Slots: Active, Pet, Loadout */}
            <div className="grid grid-cols-3 gap-2">
                {/* Active Slot */}
                <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-orange-500 uppercase tracking-wider truncate">
                        <Zap size={10} fill="currentColor" /> Ativa
                    </div>
                    <div 
                        onClick={() => openSelection(player.id, 'active')}
                        className={`aspect-[3/4] w-full rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden group/card ${
                            player.activeChar 
                            ? 'border-orange-500 bg-gray-900' 
                            : 'border-dashed border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-800 hover:border-orange-500 hover:bg-orange-500/5'
                        }`}
                    >
                         {player.activeChar ? (
                            <>
                                <img src={player.activeChar.imageUrl} alt={player.activeChar.name} className="w-full h-full object-cover object-top" />
                                
                                {/* Name Bar */}
                                <div className="absolute bottom-0 left-0 w-full bg-black/70 backdrop-blur-[1px] py-1 px-1 z-10">
                                    <p className="text-white text-[9px] font-bold text-center truncate">{player.activeChar.name}</p>
                                </div>

                                <button 
                                    onClick={(e) => removeSelection(e, player.id, 'active')}
                                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-red-500 z-30"
                                >
                                    <X size={10} />
                                </button>
                            </>
                         ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <Plus size={20} />
                            </div>
                         )}
                    </div>
                </div>

                {/* Pet Slot */}
                <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-green-500 uppercase tracking-wider truncate">
                        <PawPrint size={10} fill="currentColor" /> Pet
                    </div>
                    <div 
                        onClick={() => openSelection(player.id, 'pet')}
                        className={`aspect-[3/4] w-full rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden group/card ${
                            player.pet 
                            ? 'border-green-500 bg-gray-900' 
                            : 'border-dashed border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-800 hover:border-green-500 hover:bg-green-500/5'
                        }`}
                    >
                        {player.pet ? (
                            <>
                                <img src={player.pet.imageUrl} alt={player.pet.name} className="w-full h-full object-contain p-2 pb-6" />
                                
                                <div className="absolute bottom-0 left-0 w-full bg-black/70 backdrop-blur-[1px] py-1 px-1 z-10">
                                    <p className="text-white text-[9px] font-bold text-center truncate">{player.pet.name}</p>
                                </div>

                                <button 
                                    onClick={(e) => removeSelection(e, player.id, 'pet')}
                                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-red-500 z-30"
                                >
                                    <X size={10} />
                                </button>
                            </>
                         ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
                                <PawPrint size={20} />
                            </div>
                         )}
                    </div>
                </div>

                {/* Loadout Slot (New) */}
                <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-pink-500 uppercase tracking-wider truncate">
                        <Briefcase size={10} fill="currentColor" /> Item
                    </div>
                    <div 
                        onClick={() => openSelection(player.id, 'loadout')}
                        className={`aspect-[3/4] w-full rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden group/card ${
                            player.loadout 
                            ? 'border-pink-500 bg-gray-900' 
                            : 'border-dashed border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-800 hover:border-pink-500 hover:bg-pink-500/5'
                        }`}
                    >
                        {player.loadout ? (
                            <>
                                <img src={player.loadout.imageUrl} alt={player.loadout.name} className="w-full h-full object-contain p-2 pb-6" />
                                
                                <div className="absolute bottom-0 left-0 w-full bg-black/70 backdrop-blur-[1px] py-1 px-1 z-10">
                                    <p className="text-white text-[9px] font-bold text-center truncate">{player.loadout.name}</p>
                                </div>

                                <button 
                                    onClick={(e) => removeSelection(e, player.id, 'loadout')}
                                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-red-500 z-30"
                                >
                                    <X size={10} />
                                </button>
                            </>
                         ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
                                <Briefcase size={20} />
                            </div>
                         )}
                    </div>
                </div>
            </div>

            {/* Passives Slots */}
            <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-1 text-xs font-bold text-blue-500 uppercase tracking-wider">
                    <Shield size={12} fill="currentColor" /> Passivas
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {player.passiveChars.map((char, idx) => (
                        <div 
                            key={idx}
                            onClick={() => openSelection(player.id, 'passive', idx)}
                            className={`aspect-square rounded-lg border transition-all cursor-pointer relative overflow-hidden group/card ${
                                char 
                                ? 'border-blue-500 bg-gray-900' 
                                : 'border-dashed border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-800 hover:border-blue-500'
                            }`}
                        >
                             {char ? (
                                <>
                                    <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover object-top" />
                                    
                                    {/* Name Bar - Always Visible */}
                                    <div className="absolute bottom-0 left-0 w-full bg-black/70 backdrop-blur-[1px] py-0.5 px-0.5 z-10">
                                        <p className="text-white text-[8px] font-bold text-center truncate">{char.name}</p>
                                    </div>

                                    {/* Tooltip for Passive */}
                                    <div className="absolute inset-0 bg-black/90 opacity-0 group-hover/card:opacity-100 transition-opacity flex flex-col items-center justify-center p-1 text-center z-20">
                                        <p className="text-white text-[10px] font-bold line-clamp-1">{char.name}</p>
                                        <p className="text-[8px] text-gray-300 line-clamp-3 leading-tight">{char.ability}</p>
                                    </div>
                                    <button 
                                        onClick={(e) => removeSelection(e, player.id, 'passive', idx)}
                                        className="absolute top-0 right-0 bg-black/50 text-white rounded-bl-lg p-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-red-500 z-30"
                                    >
                                        <X size={10} />
                                    </button>
                                </>
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                    <Plus size={16} className="text-gray-400" />
                                </div>
                              )}
                        </div>
                    ))}
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selection Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 w-full max-w-6xl h-[85vh] rounded-2xl flex flex-col overflow-hidden border border-gray-700 shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 dark:bg-gray-900">
              <div className="flex-1">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    {selectingFor?.slotType === 'active' && <><Zap className="text-orange-500" /> Selecionar Habilidade Ativa</>}
                    {selectingFor?.slotType === 'passive' && <><Shield className="text-blue-500" /> Selecionar Habilidade Passiva</>}
                    {selectingFor?.slotType === 'pet' && <><PawPrint className="text-green-500" /> Selecionar Pet</>}
                    {selectingFor?.slotType === 'loadout' && <><Briefcase className="text-pink-500" /> Selecionar Carregamento</>}
                  </h3>
                  <p className="text-sm text-gray-500">
                      {selectingFor?.slotType === 'active' ? 'Escolha uma habilidade ativa única.' : 
                       selectingFor?.slotType === 'pet' ? 'Escolha um companheiro.' : 
                       selectingFor?.slotType === 'loadout' ? 'Escolha um item de carregamento.' :
                       'Escolha habilidades passivas.'}
                  </p>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                 {/* Search Input */}
                 <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar por nome..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-500 transition-colors"
                        autoFocus
                    />
                 </div>
                 
                 <button 
                    onClick={() => setModalOpen(false)}
                    className="p-2 hover:bg-red-100 hover:text-red-500 rounded-full transition-colors"
                 >
                    <X />
                 </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-black/20">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500 mb-2"></div>
                    <p>Carregando dados das planilhas...</p>
                </div>
              ) : displayList.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-gray-500">
                     <Info size={40} className="mb-2 opacity-50" />
                     <p>Nenhum resultado encontrado.</p>
                     <p className="text-sm">Tente buscar por outro nome ou verifique os filtros.</p>
                 </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {displayList.map((item, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => selectItem(item as any)}
                      className={`group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border-2 transition-all hover:scale-105 shadow-sm hover:shadow-xl bg-gray-800 flex flex-col ${
                          selectingFor?.slotType === 'active' ? 'border-orange-500/30 hover:border-orange-500' :
                          selectingFor?.slotType === 'pet' ? 'border-green-500/30 hover:border-green-500' :
                          selectingFor?.slotType === 'loadout' ? 'border-pink-500/30 hover:border-pink-500' :
                          'border-blue-500/30 hover:border-blue-500'
                      }`}
                    >
                      <div className="flex-1 relative overflow-hidden bg-gray-900">
                         <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            // Changed to object-top to show faces of characters
                            className={`w-full h-full ${selectingFor?.slotType === 'pet' || selectingFor?.slotType === 'loadout' ? 'object-contain p-2' : 'object-cover object-top'}`} 
                            loading="lazy"
                         />
                         {/* Description Overlay on Hover */}
                         <div className="absolute inset-0 bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-center text-center overflow-y-auto">
                            <p className="text-white text-xs font-bold mb-1">{item.name}</p>
                            {'ability' in item && (
                                <p className="text-[10px] text-gray-300 leading-relaxed">{item.ability || 'Sem descrição'}</p>
                            )}
                         </div>
                      </div>
                      
                      <div className={`py-2 px-1 text-center ${
                          selectingFor?.slotType === 'active' ? 'bg-orange-900/80 text-orange-100' :
                          selectingFor?.slotType === 'pet' ? 'bg-green-900/80 text-green-100' :
                          selectingFor?.slotType === 'loadout' ? 'bg-pink-900/80 text-pink-100' :
                          'bg-blue-900/80 text-blue-100'
                      }`}>
                        <p className="text-[10px] sm:text-xs font-bold truncate px-1" title={item.name}>{item.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Composition;
