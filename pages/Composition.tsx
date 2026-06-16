
import React, { useState, useEffect } from 'react';
import { Camera, Plus, Trash2, Download, PawPrint, Zap, Shield, Info, RotateCcw, X, Search, Image as ImageIcon, Briefcase, ChevronDown, Users } from 'lucide-react';
import { parseCSV, downloadDivAsImage, findValue } from '../utils';
import { SHEETS, EXTRA_CHARACTERS, LOADOUTS_DATA } from '../constants';
import { Character, Pet, PlayerComposition, LoadoutItem } from '../types';

// Robust helper to find value in row
// Removed local definition as it is now in utils.ts


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
    <div className="min-h-screen bg-graphite-900 text-premium-text animate-fade-in">
      {/* Header Section */}
      <div className="bg-graphite-800 border-b border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-4xl font-display font-bold text-loud-500 italic tracking-tighter">Composição de Equipe</h2>
            <p className="text-premium-muted mt-2">Monte sua estratégia perfeita combinando personagens e pets.</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => {
                if(confirm('Deseja resetar toda a composição?')) {
                    setPlayers(prev => prev.map(p => ({ ...p, activeChar: null, pet: null, loadout: null, passiveChars: [null, null, null] })));
                }
              }}
              className="flex items-center gap-2 px-6 py-3 bg-graphite-700 hover:bg-graphite-600 text-white rounded-full transition-all font-bold text-sm uppercase tracking-wider"
            >
              <RotateCcw size={18} /> Resetar
            </button>
            <button 
              onClick={() => downloadDivAsImage('comp-builder', 'minha-squad')}
              className="btn-loud flex items-center gap-2"
            >
              <ImageIcon size={18} /> SALVAR EM PNG
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-12 px-6">
        <div id="comp-builder" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 p-8 bg-graphite-800 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
            <Users size={200} className="text-loud-500" />
          </div>
          {players.map((player) => (
            <div 
              key={player.id} 
              className="flex flex-col gap-6 bg-graphite-900/50 backdrop-blur-sm p-6 rounded-3xl border border-white/5 hover:border-loud-500/30 transition-all duration-300 relative group"
            >
              {/* Player Header */}
              <div className="flex items-center gap-4">
                <label className="relative cursor-pointer hover:scale-105 transition-transform group/avatar">
                  <div className="w-16 h-16 rounded-2xl bg-graphite-800 flex items-center justify-center overflow-hidden border-2 border-loud-500 shadow-lg">
                    {player.photoUrl ? (
                      <img src={player.photoUrl} alt="Player" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="text-premium-muted opacity-40" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold uppercase">
                      Alterar
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(player.id, e)} />
                </label>
                <div className="flex-1">
                   <input 
                      type="text" 
                      placeholder={`Jogador ${player.id}`}
                      className="bg-transparent border-b border-white/10 focus:border-loud-500 outline-none w-full py-1 text-lg font-display font-bold text-white placeholder-white/20 uppercase italic tracking-tighter"
                      value={player.name}
                      onChange={(e) => setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, name: e.target.value } : p))}
                    />
                    {/* Role Selector */}
                    <div className="relative mt-1">
                        <select
                          value={player.role}
                          onChange={(e) => updatePlayerRole(player.id, e.target.value)}
                          className="appearance-none bg-transparent text-[10px] font-black text-loud-500 uppercase outline-none cursor-pointer hover:text-loud-400 transition-colors pr-4 w-full italic tracking-widest"
                        >
                          {PLAYER_ROLES.map(role => (
                              <option key={role} value={role} className="bg-graphite-800 text-white">{role}</option>
                          ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-loud-500 pointer-events-none" />
                    </div>
                </div>
              </div>

              {/* Main Slots: Active, Pet, Loadout */}
              <div className="grid grid-cols-3 gap-3">
                  {/* Active Slot */}
                  <div className="space-y-2">
                      <div className="flex items-center gap-1 text-[9px] font-black text-loud-500 uppercase tracking-widest opacity-60 truncate">
                          <Zap size={10} fill="currentColor" /> Ativa
                      </div>
                      <div 
                          onClick={() => openSelection(player.id, 'active')}
                          className={`aspect-[3/4] w-full rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden group/card ${
                              player.activeChar 
                              ? 'border-loud-500 bg-graphite-900 shadow-[0_0_15px_rgba(58,255,0,0.2)]' 
                              : 'border-dashed border-white/10 bg-graphite-800/50 hover:border-loud-500/50 hover:bg-loud-500/5'
                          }`}
                      >
                           {player.activeChar ? (
                              <>
                                  <img 
                                      src={player.activeChar.imageUrl} 
                                      alt={player.activeChar.name} 
                                      className="w-full h-full object-cover object-top group-hover/card:scale-110 transition-transform duration-500" 
                                      crossOrigin="anonymous" 
                                  />
                                  
                                  {/* Name Bar */}
                                  <div className="absolute bottom-0 left-0 w-full bg-graphite-900/90 py-1 px-1 z-10 border-t border-white/5">
                                      <p className="text-white text-[8px] font-black text-center truncate uppercase italic">{player.activeChar.name}</p>
                                  </div>

                                  <button 
                                      onClick={(e) => removeSelection(e, player.id, 'active')}
                                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-red-500 z-30"
                                  >
                                      <X size={10} />
                                  </button>
                              </>
                           ) : (
                              <div className="flex flex-col items-center justify-center h-full text-premium-muted opacity-20 group-hover/card:opacity-100 transition-opacity">
                                  <Plus size={20} />
                              </div>
                           )}
                      </div>
                  </div>

                  {/* Pet Slot */}
                  <div className="space-y-2">
                      <div className="flex items-center gap-1 text-[9px] font-black text-loud-500 uppercase tracking-widest opacity-60 truncate">
                          <PawPrint size={10} fill="currentColor" /> Pet
                      </div>
                      <div 
                          onClick={() => openSelection(player.id, 'pet')}
                          className={`aspect-[3/4] w-full rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden group/card ${
                              player.pet 
                              ? 'border-loud-500 bg-graphite-900 shadow-[0_0_15px_rgba(58,255,0,0.2)]' 
                              : 'border-dashed border-white/10 bg-graphite-800/50 hover:border-loud-500/50 hover:bg-loud-500/5'
                          }`}
                      >
                          {player.pet ? (
                              <>
                                  <img 
                                      src={player.pet.imageUrl} 
                                      alt={player.pet.name} 
                                      className="w-full h-full object-contain p-2 pb-6 group-hover/card:scale-110 transition-transform duration-500" 
                                      crossOrigin="anonymous" 
                                  />
                                  
                                  <div className="absolute bottom-0 left-0 w-full bg-graphite-900/90 py-1 px-1 z-10 border-t border-white/5">
                                      <p className="text-white text-[8px] font-black text-center truncate uppercase italic">{player.pet.name}</p>
                                  </div>

                                  <button 
                                      onClick={(e) => removeSelection(e, player.id, 'pet')}
                                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-red-500 z-30"
                                  >
                                      <X size={10} />
                                  </button>
                              </>
                           ) : (
                              <div className="flex flex-col items-center justify-center h-full text-premium-muted opacity-20 group-hover/card:opacity-100 transition-opacity">
                                  <PawPrint size={20} />
                              </div>
                           )}
                      </div>
                  </div>

                  {/* Loadout Slot */}
                  <div className="space-y-2">
                      <div className="flex items-center gap-1 text-[9px] font-black text-loud-500 uppercase tracking-widest opacity-60 truncate">
                          <Briefcase size={10} fill="currentColor" /> Item
                      </div>
                      <div 
                          onClick={() => openSelection(player.id, 'loadout')}
                          className={`aspect-[3/4] w-full rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden group/card ${
                              player.loadout 
                              ? 'border-loud-500 bg-graphite-900 shadow-[0_0_15px_rgba(58,255,0,0.2)]' 
                              : 'border-dashed border-white/10 bg-graphite-800/50 hover:border-loud-500/50 hover:bg-loud-500/5'
                          }`}
                      >
                          {player.loadout ? (
                              <>
                                  <img 
                                      src={player.loadout.imageUrl} 
                                      alt={player.loadout.name} 
                                      className="w-full h-full object-contain p-2 pb-6 group-hover/card:scale-110 transition-transform duration-500" 
                                      crossOrigin="anonymous" 
                                  />
                                  
                                  <div className="absolute bottom-0 left-0 w-full bg-graphite-900/90 py-1 px-1 z-10 border-t border-white/5">
                                      <p className="text-white text-[8px] font-black text-center truncate uppercase italic">{player.loadout.name}</p>
                                  </div>

                                  <button 
                                      onClick={(e) => removeSelection(e, player.id, 'loadout')}
                                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-red-500 z-30"
                                  >
                                      <X size={10} />
                                  </button>
                              </>
                           ) : (
                              <div className="flex flex-col items-center justify-center h-full text-premium-muted opacity-20 group-hover/card:opacity-100 transition-opacity">
                                  <Briefcase size={20} />
                              </div>
                           )}
                      </div>
                  </div>
              </div>

              {/* Passives Slots */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-1 text-[9px] font-black text-loud-500 uppercase tracking-widest opacity-60">
                      <Shield size={12} fill="currentColor" /> Passivas
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                      {player.passiveChars.map((char, idx) => (
                          <div 
                              key={idx}
                              onClick={() => openSelection(player.id, 'passive', idx)}
                              className={`aspect-square rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden group/card ${
                                  char 
                                  ? 'border-loud-500/50 bg-graphite-900 shadow-lg' 
                                  : 'border-dashed border-white/10 bg-graphite-800/50 hover:border-loud-500/50'
                              }`}
                          >
                               {char ? (
                                  <>
                                      <img 
                                          src={char.imageUrl} 
                                          alt={char.name} 
                                          className="w-full h-full object-cover object-top group-hover/card:scale-110 transition-transform duration-500" 
                                          crossOrigin="anonymous" 
                                      />
                                      
                                      {/* Name Bar - Always Visible */}
                                      <div className="absolute bottom-0 left-0 w-full bg-graphite-900/90 py-0.5 px-0.5 z-10 border-t border-white/5">
                                          <p className="text-white text-[7px] font-black text-center truncate uppercase italic">{char.name}</p>
                                      </div>
  
                                      {/* Tooltip for Passive */}
                                      <div className="absolute inset-0 bg-graphite-900/95 opacity-0 group-hover/card:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center z-20">
                                          <p className="text-loud-500 text-[8px] font-black uppercase italic mb-1">{char.name}</p>
                                          <p className="text-[7px] text-premium-muted line-clamp-4 leading-tight">{char.ability}</p>
                                      </div>
                                      <button 
                                          onClick={(e) => removeSelection(e, player.id, 'passive', idx)}
                                          className="absolute top-0 right-0 bg-black/50 text-white rounded-bl-lg p-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-red-500 z-30"
                                      >
                                          <X size={10} />
                                      </button>
                                  </>
                                ) : (
                                  <div className="flex items-center justify-center h-full text-premium-muted opacity-20 group-hover/card:opacity-100 transition-opacity">
                                      <Plus size={16} />
                                  </div>
                                )}
                          </div>
                      ))}
                  </div>
              </div>
            </div>
          ))}
      </div>
    </div>

      {/* Selection Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-graphite-900/95 backdrop-blur-xl p-4 animate-fade-in">
          <div className="bg-graphite-800 border-2 border-loud-500/30 rounded-[2.5rem] w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-graphite-900/50">
              <div className="flex-1">
                  <h3 className="text-3xl font-display font-bold text-white italic tracking-tighter uppercase flex items-center gap-3">
                    {selectingFor?.slotType === 'active' && <><Zap className="text-loud-500" /> Selecionar Habilidade Ativa</>}
                    {selectingFor?.slotType === 'passive' && <><Shield className="text-loud-500" /> Selecionar Habilidade Passiva</>}
                    {selectingFor?.slotType === 'pet' && <><PawPrint className="text-loud-500" /> Selecionar Pet</>}
                    {selectingFor?.slotType === 'loadout' && <><Briefcase className="text-loud-500" /> Selecionar Carregamento</>}
                  </h3>
                  <p className="text-loud-500 text-xs font-black uppercase tracking-widest mt-1">
                      {selectingFor?.slotType === 'active' ? 'Escolha uma habilidade ativa única estratégica.' : 
                       selectingFor?.slotType === 'pet' ? 'Escolha um companheiro de batalha.' : 
                       selectingFor?.slotType === 'loadout' ? 'Escolha um item de suporte tático.' :
                       'Escolha habilidades passivas complementares.'}
                  </p>
              </div>
              
              <div className="flex items-center gap-4 w-full md:w-auto">
                 {/* Search Input */}
                 <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-loud-500" size={20} />
                    <input 
                        type="text" 
                        placeholder="Buscar por nome..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-graphite-900 border border-white/10 rounded-full py-3 pl-12 pr-6 text-sm font-bold text-white focus:outline-none focus:border-loud-500 transition-all italic"
                        autoFocus
                    />
                 </div>
                 
                 <button 
                    onClick={() => setModalOpen(false)}
                    className="p-3 hover:bg-graphite-700 rounded-full transition-all hover:rotate-90 text-premium-muted hover:text-white"
                 >
                    <X size={28} />
                 </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-graphite-900/20">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-premium-muted">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-loud-500 mb-4"></div>
                    <p className="font-bold uppercase tracking-widest text-xs">Sincronizando Dados...</p>
                </div>
              ) : displayList.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-premium-muted">
                     <Info size={60} className="mb-4 opacity-20" />
                     <p className="text-xl font-bold uppercase italic tracking-tighter">Nenhum resultado encontrado</p>
                     <p className="text-xs uppercase tracking-widest mt-2 opacity-60">Tente buscar por outro termo ou categoria</p>
                 </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-6">
                  {displayList.map((item, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => selectItem(item as any)}
                      className={`group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer border-2 transition-all hover:scale-105 shadow-xl bg-graphite-800 flex flex-col ${
                          selectingFor?.slotType === 'active' ? 'border-loud-500/30 hover:border-loud-500' :
                          selectingFor?.slotType === 'pet' ? 'border-loud-500/30 hover:border-loud-500' :
                          selectingFor?.slotType === 'loadout' ? 'border-loud-500/30 hover:border-loud-500' :
                          'border-loud-500/30 hover:border-loud-500'
                      }`}
                    >
                      <div className="flex-1 relative overflow-hidden bg-graphite-900">
                         <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className={`w-full h-full group-hover:scale-110 transition-transform duration-500 ${selectingFor?.slotType === 'pet' || selectingFor?.slotType === 'loadout' ? 'object-contain p-4' : 'object-cover object-top'}`} 
                            loading="lazy"
                         />
                         {/* Description Overlay on Hover */}
                         <div className="absolute inset-0 bg-graphite-900/95 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-center text-center overflow-y-auto">
                            <p className="text-loud-500 text-xs font-black uppercase italic mb-2">{item.name}</p>
                            {'ability' in item && (
                                <p className="text-[9px] text-premium-muted leading-relaxed italic">{item.ability || 'Sem descrição tática'}</p>
                            )}
                         </div>
                      </div>
                      
                      <div className="py-2.5 px-1 text-center bg-graphite-900/90 border-t border-white/5">
                        <p className="text-[10px] font-black truncate px-1 uppercase italic text-white" title={item.name}>{item.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 bg-graphite-900/50 border-t border-white/5 flex justify-end">
              <button 
                onClick={() => setModalOpen(false)}
                className="px-10 py-4 bg-graphite-700 hover:bg-graphite-600 text-white rounded-full transition-all font-bold text-xs uppercase tracking-widest italic"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Composition;
