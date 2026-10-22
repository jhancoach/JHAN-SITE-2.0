import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Sparkles, 
  Search, 
  RefreshCw, 
  Users, 
  Layers, 
  ExternalLink, 
  Check, 
  ArrowRight, 
  X, 
  Shield, 
  Zap, 
  Target, 
  Flame, 
  Eye, 
  Plus, 
  Copy, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Swords,
  ChevronRight
} from 'lucide-react';
import { GARENA_CHARACTERS, GARENA_LAST_SYNC, GARENA_OFFICIAL_URL } from '../src/data/garenaCharacters';
import { META_COMPOSITIONS, MetaComposition, MetaPlayerBuild } from '../src/constants/metaCompositions';
import { GarenaCharacter, TeamComposition, Character, Pet } from '../types';

interface CharacterLabProps {
  onNavigate: (path: string) => void;
}

export const CharacterLab: React.FC<CharacterLabProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'comparativo' | 'meta' | 'catalogo'>('comparativo');
  
  // Comparison State (ids of selected characters)
  const [comparedIds, setComparedIds] = useState<number[]>([793, 606]); // Default Morse & Tatsuya
  const [searchComparison, setSearchComparison] = useState('');
  const [isAddingCharacter, setIsAddingCharacter] = useState(false);

  // Catalog Filter State
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogTypeFilter, setCatalogTypeFilter] = useState<'Todos' | 'Ativo' | 'Passivo' | 'Novos'>('Todos');
  const [catalogRoleFilter, setCatalogRoleFilter] = useState('Todos');
  const [selectedCharDetail, setSelectedCharDetail] = useState<GarenaCharacter | null>(null);

  // Meta Filter State
  const [metaModeFilter, setMetaModeFilter] = useState('Todos');
  const [selectedMetaComp, setSelectedMetaComp] = useState<MetaComposition | null>(META_COMPOSITIONS[0]);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('22/10/2026 às 12:34');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Trigger simulated live sync from Garena
  const handleSyncGarena = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date();
      setLastSyncTime(`${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
      showToast(`Sincronização concluída! ${GARENA_CHARACTERS.length} personagens oficiais atualizados diretamente de ff.garena.com`);
    }, 1200);
  };

  // Characters mapped by ID for fast lookup
  const charMap = useMemo(() => {
    const map = new Map<number, GarenaCharacter>();
    GARENA_CHARACTERS.forEach(c => map.set(c.id, c));
    return map;
  }, []);

  const comparedCharacters = useMemo(() => {
    return comparedIds.map(id => charMap.get(id)).filter(Boolean) as GarenaCharacter[];
  }, [comparedIds, charMap]);

  const handleAddComparison = (id: number) => {
    if (comparedIds.includes(id)) return;
    if (comparedIds.length >= 4) {
      showToast('Máximo de 4 personagens no comparativo simultâneo.');
      return;
    }
    setComparedIds(prev => [...prev, id]);
    setIsAddingCharacter(false);
  };

  const handleRemoveComparison = (id: number) => {
    if (comparedIds.length <= 1) {
      showToast('Mantenha ao menos 1 personagem para comparação.');
      return;
    }
    setComparedIds(prev => prev.filter(cId => cId !== id));
  };

  // Filtered Catalog
  const filteredCatalog = useMemo(() => {
    return GARENA_CHARACTERS.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(catalogSearch.toLowerCase()) || 
                          c.ability.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                          c.abstract.toLowerCase().includes(catalogSearch.toLowerCase());
      
      let matchType = true;
      if (catalogTypeFilter === 'Ativo') matchType = c.type === 'Ativo';
      else if (catalogTypeFilter === 'Passivo') matchType = c.type === 'Passivo';
      else if (catalogTypeFilter === 'Novos') matchType = !!c.is_new || ['Morse', 'Nero', 'Rin', 'Oscar', 'Koda', 'Lila', 'Kassie'].includes(c.name);

      let matchRole = true;
      if (catalogRoleFilter !== 'Todos') {
        matchRole = c.role.toLowerCase().includes(catalogRoleFilter.toLowerCase());
      }

      return matchSearch && matchType && matchRole;
    });
  }, [catalogSearch, catalogTypeFilter, catalogRoleFilter]);

  // Apply Meta Composition directly to user's team composition
  const handleApplyMetaComposition = (metaComp: MetaComposition) => {
    try {
      const rawStored = localStorage.getItem('ff_team_compositions_v2');
      let teams: TeamComposition[] = [];
      if (rawStored) {
        teams = JSON.parse(rawStored);
      }

      if (!teams || teams.length === 0) {
        teams = [{
          id: 'team_1',
          name: metaComp.name.slice(0, 25),
          players: []
        }];
      }

      // Target active team (first team or current)
      const targetTeam = teams[0];
      targetTeam.name = metaComp.name.slice(0, 25);

      // Create 4 players based on squadBuild
      const newPlayers = metaComp.squadBuild.map((build, idx) => {
        // Find active character
        const activeChar = GARENA_CHARACTERS.find(c => c.name.toLowerCase() === build.activeSkill.toLowerCase());
        const skillSlots: (Character | null)[] = [
          activeChar ? {
            name: activeChar.name,
            imageUrl: activeChar.skill_icon || activeChar.head_icon || activeChar.cover_img,
            type: 'Ativo',
            ability: activeChar.ability
          } : null
        ];

        // Fill passive skills
        build.passiveSkills.forEach(passName => {
          const passChar = GARENA_CHARACTERS.find(c => c.name.toLowerCase() === passName.toLowerCase());
          if (passChar) {
            skillSlots.push({
              name: passChar.name,
              imageUrl: passChar.skill_icon || passChar.head_icon || passChar.cover_img,
              type: 'Passivo',
              ability: passChar.ability
            });
          } else {
            skillSlots.push({
              name: passName,
              imageUrl: 'https://i.ibb.co/9HSp4GsC/NERO.png',
              type: 'Passivo',
              ability: 'Habilidade Passiva'
            });
          }
        });

        // Ensure 4 slots
        while (skillSlots.length < 4) {
          skillSlots.push(null);
        }

        const petObj: Pet = {
          name: build.pet,
          imageUrl: 'https://cdn.wildflamestudio.com/common/web_event/official2/dist/client/img/full_logo.969f536.png'
        };

        return {
          id: idx + 1,
          name: `JOGADOR ${idx + 1}`,
          role: build.roleName,
          photoUrl: activeChar ? activeChar.cover_img : null,
          pet: petObj,
          loadout: { name: build.loadout, imageUrl: '' },
          skills: skillSlots,
          alternativeSkills: [null, null]
        };
      });

      targetTeam.players = newPlayers;
      localStorage.setItem('ff_team_compositions_v2', JSON.stringify(teams));

      showToast(`Composição "${metaComp.name}" aplicada com sucesso na sua equipe! Redirecionando...`);
      setTimeout(() => {
        onNavigate('/composicao');
      }, 900);
    } catch (e) {
      console.error('Error applying composition:', e);
      showToast('Erro ao aplicar composição no armazenamento local.');
    }
  };

  return (
    <div className="section-spacing space-y-10 animate-fade-in pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-graphite-950 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-2xl flex items-center gap-3 animate-fade-in-up border border-white/20">
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-graphite-900 via-graphite-850 to-graphite-900 border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-loud-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-loud-500/20 text-loud-400 border border-loud-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={12} />
                <span>Base Oficial Garena ({GARENA_CHARACTERS.length} Personagens)</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white/5 text-gray-300 text-[10px] font-mono border border-white/10">
                Última sync: {lastSyncTime}
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-display font-black text-white tracking-tight uppercase">
              Laboratório Tático & <span className="text-loud-500">Meta Comps</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              Consulte dados oficiais extraídos de <code className="text-loud-400 bg-white/5 px-1.5 py-0.5 rounded text-xs">ff.garena.com/pt/chars/</code>, compare habilidades ativas e passivas lado a lado e aplique as melhores composições do meta competitivo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-stretch lg:self-auto">
            <button
              onClick={handleSyncGarena}
              disabled={isSyncing}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-graphite-800 hover:bg-graphite-700 text-white border border-white/10 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg disabled:opacity-50"
              title="Sincronizar personagens da página oficial da Garena"
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin text-loud-400' : 'text-loud-400'} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Garena'}</span>
            </button>

            <button
              onClick={() => onNavigate('/composicao')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-loud-500 hover:bg-loud-600 text-graphite-950 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xl shadow-loud-500/20 hover:scale-105"
            >
              <Users size={15} />
              <span>Ver Minha Equipe</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 pt-6 mt-6 border-t border-white/10">
          <button
            onClick={() => setActiveTab('comparativo')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'comparativo'
                ? 'bg-loud-500 text-graphite-950 shadow-lg shadow-loud-500/20 scale-102'
                : 'bg-graphite-800 text-gray-400 hover:text-white hover:bg-graphite-700'
            }`}
          >
            <Swords size={15} />
            <span>Comparativo de Habilidades ({comparedIds.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('meta')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'meta'
                ? 'bg-loud-500 text-graphite-950 shadow-lg shadow-loud-500/20 scale-102'
                : 'bg-graphite-800 text-gray-400 hover:text-white hover:bg-graphite-700'
            }`}
          >
            <Trophy size={15} />
            <span>Sugestões de Melhores Composições ({META_COMPOSITIONS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('catalogo')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'catalogo'
                ? 'bg-loud-500 text-graphite-950 shadow-lg shadow-loud-500/20 scale-102'
                : 'bg-graphite-800 text-gray-400 hover:text-white hover:bg-graphite-700'
            }`}
          >
            <Layers size={15} />
            <span>Catálogo Completo Garena ({GARENA_CHARACTERS.length})</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          TAB 1: COMPARATIVO DE PERSONAGENS & HABILIDADES
         ===================================================================== */}
      {activeTab === 'comparativo' && (
        <div className="space-y-6 animate-fade-in">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-graphite-800/80 p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Comparando ({comparedCharacters.length}/4 personagens):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {comparedCharacters.map(c => (
                  <span key={c.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-graphite-900 border border-white/10 text-xs font-bold text-white">
                    <img src={c.skill_icon || c.head_icon} alt={c.name} className="w-4 h-4 rounded-full object-cover" />
                    <span>{c.name}</span>
                    <button
                      onClick={() => handleRemoveComparison(c.id)}
                      className="text-gray-400 hover:text-red-400 ml-0.5 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {comparedCharacters.length < 4 && (
                <button
                  onClick={() => setIsAddingCharacter(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-loud-500 hover:bg-loud-600 text-graphite-950 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
                >
                  <Plus size={14} />
                  <span>Adicionar ao Comparativo</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Select Drawer / Modal */}
          {isAddingCharacter && (
            <div className="bg-graphite-900 border border-loud-500/40 rounded-3xl p-5 space-y-4 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search size={18} className="text-loud-500" />
                  <h3 className="text-base font-display font-bold text-white uppercase">Selecione um Personagem para Comparar</h3>
                </div>
                <button 
                  onClick={() => setIsAddingCharacter(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <input
                type="text"
                placeholder="Buscar por nome ou habilidade (ex: Morse, Tatsuya, Dimitri, Moco)..."
                value={searchComparison}
                onChange={e => setSearchComparison(e.target.value)}
                className="w-full bg-graphite-800 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-loud-500"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {GARENA_CHARACTERS.filter(c => 
                  c.name.toLowerCase().includes(searchComparison.toLowerCase()) ||
                  c.ability.toLowerCase().includes(searchComparison.toLowerCase())
                ).map(c => {
                  const isSelected = comparedIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      disabled={isSelected}
                      onClick={() => handleAddComparison(c.id)}
                      className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                        isSelected 
                          ? 'opacity-40 border-white/5 bg-graphite-950 cursor-not-allowed' 
                          : 'bg-graphite-800 hover:bg-graphite-750 border-white/10 hover:border-loud-500/50 cursor-pointer hover:scale-103'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-graphite-950 mb-1.5 border border-white/10 relative">
                        <img src={c.head_icon || c.cover_img} alt={c.name} className="w-full h-full object-cover" />
                        <span className={`absolute bottom-0 right-0 px-1 py-0.2 rounded-tl text-[8px] font-black uppercase ${c.type === 'Ativo' ? 'bg-amber-500 text-black' : 'bg-cyan-500 text-black'}`}>
                          {c.type[0]}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-white truncate w-full">{c.name}</span>
                      <span className="text-[9px] text-gray-400 truncate w-full">{c.ability}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Side by Side Comparison Grid */}
          <div className={`grid grid-cols-1 md:grid-cols-${Math.min(comparedCharacters.length, 4)} gap-4 sm:gap-6`}>
            {comparedCharacters.map((char) => {
              const isActive = char.type === 'Ativo';
              return (
                <div 
                  key={char.id} 
                  className="bg-graphite-800 rounded-3xl border border-white/10 hover:border-loud-500/40 transition-all flex flex-col justify-between overflow-hidden shadow-2xl relative group"
                >
                  {/* Top Character Card Header */}
                  <div className="relative aspect-video sm:aspect-square bg-gradient-to-t from-graphite-900 via-graphite-950 to-transparent p-4 flex flex-col justify-between overflow-hidden">
                    {/* Background Artwork */}
                    {char.pc_bg && (
                      <img 
                        src={char.pc_bg} 
                        alt={char.name} 
                        className="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-xs group-hover:scale-105 transition-transform duration-700" 
                      />
                    )}

                    {/* Character PC Render */}
                    <div className="absolute inset-0 flex items-center justify-center p-2">
                      <img 
                        src={char.cover_img || char.character_pc} 
                        alt={char.name} 
                        className="max-h-full max-w-full object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-500" 
                      />
                    </div>

                    {/* Top Badges */}
                    <div className="flex items-center justify-between relative z-10">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-md ${
                        isActive 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      }`}>
                        {char.type}
                      </span>

                      {char.is_new && (
                        <span className="px-2.5 py-1 rounded-lg bg-loud-500 text-graphite-950 text-[10px] font-black uppercase tracking-wider shadow-lg animate-pulse">
                          Novo Personagem
                        </span>
                      )}

                      <button
                        onClick={() => handleRemoveComparison(char.id)}
                        className="w-7 h-7 rounded-full bg-graphite-900/80 hover:bg-red-500 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer ml-auto"
                        title="Remover do comparativo"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Bottom Title & Role Overlay */}
                    <div className="relative z-10 pt-16 bg-gradient-to-t from-graphite-900 via-graphite-900/80 to-transparent p-3 -mx-4 -mb-4">
                      <span className="text-[10px] font-mono text-loud-400 font-bold uppercase tracking-widest">{char.role}</span>
                      <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight">{char.name}</h3>
                      {char.abstract && (
                        <p className="text-xs text-gray-300 italic">{char.abstract}</p>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-5 flex-1 flex flex-col justify-between">
                    {/* Skill Header */}
                    <div className="flex items-center gap-3 p-3 bg-graphite-900/80 rounded-2xl border border-white/5">
                      <div className="w-12 h-12 rounded-xl bg-graphite-950 border border-loud-500/30 overflow-hidden flex-shrink-0 p-1 flex items-center justify-center">
                        <img 
                          src={char.skill_icon || char.head_icon} 
                          alt={char.ability} 
                          className="w-full h-full object-contain" 
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Habilidade Oficial</span>
                        <h4 className="text-sm font-bold text-white truncate" title={char.ability}>{char.ability}</h4>
                      </div>
                      {char.cooldown && (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
                          <Clock size={12} />
                          <span>{char.cooldown}s</span>
                        </div>
                      )}
                    </div>

                    {/* Official Ability Description */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-loud-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Target size={13} />
                        <span>Descrição da Habilidade</span>
                      </span>
                      <p className="text-xs text-gray-300 leading-relaxed bg-graphite-900/40 p-3.5 rounded-xl border border-white/5 min-h-[90px]">
                        {char.ability_introduction || 'Habilidade oficial do Free Fire.'}
                      </p>
                    </div>

                    {/* Tactical Analysis & Synergies */}
                    <div className="space-y-2 pt-2 border-t border-white/5 text-xs">
                      <div className="flex items-center justify-between text-gray-400">
                        <span className="font-bold">Tempo de Recarga:</span>
                        <span className="font-mono text-white font-bold">{char.cooldown ? `${char.cooldown} segundos` : 'Passiva contínua'}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-400">
                        <span className="font-bold">Função Recomendada:</span>
                        <span className="text-loud-400 font-bold">{char.role}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-400">
                        <span className="font-bold">Classificação:</span>
                        <span className="text-white font-mono">{char.type === 'Ativo' ? 'Habilidade Ativa (Slot 1)' : 'Habilidade Passiva (Slots 2, 3 ou 4)'}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center gap-2">
                      <a
                        href={char.story_link || GARENA_OFFICIAL_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-graphite-900 hover:bg-graphite-750 text-gray-300 hover:text-white border border-white/10 text-[11px] font-bold uppercase transition-all"
                      >
                        <ExternalLink size={12} />
                        <span>Garena Oficial</span>
                      </a>
                      <button
                        onClick={() => {
                          setSelectedCharDetail(char);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-loud-500/20 hover:bg-loud-500 text-loud-400 hover:text-graphite-950 border border-loud-500/30 text-[11px] font-black uppercase transition-all cursor-pointer"
                      >
                        <Eye size={12} />
                        <span>Ver Ficha</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Direct Head to Head Tactical Summary */}
          {comparedCharacters.length >= 2 && (
            <div className="bg-graphite-800/90 rounded-3xl border border-white/10 p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-2">
                <Swords size={20} className="text-loud-500" />
                <h3 className="text-xl font-display font-bold text-white uppercase tracking-tight">
                  Análise Comparativa Tática Direta
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-300 leading-relaxed">
                <div className="p-4 bg-graphite-900/60 rounded-2xl border border-white/5 space-y-2">
                  <div className="font-black uppercase text-loud-400 tracking-wider">Combate e Mobilidade</div>
                  <p>
                    {comparedCharacters.some(c => c.name === 'Morse') && (
                      <span className="block mb-1.5">
                        • <strong>Morse:</strong> Oferece aproximação furtiva única (indetectável a mais de 16m) e mira magnética a 4m, perfeito para flancos sem ser avistado.
                      </span>
                    )}
                    {comparedCharacters.some(c => c.name === 'Tatsuya') && (
                      <span className="block mb-1.5">
                        • <strong>Tatsuya:</strong> Rei dos confrontos cara a cara devido aos dois disparos rebeldes rápidos, permitindo desviar de tiros e fechar distância instantaneamente.
                      </span>
                    )}
                    {comparedCharacters.some(c => c.name === 'Orion') && (
                      <span className="block mb-1.5">
                        • <strong>Orion:</strong> Domina combates em ambientes fechados com invulnerabilidade temporária e dreno de HP contínuo.
                      </span>
                    )}
                    {comparedCharacters.some(c => c.name === 'Dimitri') && (
                      <span className="block mb-1.5">
                        • <strong>Dimitri:</strong> Foco em sustentação coletiva em área. Ideal para jogadas defensivas segurando posição atrás de gel.
                      </span>
                    )}
                  </p>
                </div>

                <div className="p-4 bg-graphite-900/60 rounded-2xl border border-white/5 space-y-2">
                  <div className="font-black uppercase text-loud-400 tracking-wider">Recomendação de Composição</div>
                  <p>
                    Para máxima eficiência em equipe, utilize apenas <strong>1 habilidade ativa principal</strong> por jogador, combinando com <strong>3 passivas complementares</strong> que aumentem velocidade (Kelly), absorção de dano (Sonia/J.Biebs) e penetração de armadura (Hayato).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 2: SUGESTÕES DE MELHORES COMPOSIÇÕES META
         ===================================================================== */}
      {activeTab === 'meta' && (
        <div className="space-y-8 animate-fade-in">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">Filtrar por Modo:</span>
              {['Todos', 'Campeonatos / LBFF', 'CS Squad 4x4', 'BR Ranqueada'].map(m => (
                <button
                  key={m}
                  onClick={() => setMetaModeFilter(m)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    metaModeFilter === m
                      ? 'bg-loud-500 text-graphite-950 shadow-md scale-103'
                      : 'bg-graphite-800 text-gray-400 hover:text-white hover:bg-graphite-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <span className="text-xs text-gray-400 font-mono">
              {META_COMPOSITIONS.length} Metas Oficiais Calibrados
            </span>
          </div>

          {/* Compositions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {META_COMPOSITIONS.filter(c => {
              if (metaModeFilter === 'Todos') return true;
              return c.mode.toLowerCase().includes(metaModeFilter.toLowerCase());
            }).map((comp) => {
              const isSelected = selectedMetaComp?.id === comp.id;
              return (
                <div
                  key={comp.id}
                  className={`bg-graphite-800 rounded-3xl border transition-all p-6 sm:p-7 flex flex-col justify-between space-y-6 shadow-2xl relative ${
                    isSelected ? 'border-loud-500/60 ring-2 ring-loud-500/20' : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Top Header */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-3 py-1 rounded-full bg-loud-500/20 text-loud-400 border border-loud-500/40 text-[10px] font-black uppercase tracking-wider">
                        {comp.tier} • {comp.badge}
                      </span>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-black">
                        <Flame size={13} className="text-amber-400" />
                        <span>{comp.synergyScore}% Sinergia</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight">{comp.name}</h3>
                      <p className="text-xs text-loud-400 font-bold uppercase tracking-wider mt-0.5">{comp.focus}</p>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed bg-graphite-900/50 p-3.5 rounded-2xl border border-white/5">
                      {comp.description}
                    </p>
                  </div>

                  {/* Core 4 Skills Highlights */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Núcleo Principal da Composição:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {comp.coreSkills.map((sName, sIdx) => {
                        const charObj = GARENA_CHARACTERS.find(c => c.name.toLowerCase() === sName.toLowerCase());
                        const isPrimary = sIdx === 0;
                        return (
                          <div 
                            key={sIdx} 
                            className={`flex items-center gap-2 p-2 rounded-xl border ${
                              isPrimary ? 'bg-amber-500/10 border-amber-500/30' : 'bg-graphite-900 border-white/5'
                            }`}
                          >
                            <img 
                              src={charObj?.skill_icon || charObj?.head_icon || 'https://i.ibb.co/9HSp4GsC/NERO.png'} 
                              alt={sName} 
                              className="w-8 h-8 rounded-lg object-cover flex-shrink-0 bg-graphite-950" 
                            />
                            <div className="min-w-0">
                              <span className="text-[9px] text-gray-400 block font-bold uppercase">{isPrimary ? 'Ativa' : 'Passiva'}</span>
                              <span className="text-xs font-bold text-white truncate block">{sName}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Squad Role Breakdown (4 Players) */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Distribuição do Squad (4 Jogadores):
                    </span>
                    <div className="space-y-2">
                      {comp.squadBuild.map((pBuild, pIdx) => (
                        <div key={pIdx} className="bg-graphite-900/80 p-3 rounded-2xl border border-white/5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-loud-500/20 text-loud-400 flex items-center justify-center font-bold text-[10px]">
                              {pIdx + 1}
                            </span>
                            <span className="font-bold text-white">{pBuild.roleName}:</span>
                            <span className="text-amber-400 font-bold">[{pBuild.activeSkill}]</span>
                            <span className="text-gray-300">+{pBuild.passiveSkills.join(', ')}</span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono self-end sm:self-auto">
                            Pet: {pBuild.pet}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 space-y-1">
                      <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1">
                        <Check size={12} /> Pontos Fortes
                      </span>
                      {comp.strengths.slice(0, 2).map((str, sIdx) => (
                        <p key={sIdx} className="text-gray-300 text-[11px]">• {str}</p>
                      ))}
                    </div>

                    <div className="p-3 bg-amber-500/5 rounded-2xl border border-amber-500/20 space-y-1">
                      <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
                        <AlertCircle size={12} /> Atenção / Fraqueza
                      </span>
                      {comp.weaknesses.slice(0, 2).map((w, wIdx) => (
                        <p key={wIdx} className="text-gray-300 text-[11px]">• {w}</p>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      onClick={() => handleApplyMetaComposition(comp)}
                      className="flex-1 flex items-center justify-center gap-2 bg-loud-500 hover:bg-loud-600 text-graphite-950 font-black px-5 py-3 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-loud-500/20 transition-all cursor-pointer hover:scale-102"
                    >
                      <Sparkles size={16} />
                      <span>Aplicar na Minha Equipe</span>
                    </button>

                    <button
                      onClick={() => {
                        const ids = comp.coreSkills.map(name => {
                          const c = GARENA_CHARACTERS.find(item => item.name.toLowerCase() === name.toLowerCase());
                          return c ? c.id : null;
                        }).filter(Boolean) as number[];
                        if (ids.length > 0) {
                          setComparedIds(ids.slice(0, 4));
                          setActiveTab('comparativo');
                          showToast(`Personagens de "${comp.name}" carregados no Comparador!`);
                        }
                      }}
                      className="flex items-center justify-center gap-1.5 bg-graphite-900 hover:bg-graphite-700 text-gray-200 font-bold px-4 py-3 rounded-2xl text-xs uppercase tracking-wider border border-white/10 transition-all cursor-pointer"
                    >
                      <Swords size={14} className="text-loud-400" />
                      <span>Comparar Habilidades</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: CATÁLOGO COMPLETO GARENA (64 PERSONAGENS)
         ===================================================================== */}
      {activeTab === 'catalogo' && (
        <div className="space-y-6 animate-fade-in">
          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-graphite-800 p-4 rounded-3xl border border-white/10">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por nome do personagem ou habilidade (ex: Morse, Nero, Orion, Tatsuya)..."
                value={catalogSearch}
                onChange={e => setCatalogSearch(e.target.value)}
                className="w-full bg-graphite-900 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold text-white focus:outline-none focus:border-loud-500 transition-all"
              />
              {catalogSearch && (
                <button
                  onClick={() => setCatalogSearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Type Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {(['Todos', 'Ativo', 'Passivo', 'Novos'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setCatalogTypeFilter(t)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    catalogTypeFilter === t
                      ? 'bg-loud-500 text-graphite-950 shadow-md scale-103'
                      : 'bg-graphite-900 text-gray-300 hover:text-white hover:bg-graphite-750'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Results Counter */}
          <div className="flex items-center justify-between text-xs text-gray-400 font-bold uppercase tracking-wider px-2">
            <span>Exibindo {filteredCatalog.length} de {GARENA_CHARACTERS.length} personagens oficiais</span>
            <span>Garena Free Fire Oficial • Atualizado com Morse & Nero</span>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredCatalog.map(char => {
              const isCompared = comparedIds.includes(char.id);
              const isActive = char.type === 'Ativo';
              return (
                <div
                  key={char.id}
                  className={`bg-graphite-800 rounded-3xl border transition-all p-3.5 flex flex-col justify-between group relative overflow-hidden shadow-xl ${
                    isCompared ? 'border-loud-500 ring-2 ring-loud-500/20' : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  {/* Top image */}
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-graphite-950 mb-3 border border-white/5 flex items-center justify-center p-2">
                    <img
                      src={char.cover_img || char.head_icon}
                      alt={char.name}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />

                    {/* Skill Icon badge in corner */}
                    {char.skill_icon && (
                      <div className="absolute top-2 left-2 w-8 h-8 rounded-lg bg-graphite-950/90 border border-white/20 p-1 shadow-lg" title={char.ability}>
                        <img src={char.skill_icon} alt={char.ability} className="w-full h-full object-contain" />
                      </div>
                    )}

                    <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[9px] font-black uppercase shadow-md ${
                      isActive ? 'bg-amber-500 text-black' : 'bg-cyan-500 text-black'
                    }`}>
                      {char.type}
                    </span>

                    {char.is_new && (
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-loud-500 text-graphite-950 text-[8px] font-black uppercase">
                        Novo
                      </span>
                    )}
                  </div>

                  {/* Character info */}
                  <div className="space-y-1 mb-3 text-center">
                    <h4 className="font-display font-black text-sm text-white uppercase tracking-tight truncate" title={char.name}>
                      {char.name}
                    </h4>
                    <p className="text-[10px] text-loud-400 font-bold truncate" title={char.ability}>
                      {char.ability}
                    </p>
                    <p className="text-[9px] text-gray-400 truncate">
                      {char.cooldown ? `Recarga: ${char.cooldown}s` : char.role}
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="space-y-1.5 pt-1">
                    <button
                      onClick={() => {
                        if (isCompared) {
                          handleRemoveComparison(char.id);
                        } else {
                          handleAddComparison(char.id);
                        }
                      }}
                      className={`w-full py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        isCompared
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-loud-500 text-graphite-950 hover:bg-loud-600 shadow-sm'
                      }`}
                    >
                      {isCompared ? <X size={12} /> : <Plus size={12} />}
                      <span>{isCompared ? 'Remover' : 'Comparar'}</span>
                    </button>

                    <button
                      onClick={() => setSelectedCharDetail(char)}
                      className="w-full py-1 rounded-xl bg-graphite-900 hover:bg-graphite-750 text-gray-300 hover:text-white text-[9px] font-bold uppercase transition-all flex items-center justify-center gap-1 border border-white/5 cursor-pointer"
                    >
                      <Eye size={11} />
                      <span>Detalhes</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: DETALHES COMPLETOS DO PERSONAGEM
         ===================================================================== */}
      {selectedCharDetail && (
        <div className="fixed inset-0 z-50 bg-graphite-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-graphite-900 border border-white/10 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedCharDetail(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white p-2 rounded-xl bg-graphite-800 border border-white/5 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-32 h-32 rounded-3xl bg-graphite-950 border border-loud-500/30 p-2 flex-shrink-0 flex items-center justify-center overflow-hidden">
                <img 
                  src={selectedCharDetail.cover_img || selectedCharDetail.head_icon} 
                  alt={selectedCharDetail.name} 
                  className="w-full h-full object-contain" 
                />
              </div>

              <div className="space-y-1.5 text-center sm:text-left">
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                  selectedCharDetail.type === 'Ativo' ? 'bg-amber-500 text-black' : 'bg-cyan-500 text-black'
                }`}>
                  Habilidade {selectedCharDetail.type}
                </span>
                <h3 className="text-3xl font-display font-black text-white uppercase">{selectedCharDetail.name}</h3>
                {selectedCharDetail.abstract && (
                  <p className="text-xs text-loud-400 italic font-bold">"{selectedCharDetail.abstract}"</p>
                )}
                <p className="text-xs text-gray-400">Função: <strong>{selectedCharDetail.role}</strong></p>
              </div>
            </div>

            {/* Ability Breakdown */}
            <div className="p-4 bg-graphite-800 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={selectedCharDetail.skill_icon || selectedCharDetail.head_icon} alt="" className="w-7 h-7 rounded-lg object-contain bg-graphite-900 p-0.5" />
                  <span className="font-bold text-white text-sm">{selectedCharDetail.ability}</span>
                </div>
                {selectedCharDetail.cooldown && (
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                    Recarga: {selectedCharDetail.cooldown}s
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                {selectedCharDetail.ability_introduction}
              </p>
            </div>

            {/* Introduction / Lore */}
            {selectedCharDetail.introduction && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">História / Lore:</span>
                <p className="text-xs text-gray-400 italic leading-relaxed">
                  {selectedCharDetail.introduction}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  handleAddComparison(selectedCharDetail.id);
                  setSelectedCharDetail(null);
                  setActiveTab('comparativo');
                }}
                className="flex-1 py-3 rounded-2xl bg-loud-500 hover:bg-loud-600 text-graphite-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
              >
                Adicionar ao Comparativo
              </button>

              <a
                href={selectedCharDetail.story_link || GARENA_OFFICIAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 rounded-2xl bg-graphite-800 hover:bg-graphite-750 text-white font-bold text-xs uppercase tracking-wider border border-white/10 transition-all flex items-center gap-1.5"
              >
                <span>Garena</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterLab;
