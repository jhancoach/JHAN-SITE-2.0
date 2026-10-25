import React, { useState, useEffect } from 'react';
import { 
  Camera, Plus, Trash2, Download, PawPrint, Zap, Shield, Info, 
  RotateCcw, X, Search, Image as ImageIcon, Briefcase, ChevronDown, 
  Users, LayoutGrid, List, Copy, Trophy, Check, Tag, Eye, EyeOff,
  Sparkles, ArrowLeftRight, Swords, Scale
} from 'lucide-react';
import { parseCSV, downloadDivAsImage, findValue } from '../utils';
import { SHEETS, EXTRA_CHARACTERS, LOADOUTS_DATA } from '../constants';
import { Character, Pet, PlayerComposition, LoadoutItem, TeamComposition } from '../types';
import { GARENA_CHARACTERS } from '../src/data/garenaCharacters';

const PLAYER_ROLES = ['RUSH 1', 'RUSH 2', 'BOMBA', 'SNIPER', 'CAPITÃO', 'SUPORTE', 'CORINGA', 'RESERVA'];

const createDefaultPlayer = (id: number, role: string): PlayerComposition => ({
  id,
  name: '',
  role,
  photoUrl: null,
  pet: null,
  loadout: null,
  skills: [null, null, null, null],
  alternativeSkills: [],
});

