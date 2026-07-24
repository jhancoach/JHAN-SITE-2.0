import React, { useState, useEffect } from 'react';
import { Camera, Plus, Trash2, Download, PawPrint, Zap, Shield, Info, RotateCcw, X, Search, Image as ImageIcon, Briefcase, ChevronDown, Users } from 'lucide-react';
import { parseCSV, downloadDivAsImage, findValue } from '../utils';
import { SHEETS, EXTRA_CHARACTERS, LOADOUTS_DATA } from '../constants';
import { Character, Pet, PlayerComposition, LoadoutItem } from '../types';

const PLAYER_ROLES = ['RUSH 1', 'RUSH 2', 'BOMBA', 'SNIPER'];

const Composition: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for 4 players with default roles and 4 skill slots each
  const [players, setPlayers] = useState<PlayerComposition[]>([
    { id: 1, name: '', role: 'RUSH 1', photoUrl: null, pet: null, loadout: null, skills: [null, null, null, null] },
    { id: 2, name: '', role: 'RUSH 2', photoUrl: null, pet: null, loadout: null, skills: [null, null, null, null] },
    { id: 3, name: '', role: 'BOMBA', photoUrl: null, pet: null, loadout: null, skills: [null, null, null, null] },
    { id: 4, name: '', role: 'SNIPER', photoUrl: null, pet: null, loadout: null, skills: [null, null, null, null] },
  ]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectingFor, setSelectingFor] = useState<{
    playerId: number;
    slotType: 'skill' | 'pet' | 'loadout';
    slotIndex?: number;
  } | null>(null);
  const [skillTypeFilter, setSkillTypeFilter] = useState<'todas' | 'ativo' | 'passivo'>('todas');
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

  const openSelection = (playerId: number, slotType: 'skill' | 'pet' | 'loadout', slotIndex?: number) => {
    setSelectingFor({ playerId, slotType, slotIndex });
    setSearchTerm('');
    setSkillTypeFilter('todas');
    setModalOpen(true);
  };

  const removeSelection = (e: React.MouseEvent, playerId: number, slotType: 'skill' | 'pet' | 'loadout', slotIndex?: number) => {
    e.stopPropagation();
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      if (slotType === 'pet') return { ...p, pet: null };
      if (slotType === 'loadout') return { ...p, loadout: null };
      if (slotType === 'skill' && typeof slotIndex === 'number') {
        const newSkills = [...p.skills];
        newSkills[slotIndex] = null;
        return { ...p, skills: newSkills };
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

      // Handle Skill Selection
      if (selectingFor.slotType === 'skill' && typeof selectingFor.slotIndex === 'number') {
        const char = item as Character;
        const targetIdx = selectingFor.slotIndex;

        // Validation 1: Unique character per player
        const alreadyEquippedIndex = p.skills.findIndex((s, idx) => idx !== targetIdx && s?.name === char.name);
        if (alreadyEquippedIndex !== -1) {
          alert("Este personagem já está equipado neste jogador.");
          return p;
        }

        // Validation 2: Maximum 1 Active skill per player
        if (char.type === 'Ativo') {
          const activeCount = p.skills.filter((s, idx) => idx !== targetIdx && s?.type === 'Ativo').length;
          if (activeCount >= 1) {
            alert("Cada jogador só pode utilizar no máximo 1 habilidade ativa.");
            return p;
          }
        }

        const newSkills = [...p.skills];
        newSkills[targetIdx] = char;
        return { ...p, skills: newSkills };
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
    } else if (selectingFor.slotType === 'skill') {
      if (skillTypeFilter === 'ativo') {
        list = characters.filter(c => c.type === 'Ativo');
      } else if (skillTypeFilter === 'passivo') {
        list = characters.filter(c => c.type === 'Passivo');
      } else {
        list = characters;
      }
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
            <p className="text-premium-muted mt-2">Monte sua estratégia perfeita combinando habilidades (máx. 1 ativa por jogador), pets e itens.</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => {
                if(confirm('Deseja resetar toda a composição?')) {
                  setPlayers(prev => prev.map(p => ({ ...p, skills: [null, null, null, null], pet: null, loadout: null })));
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
              className="flex flex-col gap-5 bg-graphite-900/50 backdrop-blur-sm p-5 rounded-3xl border border-white/5 hover:border-loud-500/30 transition-all duration-300 relative group"
            >
              {/* Player Header */}
              <div className="flex items-center gap-4">
                <label className="relative cursor-pointer hover:scale-105 transition-transform group/avatar shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-graphite-800 flex items-center justify-center overflow-hidden border-2 border-loud-500 shadow-lg">
                    {player.photoUrl ? (
                      <img src={player.photoUrl} alt="Player" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="text-premium-muted opacity-40" size={20} />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold uppercase">
                    Alterar
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(player.id, e)} />
                </label>
                <div className="flex-1 min-w-0">
                  <input 
                    type="text" 
                    placeholder={`Jogador ${player.id}`}
                    className="bg-transparent border-b border-white/10 focus:border-loud-500 outline-none w-full py-0.5 text-base font-display font-bold text-white placeholder-white/20 uppercase italic tracking-tighter truncate"
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

              {/* Habilidades Section (4 Skill Slots) */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between text-[9px] font-black text-loud-500 uppercase tracking-widest opacity-80">
                  <span className="flex items-center gap-1">
                    <Zap size={11} fill="currentColor" /> Habilidades
                  </span>
                  <span className="text-[8px] text-premium-muted font-normal lowercase italic">máx. 1 ativa</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {player.skills.map((char, idx) => (
                    <div 
                      key={idx}
                      onClick={() => openSelection(player.id, 'skill', idx)}
                      className={`aspect-[3/4] rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden group/card ${
                        char 
                          ? char.type === 'Ativo'
                            ? 'border-loud-500 bg-graphite-900 shadow-[0_0_12px_rgba(58,255,0,0.2)]' 
                            : 'border-blue-500/60 bg-graphite-900 shadow-md'
                          : 'border-dashed border-white/10 bg-graphite-800/50 hover:border-loud-500/50 hover:bg-loud-500/5'
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
                          
                          {/* Type Badge */}
                          <div className="absolute top-1 left-1 z-10">
                            {char.type === 'Ativo' ? (
                              <span className="bg-loud-500 text-black text-[7px] font-black px-1 py-0.2 rounded uppercase italic shadow flex items-center gap-0.5">
                                <Zap size={7} fill="currentColor" />
                              </span>
                            ) : (
                              <span className="bg-blue-600 text-white text-[7px] font-black px-1 py-0.2 rounded uppercase italic shadow flex items-center gap-0.5">
                                <Shield size={7} fill="currentColor" />
                              </span>
                            )}
                          </div>

                          {/* Name Bar */}
                          <div className="absolute bottom-0 left-0 w-full bg-graphite-900/90 py-0.5 px-0.5 z-10 border-t border-white/5">
                            <p className="text-white text-[7px] font-black text-center truncate uppercase italic">{char.name}</p>
                          </div>

                          {/* Tooltip on Hover */}
                          <div className="absolute inset-0 bg-graphite-900/95 opacity-0 group-hover/card:opacity-100 transition-opacity flex flex-col items-center justify-center p-1.5 text-center z-20">
                            <p className="text-loud-500 text-[8px] font-black uppercase italic mb-1 flex items-center gap-1">
                              {char.name}
                              <span className="text-[6px] text-white/60">({char.type})</span>
                            </p>
                            <p className="text-[7px] text-premium-muted line-clamp-4 leading-tight">{char.ability}</p>
                          </div>

                          <button 
                            onClick={(e) => removeSelection(e, player.id, 'skill', idx)}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-red-500 z-30"
                          >
                            <X size={9} />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-premium-muted opacity-30 group-hover/card:opacity-100 transition-opacity">
                          <Plus size={14} />
                          <span className="text-[6px] font-bold mt-0.5 uppercase">Hab. {idx + 1}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Suporte Section: Pet and Loadout */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="text-[9px] font-black text-loud-500 uppercase tracking-widest opacity-80 flex items-center gap-1">
                  <Briefcase size={10} fill="currentColor" /> Suporte
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Pet Slot */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[8px] font-bold text-premium-muted uppercase tracking-wider">
                      <PawPrint size={9} fill="currentColor" /> Pet
                    </div>
                    <div 
                      onClick={() => openSelection(player.id, 'pet')}
                      className={`aspect-[3/4] w-full rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden group/card ${
                        player.pet 
                          ? 'border-loud-500 bg-graphite-900 shadow-[0_0_12px_rgba(58,255,0,0.2)]' 
                          : 'border-dashed border-white/10 bg-graphite-800/50 hover:border-loud-500/50 hover:bg-loud-500/5'
                      }`}
                    >
                      {player.pet ? (
                        <>
                          <img 
                            src={player.pet.imageUrl} 
                            alt={player.pet.name} 
                            className="w-full h-full object-contain p-2 pb-5 group-hover/card:scale-110 transition-transform duration-500" 
                            crossOrigin="anonymous" 
                          />
                          <div className="absolute bottom-0 left-0 w-full bg-graphite-900/90 py-0.5 px-0.5 z-10 border-t border-white/5">
                            <p className="text-white text-[7px] font-black text-center truncate uppercase italic">{player.pet.name}</p>
                          </div>
                          <button 
                            onClick={(e) => removeSelection(e, player.id, 'pet')}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-red-500 z-30"
                          >
                            <X size={9} />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-premium-muted opacity-30 group-hover/card:opacity-100 transition-opacity">
                          <PawPrint size={16} />
                          <span className="text-[7px] font-bold mt-0.5 uppercase">Pet</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Loadout Item Slot */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[8px] font-bold text-premium-muted uppercase tracking-wider">
                      <Briefcase size={9} fill="currentColor" /> Item
                    </div>
                    <div 
                      onClick={() => openSelection(player.id, 'loadout')}
                      className={`aspect-[3/4] w-full rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden group/card ${
                        player.loadout 
                          ? 'border-loud-500 bg-graphite-900 shadow-[0_0_12px_rgba(58,255,0,0.2)]' 
                          : 'border-dashed border-white/10 bg-graphite-800/50 hover:border-loud-500/50 hover:bg-loud-500/5'
                      }`}
                    >
                      {player.loadout ? (
                        <>
                          <img 
                            src={player.loadout.imageUrl} 
                            alt={player.loadout.name} 
                            className="w-full h-full object-contain p-2 pb-5 group-hover/card:scale-110 transition-transform duration-500" 
                            crossOrigin="anonymous" 
                          />
                          <div className="absolute bottom-0 left-0 w-full bg-graphite-900/90 py-0.5 px-0.5 z-10 border-t border-white/5">
                            <p className="text-white text-[7px] font-black text-center truncate uppercase italic">{player.loadout.name}</p>
                          </div>
                          <button 
                            onClick={(e) => removeSelection(e, player.id, 'loadout')}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-red-500 z-30"
                          >
                            <X size={9} />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-premium-muted opacity-30 group-hover/card:opacity-100 transition-opacity">
                          <Briefcase size={16} />
                          <span className="text-[7px] font-bold mt-0.5 uppercase">Item</span>
                        </div>
                      )}
                    </div>
                  </div>
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
                  {selectingFor?.slotType === 'skill' && <><Zap className="text-loud-500" /> Selecionar Habilidade</>}
                  {selectingFor?.slotType === 'pet' && <><PawPrint className="text-loud-500" /> Selecionar Pet</>}
                  {selectingFor?.slotType === 'loadout' && <><Briefcase className="text-loud-500" /> Selecionar Carregamento</>}
                </h3>
                <p className="text-loud-500 text-xs font-black uppercase tracking-widest mt-1">
                  {selectingFor?.slotType === 'skill' ? 'Escolha uma habilidade ativa ou passiva (máximo 1 ativa por jogador).' : 
                   selectingFor?.slotType === 'pet' ? 'Escolha um companheiro de batalha.' : 
                   'Escolha um item de suporte tático.'}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                {/* Skill Type Filter Tabs if selecting a skill */}
                {selectingFor?.slotType === 'skill' && (
                  <div className="flex bg-graphite-900 border border-white/10 rounded-full p-1 text-xs font-bold uppercase">
                    <button
                      onClick={() => setSkillTypeFilter('todas')}
                      className={`px-4 py-1.5 rounded-full transition-colors ${skillTypeFilter === 'todas' ? 'bg-loud-500 text-black font-black' : 'text-premium-muted hover:text-white'}`}
                    >
                      Todas
                    </button>
                    <button
                      onClick={() => setSkillTypeFilter('ativo')}
                      className={`px-4 py-1.5 rounded-full transition-colors ${skillTypeFilter === 'ativo' ? 'bg-loud-500 text-black font-black' : 'text-premium-muted hover:text-white'}`}
                    >
                      Ativas
                    </button>
                    <button
                      onClick={() => setSkillTypeFilter('passivo')}
                      className={`px-4 py-1.5 rounded-full transition-colors ${skillTypeFilter === 'passivo' ? 'bg-loud-500 text-black font-black' : 'text-premium-muted hover:text-white'}`}
                    >
                      Passivas
                    </button>
                  </div>
                )}

                {/* Search Input */}
                <div className="relative w-full md:w-70">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-loud-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="Buscar por nome..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-graphite-900 border border-white/10 rounded-full py-2.5 pl-11 pr-5 text-sm font-bold text-white focus:outline-none focus:border-loud-500 transition-all italic"
                    autoFocus
                  />
                </div>
                
                <button 
                  onClick={() => setModalOpen(false)}
                  className="p-3 hover:bg-graphite-700 rounded-full transition-all hover:rotate-90 text-premium-muted hover:text-white"
                >
                  <X size={26} />
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
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-5">
                  {displayList.map((item, idx) => {
                    const charItem = item as Character;
                    return (
                      <div 
                        key={idx} 
                        onClick={() => selectItem(item as any)}
                        className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer border-2 transition-all hover:scale-105 shadow-xl bg-graphite-800 flex flex-col border-loud-500/30 hover:border-loud-500"
                      >
                        <div className="flex-1 relative overflow-hidden bg-graphite-900">
                          <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className={`w-full h-full group-hover:scale-110 transition-transform duration-500 ${selectingFor?.slotType === 'pet' || selectingFor?.slotType === 'loadout' ? 'object-contain p-3' : 'object-cover object-top'}`} 
                            loading="lazy"
                          />

                          {/* Skill Type Badge in Modal */}
                          {selectingFor?.slotType === 'skill' && charItem.type && (
                            <div className="absolute top-1.5 left-1.5 z-10">
                              {charItem.type === 'Ativo' ? (
                                <span className="bg-loud-500 text-black font-black text-[8px] px-1.5 py-0.5 rounded-md uppercase italic shadow flex items-center gap-0.5">
                                  <Zap size={8} fill="currentColor" /> Ativa
                                </span>
                              ) : (
                                <span className="bg-blue-600 text-white font-black text-[8px] px-1.5 py-0.5 rounded-md uppercase italic shadow flex items-center gap-0.5">
                                  <Shield size={8} fill="currentColor" /> Passiva
                                </span>
                              )}
                            </div>
                          )}

                          {/* Description Overlay on Hover */}
                          <div className="absolute inset-0 bg-graphite-900/95 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-center text-center overflow-y-auto z-20">
                            <p className="text-loud-500 text-xs font-black uppercase italic mb-1">{item.name}</p>
                            {'ability' in item && (
                              <p className="text-[9px] text-premium-muted leading-relaxed italic">{item.ability || 'Sem descrição tática'}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="py-2 px-1 text-center bg-graphite-900/90 border-t border-white/5">
                          <p className="text-[10px] font-black truncate px-1 uppercase italic text-white" title={item.name}>{item.name}</p>
                        </div>
                      </div>
                    );
                  })}
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