const createDefaultTeam = (index: number, name?: string): TeamComposition => ({
  id: `team-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  name: name || `EQUIPE ${index}`,
  tag: '',
  logoUrl: null,
  players: [
    createDefaultPlayer(1, 'RUSH 1'),
    createDefaultPlayer(2, 'RUSH 2'),
    createDefaultPlayer(3, 'BOMBA'),
    createDefaultPlayer(4, 'SNIPER'),
  ],
});

const sanitizeFileName = (name: string) => {
  return name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'equipe';
};

// Official Character Visual Helpers (matching Laboratório Tático e Meta)
export const getCharacterImage = (charName: string, fallbackUrl?: string) => {
  if (!charName) return fallbackUrl || '';
  const g = GARENA_CHARACTERS.find(c => c.name.toLowerCase() === charName.toLowerCase());
  if (g) return g.cover_img || g.character_pc || g.head_icon || fallbackUrl || '';
  const extra = EXTRA_CHARACTERS.find(c => c.name.toLowerCase() === charName.toLowerCase());
  if (extra) return extra.imageUrl || fallbackUrl || '';
  return fallbackUrl || '';
};

export const getCharacterSkillIcon = (charName: string, fallbackUrl?: string) => {
  if (!charName) return fallbackUrl || '';
  const g = GARENA_CHARACTERS.find(c => c.name.toLowerCase() === charName.toLowerCase());
  if (g) return g.skill_icon || fallbackUrl || '';
  return fallbackUrl || '';
};

const normalizeTeamSkills = (teamList: TeamComposition[]): TeamComposition[] => {
  return teamList.map(t => ({
    ...t,
    players: (t.players || []).map(p => ({
      ...p,
      skills: (p.skills || []).map(s => {
        if (!s) return null;
        const g = GARENA_CHARACTERS.find(c => c.name.toLowerCase() === s.name.toLowerCase());
        return {
          ...s,
          imageUrl: g ? (g.cover_img || g.character_pc || g.head_icon || s.imageUrl) : s.imageUrl,
          skillIcon: g ? g.skill_icon : s.skillIcon,
          coverImg: g ? g.cover_img : s.coverImg,
        };
      }),
      alternativeSkills: (p.alternativeSkills || []).map(s => {
        if (!s) return null;
        const g = GARENA_CHARACTERS.find(c => c.name.toLowerCase() === s.name.toLowerCase());
        return {
          ...s,
          imageUrl: g ? (g.cover_img || g.character_pc || g.head_icon || s.imageUrl) : s.imageUrl,
          skillIcon: g ? g.skill_icon : s.skillIcon,
          coverImg: g ? g.cover_img : s.coverImg,
        };
      })
    }))
  }));
};

interface CompositionProps {
  onNavigate?: (path: string) => void;
}

const Composition: React.FC<CompositionProps> = ({ onNavigate }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  // Teams State - Multi-Team Support (Auto-migrated with official character art)
  const [teams, setTeams] = useState<TeamComposition[]>(() => {
    try {
      const saved = localStorage.getItem('ff_team_compositions_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const rawTeams = parsed.map((t: TeamComposition) => ({
            ...t,
            players: (t.players || []).map((p: PlayerComposition) => ({
              ...p,
              alternativeSkills: Array.isArray(p.alternativeSkills) ? p.alternativeSkills : []
            }))
          }));
          return normalizeTeamSkills(rawTeams);
        }
      }
    } catch (e) {
      console.error('Error loading teams from localStorage:', e);
    }
    return [createDefaultTeam(1, 'EQUIPE PRINCIPAL')];
  });

  const [activeTeamId, setActiveTeamId] = useState<string>(() => {
    return teams[0]?.id || '';
  });

  // View Mode: 'grid' (Cards) or 'list' (Linha por Linha)
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>(() => {
    try {
      const saved = localStorage.getItem('ff_comp_view_layout');
      if (saved === 'grid' || saved === 'list') return saved;
    } catch {}
    return 'grid';
  });

  // Scope: Single Team vs All Teams
  const [showAllTeams, setShowAllTeams] = useState(false);

  // Toggle Visibility of Alternative Skills (Habilidades Alternativas)
  const [showAlternativeSkills, setShowAlternativeSkills] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ff_show_alt_skills');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  // Per-player independent alternative skills visibility (especially for List Mode)
  const [playerAltVisibility, setPlayerAltVisibility] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('ff_comp_player_alt_visibility');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectingFor, setSelectingFor] = useState<{
    teamId: string;
    playerId: number;
    slotType: 'skill' | 'pet' | 'loadout' | 'alternativeSkill';
    slotIndex?: number;
  } | null>(null);
  const [skillTypeFilter, setSkillTypeFilter] = useState<'todas' | 'ativo' | 'passivo'>('todas');
  const [searchTerm, setSearchTerm] = useState('');

  // Confirmation Modal for "Limpar Tudo"
  const [resetModal, setResetModal] = useState<{
    isOpen: boolean;
    teamId: string | 'all';
    teamName: string;
    resetAllTeams?: boolean;
  } | null>(null);
  const [resetIncludeProfiles, setResetIncludeProfiles] = useState(false);

  // Skill Comparison State (Comparar Duas ou Mais Habilidades)
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [compareSlots, setCompareSlots] = useState<string[]>(['Morse', 'Tatsuya']);
  const [compareNotification, setCompareNotification] = useState<string | null>(null);
  const [activeSlotPicker, setActiveSlotPicker] = useState<number | null>(null);
  const [slotPickerSearch, setSlotPickerSearch] = useState('');
  const [slotPickerTypeFilter, setSlotPickerTypeFilter] = useState<'todas' | 'ativo' | 'passivo'>('todas');
  const [compareTargetPlayerId, setCompareTargetPlayerId] = useState<number>(1);

  // Auto-clear notification after 3.5s
  useEffect(() => {
    if (compareNotification) {
      const t = setTimeout(() => setCompareNotification(null), 3500);
      return () => clearTimeout(t);
    }
  }, [compareNotification]);

  // Persist teams to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ff_team_compositions_v2', JSON.stringify(teams));
    } catch (e) {
      console.error('Error saving teams to localStorage:', e);
    }
  }, [teams]);

  // Persist viewLayout
  useEffect(() => {
    try {
      localStorage.setItem('ff_comp_view_layout', viewLayout);
    } catch {}
  }, [viewLayout]);

  // Persist showAlternativeSkills
  useEffect(() => {
    try {
      localStorage.setItem('ff_show_alt_skills', String(showAlternativeSkills));
    } catch {}
  }, [showAlternativeSkills]);

  // Persist playerAltVisibility
  useEffect(() => {
    try {
      localStorage.setItem('ff_comp_player_alt_visibility', JSON.stringify(playerAltVisibility));
    } catch {}
  }, [playerAltVisibility]);

  // Toggle alternative skills visibility independently per player
  const togglePlayerAltVisibility = (teamId: string, playerId: number) => {
    const key = `${teamId}_${playerId}`;
    setPlayerAltVisibility(prev => {
      const current = prev[key] !== undefined ? prev[key] : showAlternativeSkills;
      return {
        ...prev,
        [key]: !current
      };
    });
  };

  const isPlayerAltVisible = (teamId: string, playerId: number): boolean => {
    const key = `${teamId}_${playerId}`;
    if (playerAltVisibility[key] !== undefined) {
      return playerAltVisibility[key];
    }
    return showAlternativeSkills;
  };

  const handleToggleAllAlternativeSkills = () => {
    const nextVal = !showAlternativeSkills;
    setShowAlternativeSkills(nextVal);
    // Sync all current players
    const updated: Record<string, boolean> = {};
    teams.forEach(t => {
      t.players.forEach(p => {
        updated[`${t.id}_${p.id}`] = nextVal;
      });
    });
    setPlayerAltVisibility(updated);
  };

  // Ensure activeTeamId is valid
  useEffect(() => {
    if (teams.length > 0 && !teams.some(t => t.id === activeTeamId)) {
      setActiveTeamId(teams[0].id);
    }
  }, [teams, activeTeamId]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // 1. Convert Garena official characters (64 characters from ff.garena.com/pt/chars/)
      const officialChars: Character[] = GARENA_CHARACTERS.map(g => ({
        name: g.name,
        imageUrl: g.cover_img || g.character_pc || g.head_icon || g.skill_icon,
        type: g.type,
        ability: `${g.ability}${g.cooldown ? ` (${g.cooldown}s)` : ''} - ${g.ability_introduction}`,
        skillIcon: g.skill_icon,
        cooldown: g.cooldown,
        abstract: g.abstract,
        role: g.role,
        isNew: g.is_new,
        coverImg: g.cover_img
      }));

      const seenNames = new Set(officialChars.map(c => c.name.toLowerCase().trim()));

      // 2. Load characters from Google Sheet (if any extra exists)
      try {
        const charsData = await parseCSV(SHEETS.CHARACTERS);
        charsData.forEach((row: any) => {
          const name = findValue(row, ['NOME', 'Nome', 'Name', 'Personagem', 'Character']) || '';
          if (name && !seenNames.has(name.toLowerCase().trim())) {
            const typeRaw = findValue(row, ['TIPO', 'Tipo', 'Type', 'Categoria']) || '';
            const isActive = typeRaw.toLowerCase().includes('ativ');
            const img = findValue(row, ['IMAGEM', 'Imagem', 'Image', 'Foto', 'Url'], true) || '';
            if (img) {
              officialChars.push({
                name,
                imageUrl: img,
                type: (isActive ? 'Ativo' : 'Passivo') as 'Ativo' | 'Passivo',
                ability: findValue(row, ['DESCRIÇÃO', 'Descricao', 'Descrição', 'Habilidade', 'Skill', 'Info']) || ''
              });
              seenNames.add(name.toLowerCase().trim());
            }
          }
        });
      } catch (e) {
        console.warn('Google Sheet characters fetch fallback to official:', e);
      }

      // Add extra characters if not already present
      EXTRA_CHARACTERS.forEach(extra => {
        if (!seenNames.has(extra.name.toLowerCase().trim())) {
          officialChars.push(extra);
          seenNames.add(extra.name.toLowerCase().trim());
        }
      });

      // Load Pets
      const petsData = await parseCSV(SHEETS.PETS);
      const mappedPets: Pet[] = petsData.map((row: any) => ({
        name: findValue(row, ['NOME', 'Nome', 'Name', 'Pet']) || 'Pet',
        imageUrl: findValue(row, ['IMAGEM', 'Imagem', 'Image', 'Foto', 'Url'], true) || '',
        ability: findValue(row, ['DESCRIÇÃO', 'Descricao', 'Descrição', 'Habilidade', 'Skill', 'Info']) || ''
      })).filter(p => p.imageUrl);

      setCharacters(officialChars);
      setPets(mappedPets);
      setLoading(false);
    };
    fetchData();
  }, []);

  // --- TEAM MANAGEMENT ---

  const handleAddTeam = () => {
    const nextIndex = teams.length + 1;
    const newTeam = createDefaultTeam(nextIndex, `EQUIPE ${nextIndex}`);
    setTeams(prev => [...prev, newTeam]);
    setActiveTeamId(newTeam.id);
  };

  const handleDuplicateTeam = (teamId: string) => {
    const sourceTeam = teams.find(t => t.id === teamId);
    if (!sourceTeam) return;

    const duplicatedTeam: TeamComposition = {
      ...JSON.parse(JSON.stringify(sourceTeam)),
      id: `team-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: `${sourceTeam.name} (CÓPIA)`,
    };

    setTeams(prev => [...prev, duplicatedTeam]);
    setActiveTeamId(duplicatedTeam.id);
  };

  const handleDeleteTeam = (teamId: string) => {
    if (teams.length <= 1) {
      alert('É necessário manter pelo menos uma equipe.');
      return;
    }
    const team = teams.find(t => t.id === teamId);
    if (!confirm(`Deseja realmente excluir a equipe "${team?.name || 'Equipe'}"?`)) {
      return;
    }
    setTeams(prev => {
      const remaining = prev.filter(t => t.id !== teamId);
      if (activeTeamId === teamId && remaining.length > 0) {
        setActiveTeamId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleUpdateTeamName = (teamId: string, name: string) => {
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, name } : t));
  };

  const handleUpdateTeamTag = (teamId: string, tag: string) => {
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, tag } : t));
  };

  const handleTeamLogoUpload = (teamId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setTeams(prev => prev.map(t => t.id === teamId ? { ...t, logoUrl: url } : t));
    }
  };

  const handleOpenResetModal = (teamId: string | 'all', customName?: string) => {
    const targetName = teamId === 'all' 
      ? 'Todas as Equipes' 
      : (customName || teams.find(t => t.id === teamId)?.name || 'Equipe');
    setResetIncludeProfiles(false);
    setResetModal({
      isOpen: true,
      teamId,
      teamName: targetName,
      resetAllTeams: teamId === 'all',
    });
  };

  const handleExecuteReset = () => {
    if (!resetModal) return;
    const { teamId } = resetModal;
    setTeams(prev => prev.map(t => {
      if (teamId !== 'all' && t.id !== teamId) return t;
      return {
        ...t,
        ...(resetIncludeProfiles ? {
          logoUrl: null,
          tag: '',
        } : {}),
        players: t.players.map(p => ({
          ...p,
          skills: [null, null, null, null],
          alternativeSkills: [],
          pet: null,
          loadout: null,
          ...(resetIncludeProfiles ? {
            name: '',
            photoUrl: null,
          } : {})
        }))
      };
    }));
    setResetModal(null);
    setResetIncludeProfiles(false);
  };

  const handleResetTeam = (teamId: string) => {
    handleOpenResetModal(teamId);
  };

  const handleAddPlayer = (teamId: string) => {
    setTeams(prev => prev.map(t => {
      if (t.id !== teamId) return t;
      if (t.players.length >= 8) {
        alert('Limite máximo de 8 jogadores por equipe atingido.');
        return t;
      }
      const newId = Math.max(...t.players.map(p => p.id), 0) + 1;
      return {
        ...t,
        players: [...t.players, createDefaultPlayer(newId, 'RESERVA')]
      };
    }));
  };

  const handleRemovePlayer = (teamId: string, playerId: number) => {
    setTeams(prev => prev.map(t => {
      if (t.id !== teamId) return t;
      if (t.players.length <= 1) {
        alert('A equipe deve ter pelo menos 1 jogador.');
        return t;
      }
      return {
        ...t,
        players: t.players.filter(p => p.id !== playerId)
      };
    }));
  };

  // --- PLAYER MANAGEMENT ---

  const handlePhotoUpload = (teamId: string, playerId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setTeams(prev => prev.map(t => {
        if (t.id !== teamId) return t;
        return {
          ...t,
          players: t.players.map(p => p.id === playerId ? { ...p, photoUrl: url } : p)
        };
      }));
    }
  };

  const handleUpdatePlayerName = (teamId: string, playerId: number, name: string) => {
    setTeams(prev => prev.map(t => {
      if (t.id !== teamId) return t;
      return {
        ...t,
        players: t.players.map(p => p.id === playerId ? { ...p, name } : p)
      };
    }));
  };

  const handleUpdatePlayerRole = (teamId: string, playerId: number, role: string) => {
    setTeams(prev => prev.map(t => {
      if (t.id !== teamId) return t;
      return {
        ...t,
        players: t.players.map(p => p.id === playerId ? { ...p, role } : p)
      };
    }));
  };

  const handleResetSinglePlayer = (teamId: string, playerId: number) => {
    setTeams(prev => prev.map(t => {
      if (t.id !== teamId) return t;
      return {
        ...t,
        players: t.players.map(p => p.id === playerId ? {
          ...p,
          skills: [null, null, null, null],
          alternativeSkills: [],
          pet: null,
          loadout: null
        } : p)
      };
    }));
  };

  // --- ITEM SELECTION MODAL & SKILL ACTIONS ---

  const openSelection = (
    teamId: string, 
    playerId: number, 
    slotType: 'skill' | 'pet' | 'loadout' | 'alternativeSkill', 
    slotIndex?: number
  ) => {
    setSelectingFor({ teamId, playerId, slotType, slotIndex });
    setSearchTerm('');
    if (slotType === 'skill') {
      if (typeof slotIndex === 'number' && slotIndex > 0) {
        setSkillTypeFilter('passivo');
      } else {
        setSkillTypeFilter('ativo');
      }
    } else {
      setSkillTypeFilter('todas');
    }
    setModalOpen(true);
  };

  const removeSelection = (e: React.MouseEvent, teamId: string, playerId: number, slotType: 'skill' | 'pet' | 'loadout', slotIndex?: number) => {
    e.stopPropagation();
    setTeams(prev => prev.map(t => {
      if (t.id !== teamId) return t;
      return {
        ...t,
        players: t.players.map(p => {
          if (p.id !== playerId) return p;
          if (slotType === 'pet') return { ...p, pet: null };
          if (slotType === 'loadout') return { ...p, loadout: null };
          if (slotType === 'skill' && typeof slotIndex === 'number') {
            const newSkills = [...p.skills];
            newSkills[slotIndex] = null;
            return { ...p, skills: newSkills };
          }
          return p;
        })
      };
    }));
  };

  const handleRemoveAlternative = (teamId: string, playerId: number, altIndex: number) => {
    setTeams(prev => prev.map(t => {
      if (t.id !== teamId) return t;
      return {
        ...t,
        players: t.players.map(p => {
          if (p.id !== playerId) return p;
          const currentAlts = p.alternativeSkills || [];
          return {
            ...p,
            alternativeSkills: currentAlts.filter((_, idx) => idx !== altIndex)
          };
        })
      };
    }));
  };

  const handleSwapAlternative = (teamId: string, playerId: number, altIndex: number) => {
    setTeams(prev => prev.map(t => {
      if (t.id !== teamId) return t;
      return {
        ...t,
        players: t.players.map(p => {
          if (p.id !== playerId) return p;
          const currentAlts = [...(p.alternativeSkills || [])];
          const altChar = currentAlts[altIndex];
          if (!altChar) return p;

          const newSkills = [...p.skills];

          if (altChar.type === 'Ativo') {
            // Check if there is an active skill in main skills
            const activeIdx = newSkills.findIndex(s => s?.type === 'Ativo');
            if (activeIdx !== -1) {
              const oldActive = newSkills[activeIdx];
              newSkills[activeIdx] = altChar;
              currentAlts[altIndex] = oldActive;
            } else {
              // No active currently in main skills. Find first empty slot or swap slot 0
              const emptyIdx = newSkills.findIndex(s => s === null);
              if (emptyIdx !== -1) {
                newSkills[emptyIdx] = altChar;
                currentAlts.splice(altIndex, 1);
              } else {
                const oldMain = newSkills[0];
                newSkills[0] = altChar;
                currentAlts[altIndex] = oldMain;
              }
            }
          } else {
            // It's a Passive skill
            const emptyIdx = newSkills.findIndex(s => s === null);
            if (emptyIdx !== -1) {
              newSkills[emptyIdx] = altChar;
              currentAlts.splice(altIndex, 1);
            } else {
              // Swap with first passive slot found, or slot 1
              const passiveIdx = newSkills.findIndex(s => s?.type === 'Passivo');
              const targetIdx = passiveIdx !== -1 ? passiveIdx : 1;
              const oldMain = newSkills[targetIdx];
              newSkills[targetIdx] = altChar;
              currentAlts[altIndex] = oldMain;
            }
          }

          return {
            ...p,
            skills: newSkills,
            alternativeSkills: currentAlts
          };
        })
      };
    }));
  };

  const selectItem = (item: Character | Pet | LoadoutItem) => {
    if (!selectingFor) return;
    const { teamId, playerId, slotType, slotIndex } = selectingFor;

    setTeams(prev => prev.map(t => {
      if (t.id !== teamId) return t;
      return {
        ...t,
        players: t.players.map(p => {
          if (p.id !== playerId) return p;

          // Pet
          if (slotType === 'pet') {
            return { ...p, pet: item as Pet };
          }

          // Loadout
          if (slotType === 'loadout') {
            return { ...p, loadout: item as LoadoutItem };
          }

          // Alternative Skill (Active or Passive)
          if (slotType === 'alternativeSkill') {
            const char = item as Character;

            // Check if already equipped in main skills
            const inMain = p.skills.some(s => s?.name === char.name);
            if (inMain) {
              alert('Este personagem já está equipado nas habilidades principais deste jogador.');
              return p;
            }

            const currentAlts = [...(p.alternativeSkills || [])];
            const inAlt = currentAlts.some((s, idx) => idx !== slotIndex && s?.name === char.name);
            if (inAlt) {
              alert('Esta habilidade já foi adicionada como alternativa para este jogador.');
              return p;
            }

            if (typeof slotIndex === 'number' && slotIndex < currentAlts.length) {
              currentAlts[slotIndex] = char;
            } else {
              if (currentAlts.length >= 4) {
                alert('Limite máximo de 4 habilidades alternativas por jogador atingido.');
                return p;
              }
              currentAlts.push(char);
            }

            return { ...p, alternativeSkills: currentAlts };
          }

          // Skill
          if (slotType === 'skill' && typeof slotIndex === 'number') {
            const char = item as Character;

            // Slots 2, 3, 4 are strictly passive skills
            if (slotIndex > 0 && char.type === 'Ativo') {
              alert('Os slots 2, 3 e 4 são exclusivos para habilidades passivas. Apenas a Hab. 1 pode ser ativa.');
              return p;
            }

            // Unique skill per player check
            const alreadyEquipped = p.skills.findIndex((s, idx) => idx !== slotIndex && s?.name === char.name);
            if (alreadyEquipped !== -1) {
              alert('Este personagem já está equipado neste jogador.');
              return p;
            }

            // Max 1 Active skill per player check
            if (char.type === 'Ativo') {
              const activeCount = p.skills.filter((s, idx) => idx !== slotIndex && s?.type === 'Ativo').length;
              if (activeCount >= 1) {
                alert('Cada jogador só pode utilizar no máximo 1 habilidade ativa.');
                return p;
              }
            }

            const newSkills = [...p.skills];
            newSkills[slotIndex] = char;
            return { ...p, skills: newSkills };
          }

          return p;
        })
      };
    }));

    setModalOpen(false);
  };

  const getListToDisplay = () => {
    if (!selectingFor) return [];
    
    let list: (Character | Pet | LoadoutItem)[] = [];
    
    if (selectingFor.slotType === 'pet') {
      list = pets;
    } else if (selectingFor.slotType === 'loadout') {
      list = LOADOUTS_DATA;
    } else if (selectingFor.slotType === 'skill' || selectingFor.slotType === 'alternativeSkill') {
      if (selectingFor.slotType === 'skill' && typeof selectingFor.slotIndex === 'number' && selectingFor.slotIndex > 0) {
        // Hab 2, Hab 3, Hab 4: strictly PASSIVE skills
        list = characters.filter(c => c.type === 'Passivo');
      } else if (selectingFor.slotType === 'skill' && selectingFor.slotIndex === 0) {
        // Hab 1: Active skills by default
        if (skillTypeFilter === 'todas') {
          list = characters;
        } else if (skillTypeFilter === 'passivo') {
          list = characters.filter(c => c.type === 'Passivo');
        } else {
          list = characters.filter(c => c.type === 'Ativo');
        }
      } else {
        if (skillTypeFilter === 'ativo') {
          list = characters.filter(c => c.type === 'Ativo');
        } else if (skillTypeFilter === 'passivo') {
          list = characters.filter(c => c.type === 'Passivo');
        } else {
          list = characters;
        }
      }
    }

    if (!searchTerm) return list;

    return list.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const displayList = getListToDisplay();

  const currentTeam = teams.find(t => t.id === activeTeamId) || teams[0];

  // --- SKILL COMPARISON (COMPARAR DUAS OU MAIS HABILIDADES) LOGIC ---
  const COMPARE_PRESETS = [
    { label: '⚡ Meta Ativas 2026', chars: ['Tatsuya', 'Alok', 'Chrono', 'Orion'] },
    { label: '🛡️ Sobrevivência', chars: ['Sonia', 'Dimitri', 'Thiva', 'J.Biebs'] },
    { label: '💥 Rush & Dano', chars: ['Kelly', 'Hayato', 'Moco', 'Jota'] },
    { label: '📡 Rastreio & Info', chars: ['Morse', 'Moco', 'Homer', 'Clu'] },
    { label: '🎯 Suporte & Cura', chars: ['Alok', 'Dimitri', 'Kapella', 'Olivia'] },
  ];

  const openCompareModal = (initialChars?: string[]) => {
    if (initialChars && initialChars.length >= 2) {
      setCompareSlots(initialChars.slice(0, 4));
    } else if (initialChars && initialChars.length === 1) {
      const fallback = initialChars[0].toLowerCase() === 'morse' ? 'Tatsuya' : 'Morse';
      setCompareSlots([initialChars[0], fallback]);
    }
    setActiveSlotPicker(null);
    setIsCompareModalOpen(true);
  };

  const openCompareForPlayer = (player: PlayerComposition) => {
    setCompareTargetPlayerId(player.id);
    const equipped = player.skills.filter(Boolean).map(s => s!.name);
    if (equipped.length >= 2) {
      setCompareSlots(equipped.slice(0, 4));
    } else if (equipped.length === 1) {
      const fallback = equipped[0].toLowerCase() === 'tatsuya' ? 'Alok' : 'Tatsuya';
      setCompareSlots([equipped[0], fallback]);
    } else {
      setCompareSlots(['Morse', 'Tatsuya']);
    }
    setActiveSlotPicker(null);
    setIsCompareModalOpen(true);
  };

  const openCompareFromSelection = () => {
    if (selectingFor) {
      setCompareTargetPlayerId(selectingFor.playerId);
      const currentP = currentTeam?.players.find(p => p.id === selectingFor.playerId);
      const equipped = (currentP?.skills || []).filter(Boolean).map(s => s!.name);
      if (equipped.length >= 2) {
        setCompareSlots(equipped.slice(0, 4));
      } else {
        setCompareSlots(['Morse', 'Tatsuya']);
      }
    }
    setActiveSlotPicker(null);
    setIsCompareModalOpen(true);
  };

  const addSlotAndCompare = (charName: string) => {
    setCompareSlots(prev => {
      if (prev.includes(charName)) return prev;
      if (prev.length < 4) {
        return [...prev, charName];
      }
      return [prev[0], prev[1], prev[2], charName];
    });
    setActiveSlotPicker(null);
    setIsCompareModalOpen(true);
  };

  const addCompareSlot = () => {
    if (compareSlots.length >= 4) return;
    const popularCandidates = ['Morse', 'Tatsuya', 'Sonia', 'Alok', 'Orion', 'Kelly', 'Hayato', 'Moco', 'Dimitri'];
    const nextChar = popularCandidates.find(c => !compareSlots.includes(c)) || GARENA_CHARACTERS.find(g => !compareSlots.includes(g.name))?.name || 'Kelly';
    setCompareSlots(prev => [...prev, nextChar]);
  };

  const removeCompareSlot = (index: number) => {
    if (compareSlots.length <= 2) {
      setCompareNotification('Mínimo de 2 habilidades para comparação simultânea.');
      return;
    }
    setCompareSlots(prev => prev.filter((_, i) => i !== index));
    if (activeSlotPicker === index) setActiveSlotPicker(null);
  };

  const changeCompareSlot = (index: number, newCharName: string) => {
    setCompareSlots(prev => {
      const updated = [...prev];
      updated[index] = newCharName;
      return updated;
    });
    setActiveSlotPicker(null);
    setSlotPickerSearch('');
  };

  const loadPlayerSkillsIntoCompare = (playerId: number) => {
    setCompareTargetPlayerId(playerId);
    const targetPlayer = currentTeam.players.find(p => p.id === playerId);
    if (!targetPlayer) return;
    const equipped = targetPlayer.skills.filter(Boolean).map(s => s!.name);
    if (equipped.length >= 2) {
      setCompareSlots(equipped.slice(0, 4));
      setCompareNotification(`Habilidades de ${targetPlayer.name || `Jogador ${targetPlayer.id}`} carregadas no comparador.`);
    } else if (equipped.length === 1) {
      const fallback = equipped[0].toLowerCase() === 'tatsuya' ? 'Alok' : 'Tatsuya';
      setCompareSlots([equipped[0], fallback]);
      setCompareNotification(`Habilidade de ${targetPlayer.name || `Jogador ${targetPlayer.id}`} carregada com sugestão de contraparte.`);
    } else {
      setCompareNotification(`Jogador ${targetPlayer.id} ainda não possui habilidades suficientes equipadas.`);
    }
  };

  const getTacticalSynergy = (name: string) => {
    const map: Record<string, { combos: string[]; notes: string }> = {
      'Morse': { combos: ['Moco', 'Homer', 'Hayato', 'Kelly'], notes: 'Modo furtivo para flanquear e infiltrar sem ser visto no radar.' },
      'Tatsuya': { combos: ['Hayato', 'Sonia', 'Kelly', 'Jota'], notes: 'Explosão de mobilidade com arrancada dupla indispensável no rush moderno.' },
      'Sonia': { combos: ['Dimitri', 'Thiva', 'Nairi', 'Kelly'], notes: 'Garante 0.5s de invulnerabilidade e 3s de escudo ao receber dano fatal.' },
      'Dimitri': { combos: ['Sonia', 'Thiva', 'Kapella', 'Olivia'], notes: 'Zona de cura de 3.5m que permite a auto-recuperação do próprio jogador e squad.' },
      'Alok': { combos: ['Kelly', 'Hayato', 'Moco', 'Jota'], notes: 'Aura sonora de cura rápida e aumento de velocidade para movimentação de equipe.' },
      'Chrono': { combos: ['Moco', 'Laura', 'Marô', 'Rafael'], notes: 'Cria campo de força estático que bloqueia 800 de dano inimigo.' },
      'Orion': { combos: ['Miguel', 'Kelly', 'Hayato', 'Jota'], notes: 'Transforma-se na Onda Carmesim consumindo EP: imune a dano e absorve vida.' },
      'Kelly': { combos: ['Hayato', 'Tatsuya', 'Moco', 'Alok'], notes: 'Aumento passivo e constante na velocidade de corrida em qualquer situação.' },
      'Hayato': { combos: ['Kelly', 'Tatsuya', 'Sonia', 'Moco'], notes: 'Penetração de armadura devastadora que aumenta com a perda de vida.' },
      'Moco': { combos: ['Kelly', 'Hayato', 'Morse', 'Homer'], notes: 'Marca oponentes atingidos por até 5s, compartilhando a visão com o time.' },
      'Homer': { combos: ['Moco', 'Kelly', 'Hayato', 'Tatsuya'], notes: 'Drone teleguiado que causa 25 de dano e reduz 60% da velocidade inimiga.' },
      'Santino': { combos: ['Hayato', 'Kelly', 'Sonia', 'Tatsuya'], notes: 'Manequim tático com teletransporte instantâneo para fugas e reposicionamento.' },
      'Nero': { combos: ['Tatsuya', 'Kelly', 'Hayato', 'Moco'], notes: 'Espaço dos sonhos que bloqueia Paredes de Gel inimigas em raio de 8m.' },
      'Kasshe': { combos: ['Kelly', 'Hayato', 'Moco', 'Sonia'], notes: 'Acúmulo de dano constante em confrontos de curta distância.' },
      'Jota': { combos: ['Kelly', 'Hayato', 'Tatsuya', 'Sonia'], notes: 'Recupera HP instantaneamente ao atingir e derrubar oponentes.' },
      'Thiva': { combos: ['Dimitri', 'Sonia', 'Kapella', 'Olivia'], notes: 'Acelera a velocidade de resgate de companheiros em até 70%.' },
      'Kapella': { combos: ['Dimitri', 'Alok', 'Olivia', 'Sonia'], notes: 'Aumenta efeitos de itens de cura em 20% e reduz perda de HP derrubado.' },
      'Olivia': { combos: ['Dimitri', 'Thiva', 'Kapella', 'Alok'], notes: 'Espalha 80% do efeito de cura para companheiros próximos em até 10m.' },
    };
    return map[name] || { combos: ['Kelly', 'Hayato', 'Moco', 'Sonia'], notes: 'Excelente habilidade com alto potencial de sinergia no competitivo.' };
  };

  const getCharData = (name: string) => {
    const garenaChar = GARENA_CHARACTERS.find(g => g.name.toLowerCase() === name.toLowerCase());
    if (garenaChar) return garenaChar;
    const regularChar = characters.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (regularChar) {
      return {
        id: 0,
        name: regularChar.name,
        ability: regularChar.ability || 'Habilidade Tática',
        ability_introduction: regularChar.ability || 'Sem descrição detalhada.',
        introduction: regularChar.abstract || '',
        type: regularChar.type || 'Passivo',
        cooldown: regularChar.cooldown || null,
        role: regularChar.role || 'Geral',
        head_icon: regularChar.imageUrl,
        skill_icon: regularChar.skillIcon || regularChar.imageUrl,
        cover_img: regularChar.coverImg || regularChar.imageUrl,
        abstract: regularChar.abstract || '',
        is_new: regularChar.isNew,
        awaken: false
      };
    }
    return null;
  };

  const handleEquipFromCompare = (charName: string, targetPlayerId: number, asAlternative: boolean = false) => {
    const char = characters.find(c => c.name.toLowerCase() === charName.toLowerCase()) || 
                 GARENA_CHARACTERS.find(g => g.name.toLowerCase() === charName.toLowerCase());
    if (!char) return;

    const charObj: Character = {
      name: char.name,
      imageUrl: ('cover_img' in char && char.cover_img) ? char.cover_img : (('character_pc' in char && char.character_pc) ? char.character_pc : (('head_icon' in char && char.head_icon) ? char.head_icon : (('imageUrl' in char && char.imageUrl) ? char.imageUrl : ''))),
      type: char.type,
      ability: ('ability_introduction' in char) ? `${char.ability}${char.cooldown ? ` (${char.cooldown}s)` : ''} - ${char.ability_introduction}` : char.ability,
      skillIcon: ('skill_icon' in char) ? char.skill_icon : (char as any).skillIcon,
      cooldown: char.cooldown,
      role: char.role,
      coverImg: ('cover_img' in char) ? char.cover_img : (char as any).coverImg
    };

    setTeams(prev => prev.map(t => {
      if (t.id !== currentTeam.id) return t;
      return {
        ...t,
        players: t.players.map(p => {
          if (p.id !== targetPlayerId) return p;

          if (asAlternative) {
            const currentAlts = [...(p.alternativeSkills || [])];
            if (p.skills.some(s => s?.name === charObj.name) || currentAlts.some(s => s?.name === charObj.name)) {
              setCompareNotification(`⚠️ ${charObj.name} já faz parte da composição de ${p.name || `Jogador ${p.id}`}.`);
              return p;
            }
            if (currentAlts.length >= 4) {
              currentAlts[3] = charObj;
            } else {
              currentAlts.push(charObj);
            }
            setCompareNotification(`✓ ${charObj.name} adicionado como Alternativa de ${p.name || `Jogador ${p.id}`}!`);
            return { ...p, alternativeSkills: currentAlts };
          }

          // Main Skills
          const newSkills = [...p.skills];
          const existingIdx = newSkills.findIndex(s => s?.name === charObj.name);
          if (existingIdx !== -1) {
            setCompareNotification(`⚠️ ${charObj.name} já está no Slot ${existingIdx + 1} de ${p.name || `Jogador ${p.id}`}.`);
            return p;
          }

          if (charObj.type === 'Ativo') {
            const activeIdx = newSkills.findIndex(s => s?.type === 'Ativo');
            if (activeIdx !== -1) {
              newSkills[activeIdx] = charObj;
            } else {
              const emptyIdx = newSkills.findIndex(s => s === null);
              newSkills[emptyIdx !== -1 ? emptyIdx : 0] = charObj;
            }
          } else {
            const emptyIdx = newSkills.findIndex(s => s === null);
            if (emptyIdx !== -1) {
              newSkills[emptyIdx] = charObj;
            } else {
              let lastPassIdx = -1;
              for (let i = newSkills.length - 1; i >= 0; i--) {
                if (newSkills[i]?.type === 'Passivo') {
                  lastPassIdx = i;
                  break;
                }
              }
              newSkills[lastPassIdx !== -1 ? lastPassIdx : 1] = charObj;
            }
          }

          setCompareNotification(`⚡ ${charObj.name} equipado com sucesso em ${p.name || `Jogador ${p.id}`} (${p.role})!`);
          return { ...p, skills: newSkills };
        })
      };
    }));
  };

  // --- RENDER SINGLE TEAM VIEW ---

  const renderTeam = (team: TeamComposition, isSingleView: boolean = true) => {
    const totalActiveSkills = team.players.reduce((acc, p) => acc + p.skills.filter(s => s?.type === 'Ativo').length, 0);
    const totalPets = team.players.filter(p => p.pet !== null).length;
    const totalLoadouts = team.players.filter(p => p.loadout !== null).length;

    return (
      <div 
        key={team.id}
        id={`comp-team-${team.id}`}
        className="bg-graphite-800 rounded-3xl md:rounded-[2.5rem] border border-white/5 shadow-2xl p-5 md:p-8 relative overflow-hidden space-y-6"
      >
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 p-12 md:p-20 opacity-5 pointer-events-none select-none">
          <Users size={200} className="text-loud-500" />
        </div>

        {/* TEAM HEADER & CUSTOM NAME SECTION */}
        <div className="bg-graphite-900/80 backdrop-blur-md rounded-2xl p-4 md:p-6 border border-white/5 relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            {/* Team Identity: Logo + Name + Tag */}
            <div className="flex items-center gap-4 w-full lg:w-auto flex-1">
              {/* Team Logo / Badge */}
              <label 
                className="relative cursor-pointer group/logo shrink-0"
                title="Clique para adicionar/alterar o logo da equipe"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-graphite-800 flex items-center justify-center overflow-hidden border-2 border-loud-500 shadow-xl group-hover/logo:border-loud-400 transition-all">
                  {team.logoUrl ? (
                    <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-2">
                      <Trophy className="text-loud-500 opacity-70 mb-0.5" size={24} />
                      <span className="text-[8px] font-black uppercase text-loud-500 tracking-wider">Logo</span>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/70 rounded-2xl opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-black uppercase tracking-wider text-center p-1">
                  Trocar
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => handleTeamLogoUpload(team.id, e)} 
                />
              </label>

              {/* Team Name Input and Tag */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-loud-500 tracking-widest bg-loud-500/10 px-2 py-0.5 rounded border border-loud-500/20">
                    Nome da Equipe
                  </span>
                  {team.tag && (
                    <span className="text-[10px] font-black uppercase text-white/60 bg-white/5 px-2 py-0.5 rounded">
                      [{team.tag}]
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                  <input 
                    type="text"
                    value={team.name}
                    onChange={(e) => handleUpdateTeamName(team.id, e.target.value)}
                    placeholder="Digite o nome da equipe (ex: LOUD, FLUXO...)"
                    className="bg-transparent border-b-2 border-white/10 hover:border-white/30 focus:border-loud-500 outline-none py-1 text-2xl md:text-3xl font-display font-black text-white placeholder-white/20 uppercase italic tracking-tighter w-full max-w-md transition-colors"
                  />
                  <div className="flex items-center gap-1.5 shrink-0 bg-graphite-800/80 px-2.5 py-1 rounded-lg border border-white/5">
                    <Tag size={12} className="text-loud-500" />
                    <input 
                      type="text"
                      value={team.tag}
                      onChange={(e) => handleUpdateTeamTag(team.id, e.target.value)}
                      placeholder="TAG"
                      maxLength={6}
                      className="bg-transparent outline-none text-xs font-black text-loud-400 placeholder-white/20 uppercase w-14 tracking-widest"
                      title="Tag abreviada da equipe"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tactical Statistics & Team Actions */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
              {/* Stats badges */}
              <div className="flex items-center gap-2 bg-graphite-800 px-3 py-1.5 rounded-xl border border-white/5 text-[11px] font-bold">
                <span className="text-premium-muted">Jogadores:</span>
                <span className="text-white font-black">{team.players.length}</span>
              </div>
              <div className="flex items-center gap-2 bg-graphite-800 px-3 py-1.5 rounded-xl border border-white/5 text-[11px] font-bold">
                <Zap size={13} className="text-loud-500" />
                <span className="text-premium-muted">Ativas:</span>
                <span className="text-loud-500 font-black">{totalActiveSkills}/{team.players.length}</span>
              </div>
              <div className="flex items-center gap-2 bg-graphite-800 px-3 py-1.5 rounded-xl border border-white/5 text-[11px] font-bold">
                <PawPrint size={13} className="text-blue-400" />
                <span className="text-premium-muted">Pets:</span>
                <span className="text-blue-400 font-black">{totalPets}/{team.players.length}</span>
              </div>

              {/* Team Action Buttons */}
              <div className="flex items-center gap-2 ml-auto lg:ml-0">
                <button
                  onClick={() => handleAddPlayer(team.id)}
                  title="Adicionar jogador reserva ou 5º player"
                  className="px-3 py-2 bg-graphite-800 hover:bg-graphite-700 text-loud-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border border-loud-500/20"
                >
                  <Plus size={14} /> + Jogador
                </button>
                <button
                  onClick={() => handleDuplicateTeam(team.id)}
                  title="Duplicar esta equipe para criar uma variação"
                  className="p-2 bg-graphite-800 hover:bg-graphite-700 text-premium-muted hover:text-white rounded-xl transition-all border border-white/5"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => handleOpenResetModal(team.id, team.name)}
                  title="Limpar todas as habilidades, pets e itens da equipe"
                  className="px-3 py-2 bg-graphite-800 hover:bg-red-500/15 text-premium-muted hover:text-red-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border border-white/5 hover:border-red-500/30 cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Limpar Tudo</span>
                </button>
                {teams.length > 1 && (
                  <button
                    onClick={() => handleDeleteTeam(team.id)}
                    title="Excluir equipe"
                    className="p-2 bg-graphite-800 hover:bg-red-950/60 text-premium-muted hover:text-red-400 rounded-xl transition-all border border-white/5"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  onClick={handleToggleAllAlternativeSkills}
                  title={showAlternativeSkills ? "Ocultar habilidades alternativas desta equipe" : "Mostrar habilidades alternativas desta equipe"}
                  className={`p-2 rounded-xl transition-all border ${
                    showAlternativeSkills 
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25' 
                      : 'bg-graphite-800 text-premium-muted border-white/5 hover:text-white'
                  }`}
                >
                  {showAlternativeSkills ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  onClick={() => downloadDivAsImage(`comp-team-${team.id}`, sanitizeFileName(team.name || 'equipe'))}
                  title="Exportar esta equipe como imagem PNG"
                  className="px-3.5 py-2 bg-loud-500 hover:bg-loud-400 text-black rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(58,255,0,0.25)]"
                >
                  <ImageIcon size={14} /> PNG
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- VIEW MODE: CARDS (GRADE) --- */}
        {viewLayout === 'grid' && (
          <div className="space-y-6">
            <div className="players-cards-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-5">
            {team.players.map((player) => (
              <div 
                key={player.id} 
                className="flex flex-col gap-4 bg-graphite-900/80 backdrop-blur-sm p-4 sm:p-5 rounded-3xl border border-white/10 hover:border-loud-500/40 transition-all duration-300 relative group shadow-lg"
              >
                {/* Player quick actions (top-right of player card) */}
                <div className="absolute top-3 right-3 flex items-center gap-1 z-20">
                  <button
                    onClick={() => handleResetSinglePlayer(team.id, player.id)}
                    title="Limpar habilidades, pet e item deste jogador"
                    className="p-1 text-white/30 hover:text-yellow-400 bg-graphite-800/80 hover:bg-graphite-700 rounded-md transition-colors border border-white/5 cursor-pointer"
                  >
                    <RotateCcw size={12} />
                  </button>
                  {team.players.length > 4 && (
                    <button
                      onClick={() => handleRemovePlayer(team.id, player.id)}
                      title="Remover jogador"
                      className="p-1 text-white/30 hover:text-red-400 bg-graphite-800/80 hover:bg-graphite-700 rounded-md transition-colors border border-white/5 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Player Header */}
                <div className="flex items-center gap-3.5">
                  <label className="relative cursor-pointer hover:scale-105 transition-transform group/avatar shrink-0">
                    <div className="w-13 h-13 rounded-2xl bg-graphite-800 flex items-center justify-center overflow-hidden border-2 border-loud-500 shadow-lg">
                      {player.photoUrl ? (
                        <img src={player.photoUrl} alt={player.name || 'Jogador'} className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="text-premium-muted opacity-40" size={18} />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white text-[8px] font-bold uppercase">
                      Alterar
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => handlePhotoUpload(team.id, player.id, e)} 
                    />
                  </label>

                  <div className="flex-1 min-w-0">
                    <input 
                      type="text" 
                      placeholder={`Jogador ${player.id}`}
                      className="bg-transparent border-b border-white/15 focus:border-loud-500 outline-none w-full py-0.5 text-lg font-display font-black text-white placeholder-white/30 uppercase tracking-tight truncate"
                      value={player.name}
                      onChange={(e) => handleUpdatePlayerName(team.id, player.id, e.target.value)}
                    />
                    {/* Role Selector */}
                    <div className="relative mt-1">
                      <select
                        value={player.role}
                        onChange={(e) => handleUpdatePlayerRole(team.id, player.id, e.target.value)}
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

                {/* Habilidades Section (4 Skill Slots - DESTAQUE PRINCIPAL) */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between text-[10px] font-black text-loud-500 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(58,255,0,0.4)]">
                      <Zap size={13} fill="currentColor" className="text-loud-500" /> Habilidades Principais
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openCompareForPlayer(player)}
                        className="flex items-center gap-1 text-[8px] font-black text-loud-400 hover:text-white bg-loud-500/10 hover:bg-loud-500/25 px-2 py-0.5 rounded border border-loud-500/30 transition-all cursor-pointer shadow-xs"
                        title={`Comparar habilidades de ${player.name || `Jogador ${player.id}`}`}
                      >
                        <Scale size={9} />
                        <span>Comparar</span>
                      </button>
                      <span className="text-[8px] text-loud-400/80 font-bold lowercase italic bg-loud-500/10 px-1.5 py-0.5 rounded border border-loud-500/20">
                        máx. 1 ativa
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2.5">
                    {player.skills.map((char, idx) => (
                      <div 
                        key={idx}
                        onClick={() => openSelection(team.id, player.id, 'skill', idx)}
                        className={`aspect-[3/4] rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden group/card ${
                          char 
                            ? char.type === 'Ativo'
                              ? 'border-loud-500 bg-graphite-950 shadow-[0_0_15px_rgba(58,255,0,0.35)] ring-1 ring-loud-500/40' 
                              : 'border-blue-500/80 bg-graphite-950 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                            : 'border-dashed border-white/15 bg-graphite-800/60 hover:border-loud-500/60 hover:bg-loud-500/10'
                        }`}
                      >
                        {char ? (
                          <>
                            <img 
                              src={getCharacterImage(char.name, char.imageUrl)} 
                              alt={char.name} 
                              className="w-full h-full object-contain p-0.5 pb-4 group-hover/card:scale-105 transition-transform duration-500 drop-shadow-md" 
                              crossOrigin="anonymous" 
                            />

                            {/* Mini Skill Icon Badge */}
                            {getCharacterSkillIcon(char.name, char.skillIcon) && (
                              <div className="absolute top-1 right-1 w-5 h-5 rounded-md bg-graphite-950/90 border border-white/20 p-0.5 shadow-md z-10" title={char.ability}>
                                <img src={getCharacterSkillIcon(char.name, char.skillIcon)} alt={char.name} className="w-full h-full object-contain" />
                              </div>
                            )}

                            {/* Name Bar */}
                            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/95 to-transparent pt-3 pb-1 px-1 z-10 border-t border-white/10">
                              <p className="text-white text-[10px] sm:text-[11px] font-black text-center truncate uppercase tracking-wider font-sans drop-shadow-sm">{char.name}</p>
                            </div>

                            {/* Tooltip on Hover */}
                            <div className="absolute inset-0 bg-graphite-900/95 opacity-0 group-hover/card:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center z-20">
                              <p className="text-loud-500 text-[8.5px] font-black uppercase italic mb-1 flex items-center gap-1">
                                {char.name}
                                <span className="text-[6.5px] text-white/60">({char.type})</span>
                              </p>
                              <p className="text-[7px] text-premium-muted line-clamp-4 leading-tight">{char.ability}</p>
                            </div>

                            <button 
                              onClick={(e) => removeSelection(e, team.id, player.id, 'skill', idx)}
                              className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-red-500 z-30"
                              title="Remover habilidade"
                            >
                              <X size={10} />
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-premium-muted/60 hover:text-white transition-colors p-1">
                            <Plus size={18} className="text-loud-500/60 mb-1 group-hover/card:scale-110 group-hover/card:text-loud-400 transition-all" />
                            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-center">
                              {idx === 0 ? 'Hab. 1 Ativa' : `Hab. ${idx + 1} Passiva`}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suporte Secundário: Pet e Item (Tamanho Compacto / Suporte Tático) */}
                <div className="space-y-1.5 pt-2 border-t border-white/5 bg-black/20 -mx-2 px-2.5 py-2 rounded-xl">
                  <div className="flex items-center justify-between text-[8px] font-bold text-premium-muted uppercase tracking-wider opacity-75">
                    <span className="flex items-center gap-1">
                      <Briefcase size={9} /> Suporte Secundário
                    </span>
                    <span className="text-[7.5px] text-white/40 italic">1 pet + 1 item</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Pet Compact Slot */}
                    <div 
                      onClick={() => openSelection(team.id, player.id, 'pet')}
                      className={`h-11 sm:h-12 rounded-lg border transition-all cursor-pointer relative overflow-hidden group/pet flex items-center p-1.5 gap-2 ${
                        player.pet 
                          ? 'border-amber-500/70 bg-graphite-950/90 hover:border-amber-400' 
                          : 'border-dashed border-white/10 bg-graphite-900/40 hover:border-amber-500/40 hover:bg-amber-500/5'
                      }`}
                      title={player.pet ? `${player.pet.name} - ${player.pet.ability || 'Pet'}` : "Selecionar Pet"}
                    >
                      {player.pet ? (
                        <>
                          <div className="w-8 h-8 rounded-md bg-graphite-900 overflow-hidden shrink-0 border border-amber-500/30 flex items-center justify-center p-0.5">
                            <img 
                              src={player.pet.imageUrl} 
                              alt={player.pet.name} 
                              className="w-full h-full object-contain group-hover/pet:scale-110 transition-transform" 
                              crossOrigin="anonymous" 
                            />
                          </div>
                          <div className="flex-1 min-w-0 pr-4">
                            <span className="text-[6.5px] font-black text-amber-400 uppercase tracking-wider block flex items-center gap-0.5">
                              <PawPrint size={7} /> Pet
                            </span>
                            <p className="text-[8px] font-bold text-white truncate leading-tight">{player.pet.name}</p>
                          </div>
                          <button 
                            onClick={(e) => removeSelection(e, team.id, player.id, 'pet')}
                            className="absolute top-1 right-1 text-white/40 hover:text-red-400 p-0.5 opacity-0 group-hover/pet:opacity-100 transition-opacity"
                            title="Remover pet"
                          >
                            <X size={10} />
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 w-full text-premium-muted opacity-40 group-hover/pet:opacity-100 transition-opacity">
                          <PawPrint size={12} className="text-amber-400/80" />
                          <span className="text-[8px] font-bold uppercase tracking-wider text-amber-400/80">+ Pet</span>
                        </div>
                      )}
                    </div>

                    {/* Loadout Item Compact Slot */}
                    <div 
                      onClick={() => openSelection(team.id, player.id, 'loadout')}
                      className={`h-11 sm:h-12 rounded-lg border transition-all cursor-pointer relative overflow-hidden group/item flex items-center p-1.5 gap-2 ${
                        player.loadout 
                          ? 'border-loud-500/70 bg-graphite-950/90 hover:border-loud-400' 
                          : 'border-dashed border-white/10 bg-graphite-900/40 hover:border-loud-500/40 hover:bg-loud-500/5'
                      }`}
                      title={player.loadout ? `${player.loadout.name} - Item tático` : "Selecionar Item"}
                    >
                      {player.loadout ? (
                        <>
                          <div className="w-8 h-8 rounded-md bg-graphite-900 overflow-hidden shrink-0 border border-loud-500/30 flex items-center justify-center p-0.5">
                            <img 
                              src={player.loadout.imageUrl} 
                              alt={player.loadout.name} 
                              className="w-full h-full object-contain group-hover/item:scale-110 transition-transform" 
                              crossOrigin="anonymous" 
                            />
                          </div>
                          <div className="flex-1 min-w-0 pr-4">
                            <span className="text-[6.5px] font-black text-loud-400 uppercase tracking-wider block flex items-center gap-0.5">
                              <Briefcase size={7} /> Item
                            </span>
                            <p className="text-[8px] font-bold text-white truncate leading-tight">{player.loadout.name}</p>
                          </div>
                          <button 
                            onClick={(e) => removeSelection(e, team.id, player.id, 'loadout')}
                            className="absolute top-1 right-1 text-white/40 hover:text-red-400 p-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity"
                            title="Remover item de carregamento"
                          >
                            <X size={10} />
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 w-full text-premium-muted opacity-40 group-hover/item:opacity-100 transition-opacity">
                          <Briefcase size={12} className="text-loud-400/80" />
                          <span className="text-[8px] font-bold uppercase tracking-wider text-loud-400/80">+ Item</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* --- HABILIDADES ALTERNATIVAS / OPÇÕES RESERVA (ABAIXO DOS CARDS PRINCIPAIS) --- */}
          {showAlternativeSkills ? (
            <div className="p-5 sm:p-6 bg-graphite-900/80 backdrop-blur-md rounded-3xl border border-amber-500/20 shadow-xl relative overflow-hidden transition-all">
              {/* Header da Seção de Alternativas */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-display font-black text-white uppercase italic tracking-wider flex items-center gap-2">
                      Habilidades Alternativas <span className="text-amber-400 font-normal">&bull; Opções Reserva</span>
                    </h4>
                    <p className="text-[11px] text-premium-muted">
                      Habilidades ativas ou passivas alternativas para cada jogador trocar dinamicamente conforme a estratégia da partida.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="hidden sm:flex items-center gap-2 text-[10px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                    <ArrowLeftRight size={13} />
                    Troca rápida com 1 clique
                  </div>
                  <button
                    onClick={() => setShowAlternativeSkills(false)}
                    className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-white bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                    title="Ocultar seção de habilidades alternativas"
                  >
                    <EyeOff size={14} /> Ocultar
                  </button>
                </div>
              </div>

              {/* Grid alinhado por jogador */}
              <div className={`grid grid-cols-1 md:grid-cols-2 ${team.players.length > 4 ? 'xl:grid-cols-3' : 'xl:grid-cols-4'} gap-4`}>
                {team.players.map((player) => {
                  const altCount = (player.alternativeSkills || []).length;
                  return (
                    <div 
                      key={player.id}
                      className="p-3.5 rounded-2xl bg-graphite-950/60 border border-white/5 hover:border-amber-500/30 transition-all flex flex-col justify-between"
                    >
                      {/* Cabeçalho do Jogador */}
                      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-white/5">
                        <div className="flex items-center gap-2 min-w-0">
                          {player.photoUrl ? (
                            <img 
                              src={player.photoUrl} 
                              alt={player.name} 
                              className="w-7 h-7 rounded-lg object-cover border border-amber-500/50 shrink-0" 
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-graphite-800 border border-white/10 flex items-center justify-center text-loud-500 shrink-0 text-xs font-bold">
                              {player.id}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-black text-white uppercase italic truncate">
                              {player.name || `Jogador ${player.id}`}
                            </p>
                            <p className="text-[9px] text-loud-500 font-black uppercase tracking-wider italic truncate">
                              {player.role}
                            </p>
                          </div>
                        </div>

                        <span className="text-[9px] font-mono text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded-md shrink-0">
                          {altCount} / 4
                        </span>
                      </div>

                      {/* Slots das Habilidades Alternativas */}
                      <div className="grid grid-cols-4 gap-2">
                        {(player.alternativeSkills || []).map((altChar, altIdx) => {
                          if (!altChar) return null;
                          return (
                            <div 
                              key={altIdx}
                              className={`aspect-[3/4] rounded-xl border-2 transition-all relative overflow-hidden group/alt ${
                                altChar.type === 'Ativo'
                                  ? 'border-loud-500 bg-graphite-900 shadow-[0_0_10px_rgba(58,255,0,0.15)]'
                                  : 'border-blue-500/80 bg-graphite-900 shadow-sm'
                              }`}
                            >
                              <img 
                                src={getCharacterImage(altChar.name, altChar.imageUrl)} 
                                alt={altChar.name} 
                                className="w-full h-full object-contain p-1 pb-3 group-hover/alt:scale-105 transition-transform duration-500 drop-shadow-sm" 
                                crossOrigin="anonymous" 
                              />

                              {/* Mini Skill Icon Badge */}
                              {getCharacterSkillIcon(altChar.name, altChar.skillIcon) && (
                                <div className="absolute top-1 right-1 w-4 h-4 rounded bg-graphite-950/90 border border-white/20 p-0.5 shadow-sm z-10" title={altChar.ability}>
                                  <img src={getCharacterSkillIcon(altChar.name, altChar.skillIcon)} alt={altChar.name} className="w-full h-full object-contain" />
                                </div>
                              )}

                              {/* Nome da Habilidade */}
                              <div className="absolute bottom-0 left-0 w-full bg-graphite-900/90 py-0.5 px-0.5 z-10 border-t border-white/5">
                                <p className="text-amber-400 text-[7px] font-black text-center truncate uppercase italic">{altChar.name}</p>
                              </div>

                              {/* Overlay de Ações ao passar o mouse */}
                              <div className="absolute inset-0 bg-graphite-900/95 opacity-0 group-hover/alt:opacity-100 transition-opacity flex flex-col items-center justify-center p-1 text-center z-20 gap-1">
                                <p className="text-amber-400 text-[7.5px] font-black uppercase italic leading-tight truncate w-full px-0.5">
                                  {altChar.name}
                                </p>
                                <button
                                  onClick={() => handleSwapAlternative(team.id, player.id, altIdx)}
                                  title="Trocar com habilidade principal em 1 clique"
                                  className="bg-loud-500 hover:bg-loud-400 text-black text-[6.5px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase shadow tracking-wider transition-colors"
                                >
                                  <ArrowLeftRight size={7} /> Trocar
                                </button>
                                <button
                                  onClick={() => handleRemoveAlternative(team.id, player.id, altIdx)}
                                  title="Remover opção alternativa"
                                  className="text-red-400 hover:text-red-300 text-[6px] font-bold uppercase underline tracking-wider"
                                >
                                  Remover
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Botão para Adicionar Nova Opção se < 4 */}
                        {altCount < 4 && (
                          <button
                            onClick={() => openSelection(team.id, player.id, 'alternativeSkill')}
                            className="aspect-[3/4] rounded-xl border border-dashed border-amber-500/30 hover:border-amber-400/80 bg-amber-500/5 hover:bg-amber-500/15 transition-all flex flex-col items-center justify-center text-amber-400/60 hover:text-amber-400 group/add"
                            title="Adicionar habilidade alternativa (Ativa ou Passiva)"
                          >
                            <Plus size={14} className="group-hover/add:scale-125 transition-transform" />
                            <span className="text-[6.5px] font-bold uppercase mt-1 text-center leading-tight px-1">
                              + Opção
                            </span>
                          </button>
                        )}

                        {/* Espaços vazios indicativos quando menos de 4 */}
                        {Array.from({ length: Math.max(0, 3 - altCount) }).map((_, emptyIdx) => (
                          <div 
                            key={`empty-${emptyIdx}`}
                            className="aspect-[3/4] rounded-xl border border-white/5 bg-graphite-900/30 flex items-center justify-center opacity-30"
                          >
                            <span className="text-[7px] text-white/40 uppercase">Livre</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div 
              onClick={() => setShowAlternativeSkills(true)}
              className="p-4 bg-graphite-900/50 hover:bg-graphite-900/80 rounded-2xl border border-dashed border-amber-500/30 hover:border-amber-500/60 transition-all flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <Sparkles size={16} />
                <span>Habilidades Alternativas • Opções Reserva (Ocultas)</span>
              </div>
              <button 
                type="button"
                className="flex items-center gap-1.5 text-xs font-bold text-premium-muted group-hover:text-loud-400 transition-colors pointer-events-none"
              >
                <Eye size={14} /> Mostrar Alternativas
              </button>
            </div>
          )}
        </div>
      )}

        {/* --- VIEW MODE: LIST (LINHA POR LINHA) --- */}
        {viewLayout === 'list' && (
          <div className="space-y-2.5 sm:space-y-3">
            {/* Table Header on Desktop */}
            <div className="hidden md:flex items-center justify-between px-4 py-2 bg-graphite-900/60 rounded-xl border border-white/5 text-[9px] font-black uppercase tracking-widest text-loud-500">
              <div className="w-56 lg:w-60 shrink-0 flex items-center justify-between pr-3">
                <span className="flex items-center gap-1.5"><Users size={12} /> Jogador</span>
                <span className="text-[8px] text-premium-muted font-normal lowercase italic">perfil & função</span>
              </div>
              <div className="flex-1 flex items-center justify-between max-w-[540px] lg:max-w-[580px]">
                <span className="flex items-center gap-1.5"><Zap size={11} fill="currentColor" /> Hab 1 • Hab 2 • Hab 3 • Hab 4 • Pet • Item</span>
                <span className="text-[8px] text-amber-400/80 font-normal lowercase italic flex items-center gap-1">
                  <Sparkles size={9} /> opções reserva
                </span>
              </div>
            </div>

            {/* List Rows */}
            {team.players.map((player) => {
              const isAltVisible = isPlayerAltVisible(team.id, player.id);
              const altSkillsCount = (player.alternativeSkills || []).length;

              return (
                <div 
                  key={player.id}
                  className="bg-graphite-900/60 hover:bg-graphite-900/90 border border-white/5 hover:border-loud-500/30 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 transition-all duration-200"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
                    {/* Col 1: Player Profile (Compact) */}
                    <div className="w-full md:w-56 lg:w-60 shrink-0 flex flex-col justify-between gap-1.5">
                      {/* Player Info (Photo + Name + Role) */}
                      <div className="flex items-center gap-2.5 w-full">
                        <label className="relative cursor-pointer hover:scale-105 transition-transform group/avatar shrink-0">
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-graphite-800 flex items-center justify-center overflow-hidden border-2 border-loud-500 shadow-sm">
                            {player.photoUrl ? (
                              <img src={player.photoUrl} alt={player.name || 'Jogador'} className="w-full h-full object-cover" />
                            ) : (
                              <Camera className="text-premium-muted opacity-40" size={16} />
                            )}
                          </div>
                          <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white text-[7px] font-bold uppercase">
                            Foto
                          </div>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={(e) => handlePhotoUpload(team.id, player.id, e)} 
                          />
                        </label>

                        <div className="flex-1 min-w-0">
                          <input 
                            type="text" 
                            placeholder={`Jogador ${player.id}`}
                            className="bg-transparent border-b border-white/10 focus:border-loud-500 outline-none w-full py-0 text-sm font-display font-bold text-white placeholder-white/20 uppercase italic tracking-tighter truncate"
                            value={player.name}
                            onChange={(e) => handleUpdatePlayerName(team.id, player.id, e.target.value)}
                          />
                          <div className="relative mt-0.5">
                            <select
                              value={player.role}
                              onChange={(e) => handleUpdatePlayerRole(team.id, player.id, e.target.value)}
                              className="appearance-none bg-transparent text-[9px] font-black text-loud-500 uppercase outline-none cursor-pointer hover:text-loud-400 transition-colors pr-3.5 w-full italic tracking-wider"
                            >
                              {PLAYER_ROLES.map(role => (
                                <option key={role} value={role} className="bg-graphite-800 text-white">{role}</option>
                              ))}
                            </select>
                            <ChevronDown size={10} className="absolute right-0 top-1/2 -translate-y-1/2 text-loud-500 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      {/* Row Action Buttons & Individual Toggle for this Player */}
                      <div className="flex items-center justify-between pt-1 border-t border-white/5 w-full">
                        {/* Independent Alt Toggle Button for this player */}
                        <button
                          type="button"
                          onClick={() => togglePlayerAltVisibility(team.id, player.id)}
                          className={`text-[7.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border transition-all flex items-center gap-1 cursor-pointer ${
                            isAltVisible
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                              : 'bg-graphite-800 text-premium-muted border-white/10 hover:text-amber-400 hover:border-amber-500/30'
                          }`}
                          title={isAltVisible ? "Ocultar alternativas deste jogador" : "Mostrar alternativas deste jogador"}
                        >
                          {isAltVisible ? (
                            <>
                              <EyeOff size={10} />
                              <span>Alt: On ({altSkillsCount})</span>
                            </>
                          ) : (
                            <>
                              <Eye size={10} />
                              <span>Alt ({altSkillsCount})</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openCompareForPlayer(player)}
                            title={`Comparar habilidades de ${player.name || `Jogador ${player.id}`}`}
                            className="p-1 text-premium-muted hover:text-loud-400 bg-graphite-800/80 hover:bg-graphite-700 rounded-md transition-colors border border-white/5 cursor-pointer"
                          >
                            <Scale size={11} />
                          </button>
                          <button
                            onClick={() => handleResetSinglePlayer(team.id, player.id)}
                            title="Limpar habilidades, pet e item deste jogador"
                            className="p-1 text-premium-muted hover:text-yellow-400 bg-graphite-800/80 hover:bg-graphite-700 rounded-md transition-colors border border-white/5"
                          >
                            <RotateCcw size={11} />
                          </button>
                          {team.players.length > 4 && (
                            <button
                              onClick={() => handleRemovePlayer(team.id, player.id)}
                              title="Remover jogador da lista"
                              className="p-1 text-premium-muted hover:text-red-400 bg-graphite-800/80 hover:bg-graphite-700 rounded-md transition-colors border border-white/5"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Col 2: Cards Sequence (Compact 6-Card Strip) */}
                    <div className="w-full md:flex-1 flex flex-col items-start md:items-end">
                      <div className="w-full max-w-[540px] lg:max-w-[580px]">
                        {/* 6 Cards em linha contínua e compacta */}
                        <div className="grid grid-cols-6 gap-1.5 sm:gap-2 w-full">
                          {/* Cards 1 a 4: Habilidades Principais */}
                          {player.skills.map((char, idx) => (
                            <div 
                              key={idx}
                              onClick={() => openSelection(team.id, player.id, 'skill', idx)}
                              className={`aspect-[3/4] max-h-22 sm:max-h-24 rounded-lg sm:rounded-xl border transition-all cursor-pointer relative overflow-hidden group/card bg-graphite-950 ${
                                char 
                                  ? char.type === 'Ativo'
                                    ? 'border-loud-500 bg-graphite-950 shadow-[0_0_8px_rgba(58,255,0,0.2)]' 
                                    : 'border-blue-500/70 bg-graphite-950 shadow-xs'
                                  : 'border-dashed border-white/10 bg-graphite-800/40 hover:border-loud-500/50 hover:bg-loud-500/5'
                              }`}
                            >
                              {char ? (
                                <>
                                  <img 
                                    src={getCharacterImage(char.name, char.imageUrl)} 
                                    alt={char.name} 
                                    className="w-full h-full object-contain p-0.5 pb-3 group-hover/card:scale-105 transition-transform duration-500 drop-shadow-sm" 
                                    crossOrigin="anonymous" 
                                  />
                                  
                                  {/* Mini Skill Icon Badge */}
                                  {getCharacterSkillIcon(char.name, char.skillIcon) && (
                                    <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded bg-graphite-950/90 border border-white/20 p-0.5 shadow-xs z-10" title={char.ability}>
                                      <img src={getCharacterSkillIcon(char.name, char.skillIcon)} alt={char.name} className="w-full h-full object-contain" />
                                    </div>
                                  )}

                                  {/* Name Bar */}
                                  <div className="absolute bottom-0 left-0 w-full bg-graphite-900/90 backdrop-blur-xs py-0.5 px-0.5 z-10 border-t border-white/5">
                                    <p className="text-white text-[6.5px] sm:text-[7px] font-black text-center truncate uppercase italic leading-tight">{char.name}</p>
                                  </div>

                                  {/* Hover Tooltip */}
                                  <div className="absolute inset-0 bg-graphite-900/95 opacity-0 group-hover/card:opacity-100 transition-opacity flex flex-col items-center justify-center p-1 text-center z-20">
                                    <p className="text-loud-500 text-[7px] sm:text-[7.5px] font-black uppercase italic mb-0.5 truncate w-full px-0.5">{char.name}</p>
                                    <p className="text-[6px] text-premium-muted line-clamp-3 leading-tight">{char.ability}</p>
                                  </div>

                                  <button 
                                    onClick={(e) => removeSelection(e, team.id, player.id, 'skill', idx)}
                                    className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-red-500 z-30"
                                    title="Remover habilidade"
                                  >
                                    <X size={7} />
                                  </button>
                                </>
                              ) : (
                                <div className="flex flex-col items-center justify-center h-full text-premium-muted opacity-30 group-hover/card:opacity-100 transition-opacity">
                                  <Plus size={13} />
                                  <span className="text-[6px] sm:text-[6.5px] font-bold mt-0.5 uppercase">H{idx + 1}</span>
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Card 5: Pet (ao lado da Hab 4) */}
                          <div 
                            onClick={() => openSelection(team.id, player.id, 'pet')}
                            className={`aspect-[3/4] max-h-22 sm:max-h-24 rounded-lg sm:rounded-xl border transition-all cursor-pointer relative overflow-hidden group/card bg-graphite-950 ${
                              player.pet 
                                ? 'border-amber-500 bg-graphite-950 shadow-[0_0_8px_rgba(245,158,11,0.2)]' 
                                : 'border-dashed border-white/10 bg-graphite-800/40 hover:border-amber-500/50 hover:bg-amber-500/5'
                            }`}
                          >
                            {player.pet ? (
                              <>
                                <img 
                                  src={player.pet.imageUrl} 
                                  alt={player.pet.name} 
                                  className="w-full h-full object-contain p-1 pb-3 sm:p-1.5 sm:pb-3.5 group-hover/card:scale-110 transition-transform duration-500" 
                                  crossOrigin="anonymous" 
                                />

                                {/* Pet Badge */}
                                <div className="absolute top-0.5 left-0.5 z-10">
                                  <span className="bg-amber-500 text-black text-[5.5px] sm:text-[6px] font-black px-1 py-0.2 rounded uppercase italic shadow flex items-center gap-0.5">
                                    <PawPrint size={5.5} fill="currentColor" /> Pet
                                  </span>
                                </div>

                                {/* Name Bar */}
                                <div className="absolute bottom-0 left-0 w-full bg-graphite-900/90 backdrop-blur-xs py-0.5 px-0.5 z-10 border-t border-white/5">
                                  <p className="text-amber-400 text-[6.5px] sm:text-[7px] font-black text-center truncate uppercase italic leading-tight">{player.pet.name}</p>
                                </div>

                                {/* Hover Tooltip */}
                                <div className="absolute inset-0 bg-graphite-900/95 opacity-0 group-hover/card:opacity-100 transition-opacity flex flex-col items-center justify-center p-1 text-center z-20">
                                  <p className="text-amber-400 text-[7px] sm:text-[7.5px] font-black uppercase italic mb-0.5 truncate w-full px-0.5">{player.pet.name}</p>
                                  <p className="text-[6px] text-premium-muted line-clamp-3 leading-tight">{player.pet.ability || 'Pet de suporte'}</p>
                                </div>

                                <button 
                                  onClick={(e) => removeSelection(e, team.id, player.id, 'pet')}
                                  className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-red-500 z-30"
                                  title="Remover pet"
                                >
                                  <X size={7} />
                                </button>
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full text-premium-muted opacity-30 group-hover/card:opacity-100 transition-opacity">
                                <PawPrint size={13} />
                                <span className="text-[6px] sm:text-[6.5px] font-bold mt-0.5 uppercase text-amber-400/80">Pet</span>
                              </div>
                            )}
                          </div>

                          {/* Card 6: Item (ao lado do Pet) */}
                          <div 
                            onClick={() => openSelection(team.id, player.id, 'loadout')}
                            className={`aspect-[3/4] max-h-22 sm:max-h-24 rounded-lg sm:rounded-xl border transition-all cursor-pointer relative overflow-hidden group/card bg-graphite-950 ${
                              player.loadout 
                                ? 'border-loud-500 bg-graphite-950 shadow-[0_0_8px_rgba(58,255,0,0.2)]' 
                                : 'border-dashed border-white/10 bg-graphite-800/40 hover:border-loud-500/50 hover:bg-loud-500/5'
                            }`}
                          >
                            {player.loadout ? (
                              <>
                                <img 
                                  src={player.loadout.imageUrl} 
                                  alt={player.loadout.name} 
                                  className="w-full h-full object-contain p-1 pb-3 sm:p-1.5 sm:pb-3.5 group-hover/card:scale-110 transition-transform duration-500" 
                                  crossOrigin="anonymous" 
                                />

                                {/* Item Badge */}
                                <div className="absolute top-0.5 left-0.5 z-10">
                                  <span className="bg-loud-500 text-black text-[5.5px] sm:text-[6px] font-black px-1 py-0.2 rounded uppercase italic shadow flex items-center gap-0.5">
                                    <Briefcase size={5.5} fill="currentColor" /> Item
                                  </span>
                                </div>

                                {/* Name Bar */}
                                <div className="absolute bottom-0 left-0 w-full bg-graphite-900/90 backdrop-blur-xs py-0.5 px-0.5 z-10 border-t border-white/5">
                                  <p className="text-loud-400 text-[6.5px] sm:text-[7px] font-black text-center truncate uppercase italic leading-tight">{player.loadout.name}</p>
                                </div>

                                {/* Hover Tooltip */}
                                <div className="absolute inset-0 bg-graphite-900/95 opacity-0 group-hover/card:opacity-100 transition-opacity flex flex-col items-center justify-center p-1 text-center z-20">
                                  <p className="text-loud-400 text-[7px] sm:text-[7.5px] font-black uppercase italic mb-0.5 truncate w-full px-0.5">{player.loadout.name}</p>
                                  <p className="text-[6px] text-premium-muted line-clamp-3 leading-tight">Item tático</p>
                                </div>

                                <button 
                                  onClick={(e) => removeSelection(e, team.id, player.id, 'loadout')}
                                  className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-red-500 z-30"
                                  title="Remover item de carregamento"
                                >
                                  <X size={7} />
                                </button>
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full text-premium-muted opacity-30 group-hover/card:opacity-100 transition-opacity">
                                <Briefcase size={13} />
                                <span className="text-[6px] sm:text-[6.5px] font-bold mt-0.5 uppercase text-loud-400/80">Item</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* HABILIDADES ALTERNATIVAS (ABAIXO DOS CARDS - INDEPENDENTE POR JOGADOR) */}
                  {isAltVisible && (
                    <div className="mt-2 pt-2 border-t border-amber-500/20 bg-amber-500/[0.03] p-2 rounded-xl transition-all">
                      <div className="text-[8.5px] font-black text-amber-400 uppercase tracking-wider mb-1.5 flex flex-wrap items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={10} fill="currentColor" />
                          <span>Habilidades Alternativas • Opções Reserva</span>
                          <span className="text-[7.5px] font-mono text-amber-400 bg-amber-400/10 px-1 py-0.2 rounded border border-amber-400/20 font-bold">
                            {altSkillsCount} / 4
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[7.5px] text-amber-400/80 font-bold flex items-center gap-1">
                            <ArrowLeftRight size={8} /> Clique em "Trocar" para alternar
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePlayerAltVisibility(team.id, player.id)}
                            className="flex items-center gap-1 text-[7.5px] font-bold text-amber-400/90 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                            title="Ocultar alternativas deste jogador"
                          >
                            <EyeOff size={9} /> Ocultar
                          </button>
                        </div>
                      </div>

                      {/* Cards de Habilidades Alternativas Compactos */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(player.alternativeSkills || []).map((altChar, altIdx) => {
                          if (!altChar) return null;
                          return (
                            <div 
                              key={altIdx}
                              className={`aspect-[3/4] w-14 sm:w-16 shrink-0 rounded-lg sm:rounded-xl border transition-all relative overflow-hidden group/alt bg-graphite-950 ${
                                altChar.type === 'Ativo'
                                  ? 'border-loud-500 bg-graphite-900 shadow-[0_0_8px_rgba(58,255,0,0.15)]'
                                  : 'border-blue-500/80 bg-graphite-900 shadow-xs'
                              }`}
                            >
                              <img 
                                src={getCharacterImage(altChar.name, altChar.imageUrl)} 
                                alt={altChar.name} 
                                className="w-full h-full object-contain p-0.5 pb-2.5 group-hover/alt:scale-105 transition-transform duration-500 drop-shadow-sm" 
                                crossOrigin="anonymous" 
                              />

                              {/* Type Badge */}
                              <div className="absolute top-0.5 left-0.5 z-10">
                                {altChar.type === 'Ativo' ? (
                                  <span className="bg-loud-500 text-black text-[5px] font-black px-1 py-0.2 rounded uppercase italic shadow flex items-center gap-0.5">
                                    <Zap size={4.5} fill="currentColor" /> Ativa
                                  </span>
                                ) : (
                                  <span className="bg-blue-600 text-white text-[5px] font-black px-1 py-0.2 rounded uppercase italic shadow flex items-center gap-0.5">
                                    <Shield size={4.5} fill="currentColor" /> Passiva
                                  </span>
                                )}
                              </div>

                              {/* Mini Skill Icon Badge */}
                              {getCharacterSkillIcon(altChar.name, altChar.skillIcon) && (
                                <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded bg-graphite-950/90 border border-white/20 p-0.5 shadow-xs z-10" title={altChar.ability}>
                                  <img src={getCharacterSkillIcon(altChar.name, altChar.skillIcon)} alt={altChar.name} className="w-full h-full object-contain" />
                                </div>
                              )}

                              {/* Name Bar */}
                              <div className="absolute bottom-0 left-0 w-full bg-graphite-900/90 py-0.5 px-0.5 z-10 border-t border-white/5">
                                <p className="text-amber-400 text-[6px] font-black text-center truncate uppercase italic leading-tight">{altChar.name}</p>
                              </div>

                              {/* Hover Overlay */}
                              <div className="absolute inset-0 bg-graphite-900/95 opacity-0 group-hover/alt:opacity-100 transition-opacity flex flex-col items-center justify-center p-0.5 text-center z-20 gap-0.5">
                                <p className="text-amber-400 text-[6.5px] font-black uppercase italic truncate w-full px-0.5 leading-tight">
                                  {altChar.name}
                                </p>
                                <button
                                  onClick={() => handleSwapAlternative(team.id, player.id, altIdx)}
                                  title="Trocar com habilidade principal"
                                  className="bg-loud-500 hover:bg-loud-400 text-black text-[6px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase shadow tracking-wider transition-colors cursor-pointer"
                                >
                                  <ArrowLeftRight size={6} /> Trocar
                                </button>
                                <button
                                  onClick={() => handleRemoveAlternative(team.id, player.id, altIdx)}
                                  title="Remover opção alternativa"
                                  className="text-red-400 hover:text-red-300 text-[5.5px] font-bold uppercase underline cursor-pointer"
                                >
                                  Remover
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Add Alternative Button */}
                        {altSkillsCount < 4 && (
                          <button
                            onClick={() => openSelection(team.id, player.id, 'alternativeSkill')}
                            className="aspect-[3/4] w-14 sm:w-16 shrink-0 rounded-lg sm:rounded-xl border border-dashed border-amber-500/30 hover:border-amber-400/80 bg-amber-500/5 hover:bg-amber-500/10 transition-all flex flex-col items-center justify-center text-amber-400/60 hover:text-amber-400 group/add p-0.5 cursor-pointer"
                            title="Adicionar habilidade alternativa (Ativa ou Passiva)"
                          >
                            <Plus size={12} className="group-hover/add:scale-125 transition-transform" />
                            <span className="text-[6px] font-bold uppercase mt-0.5 text-center leading-tight">
                              + Reserva
                            </span>
                          </button>
                        )}

                        {altSkillsCount === 0 && (
                          <span className="text-[8px] text-white/30 italic py-1">
                            Nenhuma habilidade alternativa. Clique em "+ Reserva" para adicionar opções.
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-graphite-900 text-premium-text animate-fade-in pb-16">
      {/* Header Section */}
      <div className="bg-graphite-800 border-b border-white/5 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-loud-500 italic tracking-tighter">
                Composição de Equipe
              </h2>
              <span className="text-xs bg-loud-500/10 text-loud-400 border border-loud-500/20 font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                Multi-Equipes
              </span>
            </div>
            <p className="text-premium-muted mt-2 text-sm max-w-2xl">
              Monte sua estratégia perfeita combinando habilidades (máx. 1 ativa por jogador), pets e itens. Crie e compare múltiplas equipes com visualização em grade ou linha por linha.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle: Grid vs List */}
            <div className="flex bg-graphite-900 border border-white/10 rounded-full p-1 text-xs font-bold uppercase shadow-inner">
              <button
                onClick={() => setViewLayout('grid')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all ${viewLayout === 'grid' ? 'bg-loud-500 text-black font-black shadow' : 'text-premium-muted hover:text-white'}`}
                title="Visualização em Grade / Cards"
              >
                <LayoutGrid size={15} /> Cards
              </button>
              <button
                onClick={() => setViewLayout('list')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all ${viewLayout === 'list' ? 'bg-loud-500 text-black font-black shadow' : 'text-premium-muted hover:text-white'}`}
                title="Visualização por Lista (Linha por Linha)"
              >
                <List size={15} /> Lista
              </button>
            </div>

            {/* Scope: Active Team vs All Teams */}
            <div className="flex bg-graphite-900 border border-white/10 rounded-full p-1 text-xs font-bold uppercase">
              <button
                onClick={() => setShowAllTeams(false)}
                className={`px-3.5 py-2 rounded-full transition-all ${!showAllTeams ? 'bg-graphite-700 text-white font-black' : 'text-premium-muted hover:text-white'}`}
                title="Visualizar apenas a equipe ativa"
              >
                Equipe Atual
              </button>
              <button
                onClick={() => setShowAllTeams(true)}
                className={`px-3.5 py-2 rounded-full transition-all ${showAllTeams ? 'bg-graphite-700 text-white font-black' : 'text-premium-muted hover:text-white'}`}
                title="Visualizar todas as equipes cadastradas"
              >
                Ver Todas ({teams.length})
              </button>
            </div>

            {/* Toggle Alternative Skills */}
            <button
              onClick={handleToggleAllAlternativeSkills}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all text-xs font-bold uppercase border cursor-pointer ${
                showAlternativeSkills 
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.15)]' 
                  : 'bg-graphite-900 text-premium-muted border-white/10 hover:text-white'
              }`}
              title={showAlternativeSkills ? "Ocultar Habilidades Alternativas (Todas)" : "Mostrar Habilidades Alternativas (Todas)"}
            >
              {showAlternativeSkills ? <Eye size={15} /> : <EyeOff size={15} />}
              <span>Alternativas: {showAlternativeSkills ? 'Visíveis' : 'Ocultas'}</span>
            </button>

            {/* Add Team Button */}
            <button
              onClick={handleAddTeam}
              className="flex items-center gap-2 px-5 py-2.5 bg-graphite-700 hover:bg-graphite-600 text-white rounded-full transition-all font-bold text-xs uppercase tracking-wider border border-white/10"
              title="Criar mais uma equipe"
            >
              <Plus size={16} /> Nova Equipe
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-6 space-y-8">
        {/* TEAM TABS BAR (Múltiplas Equipes) */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-graphite-800/90 backdrop-blur-md p-3 md:p-4 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 md:pb-0 flex-1 min-w-0">
            <span className="text-[10px] font-black uppercase text-premium-muted tracking-widest pl-2 shrink-0">
              Equipes:
            </span>
            {teams.map((t, idx) => {
              const isActive = t.id === activeTeamId && !showAllTeams;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTeamId(t.id);
                    if (showAllTeams) setShowAllTeams(false);
                  }}
                  className={`group shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                    isActive 
                      ? 'bg-loud-500 text-black border-loud-400 shadow-[0_0_15px_rgba(58,255,0,0.3)]' 
                      : 'bg-graphite-900 text-premium-muted hover:text-white border-white/5 hover:border-white/20'
                  }`}
                >
                  <Trophy size={13} className={isActive ? 'text-black' : 'text-loud-500'} />
                  <span className="truncate max-w-[120px] md:max-w-[160px]">
                    {t.name || `Equipe ${idx + 1}`}
                  </span>
                  {t.tag && (
                    <span className={`text-[9px] px-1 rounded ${isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-white/60'}`}>
                      {t.tag}
                    </span>
                  )}
                </button>
              );
            })}

            <button
              onClick={handleAddTeam}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-loud-500 hover:text-white bg-loud-500/10 hover:bg-loud-500/20 border border-loud-500/30 transition-all uppercase tracking-wider"
              title="Adicionar mais uma equipe à lista"
            >
              <Plus size={14} /> + Adicionar
            </button>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-loud-500/15 hover:bg-loud-500/30 text-loud-400 hover:text-loud-300 rounded-xl transition-all text-xs font-black uppercase tracking-wider border border-loud-500/40 cursor-pointer shadow-[0_0_15px_rgba(58,255,0,0.15)] hover:scale-102"
              title="Comparar duas ou mais habilidades lado a lado nesta tela"
            >
              <Scale size={14} className="text-loud-400" />
              <span>Comparar Habilidades</span>
            </button>
            {onNavigate && (
              <button
                onClick={() => onNavigate('/comparativo-meta')}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-graphite-900 hover:bg-graphite-800 text-premium-muted hover:text-white rounded-xl transition-all text-xs font-black uppercase tracking-wider border border-white/10 cursor-pointer shadow-sm hover:scale-102"
                title="Abrir Laboratório de Meta Comps & Estatísticas"
              >
                <Swords size={14} className="text-loud-400" />
                <span>Meta Comps</span>
              </button>
            )}
            <button
              onClick={() => handleOpenResetModal(showAllTeams ? 'all' : currentTeam.id, showAllTeams ? 'Todas as Equipes' : currentTeam.name)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-graphite-900 hover:bg-red-500/15 text-premium-muted hover:text-red-400 rounded-xl transition-all text-xs font-black uppercase tracking-wider border border-white/10 hover:border-red-500/30 cursor-pointer"
              title={showAllTeams ? "Limpar todas as habilidades e equipamentos de todas as equipes" : "Limpar todas as habilidades e equipamentos da equipe atual"}
            >
              <RotateCcw size={14} />
              <span>Limpar Tudo</span>
            </button>
            <button
              onClick={() => {
                if (showAllTeams) {
                  downloadDivAsImage('comp-builder-all', 'todas-as-equipes');
                } else {
                  downloadDivAsImage(`comp-team-${currentTeam.id}`, sanitizeFileName(currentTeam.name || 'equipe'));
                }
              }}
              className="btn-loud flex items-center gap-2 text-xs py-2.5 px-5"
            >
              <ImageIcon size={16} /> {showAllTeams ? 'SALVAR TODAS EM PNG' : 'SALVAR EM PNG'}
            </button>
          </div>
        </div>

        {/* --- MAIN DISPLAY --- */}
        {showAllTeams ? (
          <div id="comp-builder-all" className="space-y-8">
            <div className="text-center py-2">
              <h3 className="text-xl font-display font-black uppercase tracking-wider text-loud-500 italic">
                Comparativo de Todas as Equipes ({teams.length})
              </h3>
              <p className="text-xs text-premium-muted uppercase tracking-widest mt-1">
                Visualização unificada de composições táticas
              </p>
            </div>
            {teams.map(team => renderTeam(team, false))}
          </div>
        ) : (
          renderTeam(currentTeam, true)
        )}
      </div>

      {/* Selection Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-graphite-900/95 backdrop-blur-xl p-4 animate-fade-in">
          <div className="bg-graphite-800 border-2 border-loud-500/30 rounded-[2.5rem] w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-graphite-900/50">
              <div className="flex-1">
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-white italic tracking-tighter uppercase flex items-center gap-3">
                  {selectingFor?.slotType === 'skill' && (
                    (selectingFor.slotIndex || 0) > 0 ? (
                      <><Shield className="text-blue-400" /> Selecionar Habilidade Passiva (Hab. {(selectingFor.slotIndex || 0) + 1})</>
                    ) : (
                      <><Zap className="text-loud-500" /> Selecionar Habilidade Ativa (Hab. 1)</>
                    )
                  )}
                  {selectingFor?.slotType === 'alternativeSkill' && <><Sparkles className="text-amber-400" /> Habilidade Alternativa (Opção Ativa ou Passiva)</>}
                  {selectingFor?.slotType === 'pet' && <><PawPrint className="text-loud-500" /> Selecionar Pet</>}
                  {selectingFor?.slotType === 'loadout' && <><Briefcase className="text-loud-500" /> Selecionar Carregamento</>}
                </h3>
                <p className="text-loud-500 text-xs font-black uppercase tracking-widest mt-1">
                  {selectingFor?.slotType === 'skill' ? (
                    (selectingFor.slotIndex || 0) > 0 
                      ? `Slot ${(selectingFor.slotIndex || 0) + 1}: Exibindo apenas habilidades passivas permitidas para este slot.`
                      : 'Slot 1: Escolha a habilidade ativa principal do jogador.'
                  ) : selectingFor?.slotType === 'alternativeSkill' ? (
                    'Escolha uma opção de habilidade alternativa (Ativa ou Passiva) para troca tática rápida.'
                  ) : selectingFor?.slotType === 'pet' ? (
                    'Escolha um companheiro de batalha.'
                  ) : (
                    'Escolha um item de suporte tático.'
                  )}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                {/* Skill Type Filter Tabs if selecting a skill or alternative skill */}
                {(selectingFor?.slotType === 'skill' || selectingFor?.slotType === 'alternativeSkill') && (
                  (selectingFor?.slotType === 'skill' && (selectingFor.slotIndex || 0) > 0) ? (
                    <div className="flex items-center gap-2 bg-blue-600/20 border border-blue-500/40 text-blue-300 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider shadow-sm">
                      <Shield size={14} fill="currentColor" />
                      <span>Apenas Habilidades Passivas</span>
                    </div>
                  ) : (selectingFor?.slotType === 'skill' && selectingFor.slotIndex === 0) ? (
                    <div className="flex bg-graphite-900 border border-white/10 rounded-full p-1 text-xs font-bold uppercase">
                      <button
                        onClick={() => setSkillTypeFilter('ativo')}
                        className={`px-4 py-1.5 rounded-full transition-colors ${skillTypeFilter === 'ativo' ? 'bg-loud-500 text-black font-black' : 'text-premium-muted hover:text-white'}`}
                      >
                        Ativas (Hab. 1)
                      </button>
                      <button
                        onClick={() => setSkillTypeFilter('todas')}
                        className={`px-4 py-1.5 rounded-full transition-colors ${skillTypeFilter === 'todas' ? 'bg-loud-500 text-black font-black' : 'text-premium-muted hover:text-white'}`}
                      >
                        Todas
                      </button>
                    </div>
                  ) : (
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
                  )
                )}

                {/* Compare Button inside Skill Selector */}
                {(selectingFor?.slotType === 'skill' || selectingFor?.slotType === 'alternativeSkill') && (
                  <button
                    type="button"
                    onClick={openCompareFromSelection}
                    className="flex items-center gap-1.5 px-4 py-2 bg-loud-500/15 hover:bg-loud-500/30 text-loud-400 hover:text-loud-300 rounded-full text-xs font-black uppercase tracking-wider border border-loud-500/40 transition-all cursor-pointer shadow-xs"
                    title="Comparar duas ou mais habilidades lado a lado"
                  >
                    <Scale size={13} />
                    <span>Comparar</span>
                  </button>
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
                        <div className="flex-1 relative overflow-hidden bg-graphite-950 flex items-center justify-center">
                          <img 
                            src={(selectingFor?.slotType === 'skill' || selectingFor?.slotType === 'alternativeSkill') ? getCharacterImage(item.name, item.imageUrl) : item.imageUrl} 
                            alt={item.name} 
                            className={`w-full h-full group-hover:scale-105 transition-transform duration-500 ${selectingFor?.slotType === 'pet' || selectingFor?.slotType === 'loadout' ? 'object-contain p-3' : 'object-contain p-1.5 pb-2 drop-shadow-md'}`} 
                            loading="lazy"
                          />

                          {/* Skill Type Badge in Modal */}
                          {(selectingFor?.slotType === 'skill' || selectingFor?.slotType === 'alternativeSkill') && charItem.type && (
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

                          {/* Mini Skill Icon Badge (identical to Laboratório Tático e Meta) */}
                          {(selectingFor?.slotType === 'skill' || selectingFor?.slotType === 'alternativeSkill') && getCharacterSkillIcon(item.name, charItem.skillIcon) && (
                            <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-graphite-950/90 border border-white/20 p-0.5 shadow-md z-10" title={charItem.ability}>
                              <img src={getCharacterSkillIcon(item.name, charItem.skillIcon)} alt={item.name} className="w-full h-full object-contain" />
                            </div>
                          )}

                          {/* Description Overlay on Hover */}
                          <div className="absolute inset-0 bg-graphite-900/95 opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-center text-center overflow-y-auto z-20">
                            <p className="text-loud-500 text-xs font-black uppercase italic mb-1">{item.name}</p>
                            {'ability' in item && (
                              <p className="text-[9px] text-premium-muted leading-relaxed italic line-clamp-3">{item.ability || 'Sem descrição tática'}</p>
                            )}
                            {(selectingFor?.slotType === 'skill' || selectingFor?.slotType === 'alternativeSkill') && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addSlotAndCompare(item.name);
                                }}
                                className="mt-2 inline-flex items-center justify-center gap-1 text-[8px] font-black uppercase tracking-wider bg-loud-500/20 hover:bg-loud-500 text-loud-400 hover:text-black py-1 px-2 rounded-lg border border-loud-500/40 transition-all cursor-pointer"
                                title="Adicionar ao comparador de habilidades"
                              >
                                <Scale size={9} /> Comparar
                              </button>
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

      {/* Skill Comparison Modal (Comparar Duas ou Mais Habilidades Lado a Lado na Composição) */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-[115] flex items-center justify-center bg-graphite-950/90 backdrop-blur-xl p-2 sm:p-4 md:p-6 animate-fade-in">
          <div className="bg-graphite-900 border-2 border-loud-500/40 rounded-3xl w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.85)]">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-white/10 bg-graphite-950/60 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-loud-500/15 border border-loud-500/40 flex items-center justify-center text-loud-400 shrink-0 shadow-[0_0_20px_rgba(58,255,0,0.25)]">
                  <Scale size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-display font-black text-white italic tracking-tighter uppercase">
                      Comparativo de Habilidades
                    </h3>
                    <span className="text-[10px] font-black uppercase bg-loud-500 text-black px-2 py-0.5 rounded italic">
                      64 Oficiais Garena
                    </span>
                  </div>
                  <p className="text-xs text-premium-muted mt-0.5">
                    Compare 2 a 4 habilidades lado a lado com tempo de recarga, atributos e sinergias táticas
                  </p>
                </div>
              </div>

              {/* Controls: Slot Counter & Close */}
              <div className="flex items-center gap-3 self-end lg:self-center">
                <div className="flex bg-graphite-900 border border-white/10 rounded-full p-1 text-xs font-bold uppercase">
                  <button
                    onClick={() => {
                      if (compareSlots.length > 2) setCompareSlots(compareSlots.slice(0, 2));
                      else if (compareSlots.length < 2) setCompareSlots(['Morse', 'Tatsuya']);
                    }}
                    className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                      compareSlots.length === 2 ? 'bg-loud-500 text-black font-black' : 'text-premium-muted hover:text-white'
                    }`}
                  >
                    2 Habilidades
                  </button>
                  <button
                    onClick={() => {
                      if (compareSlots.length < 3) addCompareSlot();
                      else if (compareSlots.length > 3) setCompareSlots(compareSlots.slice(0, 3));
                    }}
                    className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                      compareSlots.length === 3 ? 'bg-loud-500 text-black font-black' : 'text-premium-muted hover:text-white'
                    }`}
                  >
                    3 Habilidades
                  </button>
                  <button
                    onClick={() => {
                      while (compareSlots.length < 4) {
                        const popular = ['Morse', 'Tatsuya', 'Sonia', 'Alok', 'Orion', 'Kelly', 'Hayato', 'Moco'];
                        const next = popular.find(c => !compareSlots.includes(c)) || GARENA_CHARACTERS.find(g => !compareSlots.includes(g.name))?.name || 'Kelly';
                        compareSlots.push(next);
                      }
                      setCompareSlots([...compareSlots.slice(0, 4)]);
                    }}
                    className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                      compareSlots.length === 4 ? 'bg-loud-500 text-black font-black' : 'text-premium-muted hover:text-white'
                    }`}
                  >
                    4 Habilidades
                  </button>
                </div>

                <button
                  onClick={() => setIsCompareModalOpen(false)}
                  className="p-2.5 hover:bg-graphite-800 rounded-full transition-all hover:rotate-90 text-premium-muted hover:text-white border border-white/5 cursor-pointer"
                  title="Fechar Comparador"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Presets and Player Quick Load Toolbar */}
            <div className="px-5 sm:px-6 py-3 border-b border-white/5 bg-graphite-950/40 flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Presets */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase text-premium-muted tracking-wider">
                  Presets Rápidos:
                </span>
                {COMPARE_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCompareSlots([...p.chars]);
                      setActiveSlotPicker(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-graphite-800/80 hover:bg-loud-500/20 text-white/80 hover:text-loud-400 border border-white/5 hover:border-loud-500/30 transition-all font-bold text-[11px] cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Load Player Skills */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-loud-400 tracking-wider flex items-center gap-1">
                  <Users size={12} /> Carregar do Jogador:
                </span>
                <select
                  onChange={(e) => {
                    const pid = Number(e.target.value);
                    if (pid) loadPlayerSkillsIntoCompare(pid);
                  }}
                  defaultValue=""
                  className="bg-graphite-800 text-white border border-white/10 rounded-lg px-2.5 py-1 text-xs font-bold outline-none cursor-pointer focus:border-loud-500"
                >
                  <option value="" disabled>Selecione um jogador...</option>
                  {currentTeam.players.map(p => (
                    <option key={p.id} value={p.id} className="bg-graphite-900 text-white">
                      {p.name || `Jogador ${p.id}`} ({p.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notification Banner */}
            {compareNotification && (
              <div className="mx-6 mt-3 p-2.5 bg-loud-500/15 border border-loud-500/40 text-loud-400 rounded-xl text-xs font-bold flex items-center justify-between animate-fade-in shadow-[0_0_15px_rgba(58,255,0,0.15)]">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-loud-400" />
                  <span>{compareNotification}</span>
                </div>
                <button 
                  onClick={() => setCompareNotification(null)}
                  className="text-white/40 hover:text-white p-0.5"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Comparison Columns Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-graphite-950/20">
              <div className={`grid grid-cols-1 ${
                compareSlots.length === 2 ? 'md:grid-cols-2' : 
                compareSlots.length === 3 ? 'md:grid-cols-3' : 
                'md:grid-cols-2 lg:grid-cols-4'
              } gap-4`}>
                {compareSlots.map((charName, idx) => {
                  const char = getCharData(charName);
                  const isPickerOpen = activeSlotPicker === idx;
                  const synergy = getTacticalSynergy(charName);

                  return (
                    <div 
                      key={idx}
                      className="bg-graphite-850/90 rounded-2xl border-2 border-white/10 hover:border-loud-500/40 transition-all flex flex-col overflow-hidden shadow-xl"
                    >
                      {/* Column Header: Slot Number & Switch Action */}
                      <div className="p-3 bg-graphite-900 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase text-loud-400 bg-loud-500/10 border border-loud-500/20 px-2 py-0.5 rounded">
                            Habilidade {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-white truncate max-w-[120px]">
                            {char?.name || charName}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (isPickerOpen) {
                                setActiveSlotPicker(null);
                              } else {
                                setActiveSlotPicker(idx);
                                setSlotPickerSearch('');
                              }
                            }}
                            className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                              isPickerOpen 
                                ? 'bg-loud-500 text-black border-loud-400' 
                                : 'bg-graphite-800 text-premium-muted hover:text-white border-white/10 hover:border-white/20'
                            }`}
                            title="Trocar personagem desta coluna"
                          >
                            {isPickerOpen ? 'Fechar' : 'Trocar'}
                          </button>

                          {compareSlots.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeCompareSlot(idx)}
                              className="p-1 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                              title="Remover esta coluna de comparação"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Character Picker Panel if open */}
                      {isPickerOpen ? (
                        <div className="p-3 flex-1 flex flex-col gap-2.5 bg-graphite-900/95 overflow-hidden">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-loud-500" size={14} />
                            <input
                              type="text"
                              placeholder="Buscar (64 personagens)..."
                              value={slotPickerSearch}
                              onChange={(e) => setSlotPickerSearch(e.target.value)}
                              autoFocus
                              className="w-full bg-graphite-950 border border-white/10 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white placeholder-white/30 outline-none focus:border-loud-500"
                            />
                          </div>

                          <div className="flex bg-graphite-950 border border-white/5 rounded-lg p-0.5 text-[9px] font-bold uppercase">
                            <button
                              onClick={() => setSlotPickerTypeFilter('todas')}
                              className={`flex-1 py-1 rounded transition-colors ${slotPickerTypeFilter === 'todas' ? 'bg-loud-500 text-black font-black' : 'text-premium-muted hover:text-white'}`}
                            >
                              Todas
                            </button>
                            <button
                              onClick={() => setSlotPickerTypeFilter('ativo')}
                              className={`flex-1 py-1 rounded transition-colors ${slotPickerTypeFilter === 'ativo' ? 'bg-loud-500 text-black font-black' : 'text-premium-muted hover:text-white'}`}
                            >
                              Ativas
                            </button>
                            <button
                              onClick={() => setSlotPickerTypeFilter('passivo')}
                              className={`flex-1 py-1 rounded transition-colors ${slotPickerTypeFilter === 'passivo' ? 'bg-loud-500 text-black font-black' : 'text-premium-muted hover:text-white'}`}
                            >
                              Passivas
                            </button>
                          </div>

                          <div className="flex-1 overflow-y-auto max-h-[400px] custom-scrollbar space-y-1.5 pr-1">
                            {GARENA_CHARACTERS
                              .filter(g => {
                                const q = slotPickerSearch.toLowerCase();
                                const matchesSearch = g.name.toLowerCase().includes(q) || 
                                                      g.ability.toLowerCase().includes(q) || 
                                                      g.role.toLowerCase().includes(q);
                                const matchesType = slotPickerTypeFilter === 'todas' || 
                                                    (slotPickerTypeFilter === 'ativo' && g.type === 'Ativo') ||
                                                    (slotPickerTypeFilter === 'passivo' && g.type === 'Passivo');
                                return matchesSearch && matchesType;
                              })
                              .map((g) => (
                                <button
                                  key={g.id}
                                  onClick={() => changeCompareSlot(idx, g.name)}
                                  className="w-full flex items-center gap-2 p-1.5 rounded-lg bg-graphite-950 hover:bg-loud-500/15 border border-white/5 hover:border-loud-500/30 text-left transition-all cursor-pointer group/pick"
                                >
                                  <img
                                    src={g.skill_icon || g.head_icon}
                                    alt={g.name}
                                    className="w-8 h-8 rounded-md object-cover bg-graphite-900 border border-white/10 shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[11px] font-black text-white group-hover/pick:text-loud-400 truncate">
                                        {g.name}
                                      </span>
                                      <span className={`text-[7px] font-black uppercase px-1 py-0.2 rounded ${
                                        g.type === 'Ativo' ? 'bg-loud-500 text-black' : 'bg-blue-600 text-white'
                                      }`}>
                                        {g.type}
                                      </span>
                                    </div>
                                    <p className="text-[9px] text-premium-muted truncate">{g.ability}</p>
                                  </div>
                                </button>
                              ))}
                          </div>
                        </div>
                      ) : char ? (
                        /* Complete Comparative Character View */
                        <div className="flex-1 flex flex-col justify-between p-4 space-y-4">
                          {/* Top Visual: Cover Banner + High-Res Skill Icon */}
                          <div className="relative rounded-xl overflow-hidden bg-graphite-950 border border-white/10 p-3 pt-6 flex flex-col items-center text-center">
                            {/* Background Art Banner */}
                            {char.cover_img && (
                              <img
                                src={char.cover_img}
                                alt={char.name}
                                className="absolute inset-0 w-full h-full object-cover object-top opacity-20 pointer-events-none"
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-graphite-950 via-graphite-950/70 to-transparent pointer-events-none" />

                            {/* Centered Skill Icon */}
                            <div className="relative z-10 w-16 h-16 rounded-2xl bg-graphite-900 p-1 border-2 border-loud-500/80 shadow-[0_0_20px_rgba(58,255,0,0.3)] mb-2 group-hover:scale-105 transition-transform">
                              <img
                                src={char.skill_icon || char.head_icon}
                                alt={char.name}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            </div>

                            {/* Character and Skill Title */}
                            <div className="relative z-10">
                              <div className="flex items-center justify-center gap-1.5">
                                <h4 className="text-lg font-display font-black text-white italic tracking-tight uppercase">
                                  {char.name}
                                </h4>
                                {char.is_new && (
                                  <span className="text-[7.5px] font-black bg-red-600 text-white px-1.5 py-0.2 rounded uppercase">
                                    Novo
                                  </span>
                                )}
                              </div>
                              <p className="text-loud-400 text-xs font-black uppercase italic tracking-wider">
                                {char.ability}
                              </p>
                              {char.abstract && (
                                <p className="text-[9.5px] text-premium-muted italic mt-0.5">
                                  &ldquo;{char.abstract}&rdquo;
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Tactical Attributes Grid */}
                          <div className="grid grid-cols-2 gap-2 text-center text-xs">
                            {/* Skill Type Badge */}
                            <div className={`p-2.5 rounded-xl border flex flex-col items-center justify-center ${
                              char.type === 'Ativo' 
                                ? 'bg-loud-500/10 border-loud-500/40 text-loud-400 shadow-[0_0_10px_rgba(58,255,0,0.15)]' 
                                : 'bg-blue-600/10 border-blue-500/40 text-blue-400'
                            }`}>
                              <span className="text-[8px] font-black uppercase text-premium-muted tracking-wider">
                                Tipo de Habilidade
                              </span>
                              <span className="font-black flex items-center gap-1 text-[11px] mt-0.5">
                                {char.type === 'Ativo' ? (
                                  <><Zap size={12} fill="currentColor" /> Habilidade Ativa</>
                                ) : (
                                  <><Shield size={12} fill="currentColor" /> Habilidade Passiva</>
                                )}
                              </span>
                            </div>

                            {/* Cooldown Badge */}
                            <div className="p-2.5 rounded-xl border border-white/10 bg-graphite-950 flex flex-col items-center justify-center">
                              <span className="text-[8px] font-black uppercase text-premium-muted tracking-wider">
                                Tempo de Recarga
                              </span>
                              <span className="font-black text-white text-[11px] mt-0.5">
                                {char.cooldown ? `⏱️ ${char.cooldown}s` : '♾️ Contínua'}
                              </span>
                            </div>
                          </div>

                          {/* Role Tag */}
                          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-graphite-950 border border-white/5 text-[10px]">
                            <span className="text-premium-muted uppercase font-bold">Função Tática:</span>
                            <span className="text-loud-400 font-black uppercase tracking-wider">
                              {char.role || 'Geral / Flex'}
                            </span>
                          </div>

                          {/* Official Ability Description */}
                          <div className="p-3.5 rounded-xl bg-graphite-950/80 border border-white/10 space-y-1">
                            <span className="text-[8px] font-black uppercase text-loud-400 tracking-wider block">
                              Descrição Oficial (Garena):
                            </span>
                            <p className="text-[11px] text-white/90 leading-relaxed italic">
                              {char.ability_introduction}
                            </p>
                          </div>

                          {/* Tactical Synergies and Combos */}
                          <div className="p-3 rounded-xl bg-graphite-900 border border-white/5 space-y-2">
                            <span className="text-[8px] font-black uppercase text-amber-400 tracking-wider block flex items-center gap-1">
                              <Sparkles size={10} /> Combos Recomendados:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {synergy.combos.map((comboName, cIdx) => (
                                <button
                                  key={cIdx}
                                  onClick={() => {
                                    // If this character isn't already in compareSlots, replace or add
                                    if (!compareSlots.includes(comboName)) {
                                      // find another slot or swap
                                      const swapTarget = idx === 0 ? 1 : 0;
                                      changeCompareSlot(swapTarget, comboName);
                                    }
                                  }}
                                  className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/5 hover:bg-loud-500/20 text-white/80 hover:text-loud-400 border border-white/10 transition-colors cursor-pointer"
                                  title={`Clique para comparar ${comboName}`}
                                >
                                  + {comboName}
                                </button>
                              ))}
                            </div>
                            <p className="text-[9px] text-premium-muted italic leading-tight">
                              {synergy.notes}
                            </p>
                          </div>

                          {/* One-Click Action: Equip to Team */}
                          <div className="pt-2 border-t border-white/10 space-y-2">
                            <div className="flex items-center justify-between text-[9px] font-bold text-premium-muted uppercase">
                              <span>Equipar na Equipe:</span>
                              <span className="text-loud-400">{currentTeam.name}</span>
                            </div>

                            <div className="flex flex-col gap-1.5">
                              {/* Player Selector */}
                              <select
                                value={compareTargetPlayerId}
                                onChange={(e) => setCompareTargetPlayerId(Number(e.target.value))}
                                className="w-full bg-graphite-950 text-white border border-white/15 rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none cursor-pointer focus:border-loud-500"
                              >
                                {currentTeam.players.map(p => (
                                  <option key={p.id} value={p.id} className="bg-graphite-900 text-white">
                                    {p.name || `Jogador ${p.id}`} &bull; {p.role}
                                  </option>
                                ))}
                              </select>

                              {/* Action Buttons */}
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEquipFromCompare(char.name, compareTargetPlayerId, false)}
                                  className="btn-loud py-2 px-2 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                                  title={`Equipar ${char.name} nas habilidades principais`}
                                >
                                  <Zap size={11} fill="currentColor" /> Equipar Principal
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleEquipFromCompare(char.name, compareTargetPlayerId, true)}
                                  className="py-2 px-2 text-[10px] font-black uppercase tracking-wider bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black rounded-xl border border-amber-500/40 transition-all flex items-center justify-center gap-1 cursor-pointer"
                                  title={`Equipar ${char.name} como alternativa`}
                                >
                                  <Sparkles size={11} /> Alternativa
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-8 text-center text-premium-muted">
                          <p className="text-xs">Personagem não encontrado.</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Bottom Bar */}
            <div className="p-4 sm:p-5 bg-graphite-950/70 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-premium-muted text-[11px]">
                Comparando <strong className="text-white">{compareSlots.length}</strong> habilidades &bull; Base oficial Garena sincronizada
              </span>

              <div className="flex items-center gap-3">
                {compareSlots.length < 4 && (
                  <button
                    type="button"
                    onClick={addCompareSlot}
                    className="flex items-center gap-1.5 px-4 py-2 bg-loud-500/10 hover:bg-loud-500/20 text-loud-400 rounded-full font-bold uppercase tracking-wider border border-loud-500/30 transition-all cursor-pointer"
                  >
                    <Plus size={14} /> Adicionar Habilidade
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCompareModalOpen(false)}
                  className="px-6 py-2 bg-graphite-800 hover:bg-graphite-700 text-white rounded-full font-bold uppercase tracking-wider transition-all cursor-pointer border border-white/10"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Limpar Tudo */}
      {resetModal && resetModal.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-graphite-950/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-graphite-900 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                  <RotateCcw size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-display font-black uppercase italic tracking-tighter text-white">
                    Limpar Tudo
                  </h3>
                  <p className="text-xs text-red-400 font-bold uppercase tracking-wider">
                    {resetModal.teamName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResetModal(null)}
                className="text-white/40 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-3 text-xs text-premium-muted leading-relaxed">
              <p>
                Tem certeza que deseja limpar tudo? Esta ação removerá{' '}
                <strong className="text-white">todas as 4 habilidades principais</strong>,{' '}
                <strong className="text-white">habilidades alternativas</strong>,{' '}
                <strong className="text-white">pets</strong> e{' '}
                <strong className="text-white">itens de carregamento</strong>{' '}
                {resetModal.teamId === 'all' ? 'de todas as equipes cadastradas' : 'desta equipe'}.
              </p>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-graphite-800/80 border border-white/5 cursor-pointer hover:border-white/15 transition-all text-white/80 select-none">
                <input
                  type="checkbox"
                  checked={resetIncludeProfiles}
                  onChange={(e) => setResetIncludeProfiles(e.target.checked)}
                  className="rounded border-white/20 text-red-500 focus:ring-0 cursor-pointer w-4 h-4"
                />
                <span className="text-[11px] font-bold">
                  Resetar também nomes, fotos dos jogadores e logo
                </span>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setResetModal(null)}
                className="px-4 py-2.5 bg-graphite-800 hover:bg-graphite-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.35)] cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Sim, Limpar Tudo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Composition;
