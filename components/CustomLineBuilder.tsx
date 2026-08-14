import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, UserPlus, Trash2, Plus, Edit2, Copy, Check, Download, 
  Sparkles, Shield, Trophy, Instagram, ExternalLink, Search, 
  RotateCcw, Save, FolderOpen, X, Swords, Crown, UserCheck, 
  Crosshair, Clock, Calendar, Shuffle, HelpCircle
} from 'lucide-react';
import html2canvas from 'html2canvas';

export interface LFTPlayer {
  id: string;
  name: string;
  role: string;
  age: number;
  availability: string;
  photoUrl?: string;
  instagram?: string;
  highlightsUrl?: string;
  achievements?: string;
  teamsHistory?: string;
  tournamentsHistory?: string;
  createdAt: number;
  userId: string;
}

export interface LineMember {
  id?: string;
  name: string;
  role: string;
  age?: number;
  photoUrl?: string;
  instagram?: string;
  highlightsUrl?: string;
  availability?: string;
  achievements?: string;
  teamsHistory?: string;
  isCustom?: boolean;
}

export interface LineSlot {
  id: string;
  slotLabel: string;
  defaultRole: string;
  iconType: 'igl' | 'rush' | 'support' | 'sub' | 'coach';
  player: LineMember | null;
}

export interface SavedLine {
  id: string;
  name: string;
  tag: string;
  description: string;
  slots: LineSlot[];
  savedAt: number;
}

const DEFAULT_SLOTS: LineSlot[] = [
  { id: 'slot-igl', slotLabel: 'CAPITÃO (IGL)', defaultRole: 'CAPITÃO (IGL)', iconType: 'igl', player: null },
  { id: 'slot-rush1', slotLabel: 'RUSH 1', defaultRole: 'RUSH', iconType: 'rush', player: null },
  { id: 'slot-rush2', slotLabel: 'RUSH 2', defaultRole: 'RUSH', iconType: 'rush', player: null },
  { id: 'slot-sup', slotLabel: 'SUPORTE', defaultRole: 'SUPORTE', iconType: 'support', player: null },
  { id: 'slot-sub', slotLabel: '5º JOGADOR / RES', defaultRole: 'CORINGA', iconType: 'sub', player: null },
  { id: 'slot-coach', slotLabel: 'COACH / ANALISTA', defaultRole: 'COACH', iconType: 'coach', player: null },
];

const ROLES_LIST = ['RUSH', 'SUPORTE', 'GRANADEIRO', 'CAPITÃO (IGL)', 'COACH', 'ANALISTA', 'MANAGER', 'CORINGA', 'SNIPER'];

interface CustomLineBuilderProps {
  availablePlayers: LFTPlayer[];
  onViewPlayerDetails: (player: LFTPlayer) => void;
}

export function CustomLineBuilder({ availablePlayers, onViewPlayerDetails }: CustomLineBuilderProps) {
  const [teamName, setTeamName] = useState('LINE PRINCIPAL');
  const [teamTag, setTeamTag] = useState('META');
  const [description, setDescription] = useState('Foco em Treinos e Campeonatos Diários');
  const [slots, setSlots] = useState<LineSlot[]>(DEFAULT_SLOTS);
  const [savedLines, setSavedLines] = useState<SavedLine[]>([]);
  
  // Modal State for picking player
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [playerPickerSearch, setPlayerPickerSearch] = useState('');
  const [playerPickerRole, setPlayerPickerRole] = useState('TODAS');
  const [showCustomManualForm, setShowCustomManualForm] = useState(false);

  // Manual player form state
  const [manualName, setManualName] = useState('');
  const [manualRole, setManualRole] = useState('RUSH');
  const [manualAge, setManualAge] = useState('');
  const [manualInsta, setManualInsta] = useState('');
  const [manualPhoto, setManualPhoto] = useState('');

  // UI status
  const [copiedText, setCopiedText] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [showSavedList, setShowSavedList] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  // Load saved lines from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('lft_custom_saved_lines');
      if (stored) {
        setSavedLines(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading saved lines:', e);
    }
  }, []);

  const saveLinesToStorage = (lines: SavedLine[]) => {
    setSavedLines(lines);
    try {
      localStorage.setItem('lft_custom_saved_lines', JSON.stringify(lines));
    } catch (e) {
      console.error('Error persisting lines:', e);
    }
  };

  const handleSaveCurrentLine = () => {
    if (!teamName.trim()) {
      alert('Por favor, dê um nome para a sua line.');
      return;
    }

    const newLine: SavedLine = {
      id: `saved-${Date.now()}`,
      name: teamName.trim(),
      tag: teamTag.trim(),
      description: description.trim(),
      slots: JSON.parse(JSON.stringify(slots)),
      savedAt: Date.now(),
    };

    const updated = [newLine, ...savedLines.filter(l => l.name.toLowerCase() !== teamName.trim().toLowerCase())];
    saveLinesToStorage(updated);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
  };

  const handleLoadLine = (line: SavedLine) => {
    setTeamName(line.name);
    setTeamTag(line.tag || '');
    setDescription(line.description || '');
    setSlots(line.slots);
    setShowSavedList(false);
  };

  const handleDeleteSavedLine = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Excluir esta line salva?')) return;
    const updated = savedLines.filter(l => l.id !== id);
    saveLinesToStorage(updated);
  };

  const handleAssignPlayerToSlot = (slotId: string, player: LineMember) => {
    setSlots(prev => prev.map(s => {
      if (s.id === slotId) {
        return { ...s, player };
      }
      return s;
    }));
    setActiveSlotId(null);
    setShowCustomManualForm(false);
    resetManualForm();
  };

  const handleRemovePlayerFromSlot = (slotId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSlots(prev => prev.map(s => {
      if (s.id === slotId) {
        return { ...s, player: null };
      }
      return s;
    }));
  };

  const handleResetLine = () => {
    if (!window.confirm('Deseja limpar todos os jogadores da escalação atual?')) return;
    setSlots(DEFAULT_SLOTS.map(s => ({ ...s, player: null })));
  };

  const handleAutoFill = () => {
    if (availablePlayers.length === 0) {
      alert('Não há jogadores cadastrados no banco LFT para preenchimento automático.');
      return;
    }

    const pool = [...availablePlayers];
    const newSlots = [...slots];

    const pickAndRemove = (roleMatch: string) => {
      const idx = pool.findIndex(p => p.role.toUpperCase().includes(roleMatch.toUpperCase()));
      if (idx !== -1) {
        return pool.splice(idx, 1)[0];
      }
      return pool.length > 0 ? pool.shift() : null;
    };

    newSlots.forEach(slot => {
      if (!slot.player && pool.length > 0) {
        let picked: LFTPlayer | null = null;
        if (slot.defaultRole.includes('CAPITÃO') || slot.defaultRole.includes('IGL')) {
          picked = pickAndRemove('CAPITÃO') || pickAndRemove('IGL');
        } else if (slot.defaultRole.includes('RUSH')) {
          picked = pickAndRemove('RUSH');
        } else if (slot.defaultRole.includes('SUPORTE')) {
          picked = pickAndRemove('SUPORTE');
        } else if (slot.defaultRole.includes('COACH')) {
          picked = pickAndRemove('COACH') || pickAndRemove('ANALISTA');
        } else {
          picked = pool.shift() || null;
        }

        if (picked) {
          slot.player = {
            id: picked.id,
            name: picked.name,
            role: picked.role,
            age: picked.age,
            photoUrl: picked.photoUrl,
            instagram: picked.instagram,
            highlightsUrl: picked.highlightsUrl,
            availability: picked.availability,
            achievements: picked.achievements,
            teamsHistory: picked.teamsHistory,
            isCustom: false,
          };
        }
      }
    });

    setSlots(newSlots);
  };

  const resetManualForm = () => {
    setManualName('');
    setManualRole('RUSH');
    setManualAge('');
    setManualInsta('');
    setManualPhoto('');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !activeSlotId) return;

    const newMember: LineMember = {
      name: manualName.trim(),
      role: manualRole,
      age: manualAge ? parseInt(manualAge, 10) : undefined,
      instagram: manualInsta.trim(),
      photoUrl: manualPhoto.trim(),
      isCustom: true,
    };

    handleAssignPlayerToSlot(activeSlotId, newMember);
  };

  // Instagram Formatter
  const getInstagramHandle = (insta?: string) => {
    if (!insta) return '';
    const clean = insta.trim();
    if (clean.includes('instagram.com/')) {
      const parts = clean.split('instagram.com/');
      const handle = parts[1]?.split('/')[0]?.split('?')[0];
      return handle ? `@${handle}` : clean;
    }
    return clean.startsWith('@') ? clean : `@${clean}`;
  };

  const getInstagramUrl = (insta?: string) => {
    if (!insta) return '';
    const clean = insta.trim();
    if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
    const username = clean.replace(/^@/, '');
    return `https://instagram.com/${username}`;
  };

  // Copy formatted roster text to clipboard
  const handleCopyRoster = () => {
    const filledSlots = slots.filter(s => s.player !== null);
    if (filledSlots.length === 0) {
      alert('Adicione pelo menos um jogador na line para copiar a escalação.');
      return;
    }

    let text = `🔥 ESCALAÇÃO OFICIAL: ${teamName.toUpperCase()} [${teamTag.toUpperCase() || 'FF'}] 🔥\n`;
    if (description) {
      text += `🎯 Meta: ${description}\n`;
    }
    text += `\n📋 LINE UP:\n`;

    slots.forEach(s => {
      if (s.player) {
        const instaText = s.player.instagram ? ` (${getInstagramHandle(s.player.instagram)})` : '';
        const ageText = s.player.age ? ` [${s.player.age} anos]` : '';
        text += `• ${s.slotLabel}: ${s.player.name}${instaText}${ageText}\n`;
      } else {
        text += `• ${s.slotLabel}: [VAGO]\n`;
      }
    });

    text += `\n⚡ Formada no Jhan Medeiros Analytics - Encontrar Line`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  // Export card as PNG image
  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#09090b',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `Line-${teamName.replace(/\s+/g, '_') || 'Line'}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error generating card image:', err);
      alert('Não foi possível gerar a imagem da line automaticamente. Você pode tirar um print da tela.');
    } finally {
      setIsExporting(false);
    }
  };

  // Filter available players for picker modal
  const filteredPickerPlayers = availablePlayers.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(playerPickerSearch.toLowerCase()) ||
                          p.availability.toLowerCase().includes(playerPickerSearch.toLowerCase()) ||
                          (p.teamsHistory && p.teamsHistory.toLowerCase().includes(playerPickerSearch.toLowerCase())) ||
                          (p.achievements && p.achievements.toLowerCase().includes(playerPickerSearch.toLowerCase()));
    const matchesRole = playerPickerRole === 'TODAS' || p.role === playerPickerRole;
    return matchesSearch && matchesRole;
  });

  // Calculate synergy / line stats
  const filledCount = slots.filter(s => s.player !== null).length;
  const hasIGL = slots.some(s => s.player && (s.player.role.includes('CAPITÃO') || s.player.role.includes('IGL')));
  const hasSuporte = slots.some(s => s.player && s.player.role.includes('SUPORTE'));
  const rushCount = slots.filter(s => s.player && s.player.role.includes('RUSH')).length;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top Controls & Line Configuration */}
      <div className="bg-graphite-800 p-6 md:p-8 rounded-3xl border border-white/10 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 text-loud-500 font-bold text-xs uppercase tracking-wider mb-1">
              <Swords size={16} />
              Montador Interativo de Squads
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase font-display">
              Monte sua Line do Free Fire
            </h2>
            <p className="text-sm text-premium-muted mt-1">
              Selecione jogadores do banco comunitário LFT ou cadastre amigos para criar sua escalação, testar sinergia e baixar o card.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button 
              onClick={handleAutoFill}
              className="bg-graphite-900 hover:bg-graphite-700 text-loud-500 border border-loud-500/30 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
              title="Preencher vagas vazias com jogadores LFT disponíveis"
            >
              <Shuffle size={14} />
              Preenchimento Automático
            </button>

            <button 
              onClick={() => setShowSavedList(true)}
              className="bg-graphite-900 hover:bg-graphite-700 text-white border border-white/10 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all"
            >
              <FolderOpen size={14} className="text-amber-400" />
              Minhas Lines Salvas ({savedLines.length})
            </button>

            <button 
              onClick={handleSaveCurrentLine}
              className="bg-loud-500 hover:bg-loud-600 text-graphite-900 px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(58,255,0,0.2)]"
            >
              {saveSuccessMsg ? <Check size={14} /> : <Save size={14} />}
              {saveSuccessMsg ? 'Salva com Sucesso!' : 'Salvar Line'}
            </button>
          </div>
        </div>

        {/* Line Info Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6">
            <label className="block text-xs font-bold text-premium-muted uppercase mb-1.5">Nome da Line / Time</label>
            <input 
              type="text" 
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Ex: Line Alfa, Los Grandes Academy..."
              className="w-full bg-graphite-900 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold focus:border-loud-500 outline-none transition-colors"
              maxLength={40}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-premium-muted uppercase mb-1.5">TAG / Sigla</label>
            <input 
              type="text" 
              value={teamTag}
              onChange={(e) => setTeamTag(e.target.value)}
              placeholder="Ex: LOUD, FX..."
              className="w-full bg-graphite-900 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold focus:border-loud-500 outline-none transition-colors uppercase"
              maxLength={8}
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-premium-muted uppercase mb-1.5">Meta / Horário de Treino</label>
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Treinos 19h às 23h | Foco NFA"
              className="w-full bg-graphite-900 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-loud-500 outline-none transition-colors text-sm"
              maxLength={80}
            />
          </div>
        </div>

        {/* Synergy Status Bar */}
        <div className="bg-graphite-900/80 p-4 rounded-2xl border border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-white uppercase flex items-center gap-1.5">
              <Shield size={14} className="text-loud-500" />
              Status da Line:
            </span>
            <span className={`px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[11px] ${filledCount >= 4 ? 'bg-loud-500/10 text-loud-400 border border-loud-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
              {filledCount}/6 Vagas Preenchidas
            </span>
            <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${hasIGL ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {hasIGL ? '✓ Tem IGL' : '✕ Falta IGL'}
            </span>
            <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${hasSuporte ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-premium-muted border border-white/10'}`}>
              {hasSuporte ? '✓ Tem Suporte' : 'Sem Suporte'}
            </span>
            <span className="text-premium-muted font-mono">
              Rushers: <strong className="text-white">{rushCount}</strong>
            </span>
          </div>

          <button 
            onClick={handleResetLine}
            className="text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-1 transition-colors"
          >
            <RotateCcw size={12} />
            Limpar Todos
          </button>
        </div>
      </div>

      {/* LINE ROSTER VISUAL CARD (READY FOR CAPTURE) */}
      <div 
        ref={cardRef}
        className="bg-gradient-to-b from-graphite-800 via-graphite-800 to-graphite-900 rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl relative overflow-hidden"
      >
        {/* Esports Watermark / Decorative BG */}
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Shield size={220} className="text-loud-500" />
        </div>

        {/* Card Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-loud-500/10 border-2 border-loud-500/40 flex items-center justify-center text-loud-500 font-black text-2xl font-display shadow-lg">
              {teamTag || 'FF'}
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-black uppercase text-white font-display tracking-tight flex items-center gap-2">
                {teamName || 'ESCALAÇÃO OFICIAL'}
              </h3>
              <p className="text-xs md:text-sm text-premium-muted font-mono">
                {description || 'Free Fire Competitive Squad'}
              </p>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[10px] font-mono text-premium-muted/50 uppercase tracking-widest block">ROSTER OFICIAL</span>
            <span className="text-xs font-bold text-loud-500 font-display uppercase tracking-wider">Jhan Medeiros Analytics</span>
          </div>
        </div>

        {/* SLOTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
          {slots.map((slot) => {
            const player = slot.player;
            return (
              <div 
                key={slot.id}
                className={`rounded-2xl p-5 border transition-all relative flex flex-col justify-between ${
                  player 
                    ? 'bg-graphite-900/90 border-loud-500/30 hover:border-loud-500/60 shadow-lg' 
                    : 'bg-graphite-900/40 border-dashed border-white/10 hover:border-loud-500/30'
                }`}
              >
                {/* Slot Top Header */}
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-loud-500 bg-loud-500/10 border border-loud-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    {slot.iconType === 'igl' && <Crown size={12} className="text-amber-400" />}
                    {slot.iconType === 'rush' && <Swords size={12} className="text-red-400" />}
                    {slot.iconType === 'support' && <Shield size={12} className="text-blue-400" />}
                    {slot.iconType === 'sub' && <Users size={12} className="text-purple-400" />}
                    {slot.iconType === 'coach' && <UserCheck size={12} className="text-emerald-400" />}
                    {slot.slotLabel}
                  </span>

                  {player && (
                    <button 
                      onClick={(e) => handleRemovePlayerFromSlot(slot.id, e)}
                      className="text-white/40 hover:text-red-400 p-1 rounded-lg transition-colors"
                      title="Remover jogador do slot"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Slot Body: Player Info or Empty Slot */}
                {player ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3.5 pt-1">
                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-full bg-graphite-800 border-2 border-loud-500/50 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                        {player.photoUrl ? (
                          <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-display font-black text-lg text-loud-500">
                            {player.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Nick & Role */}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-lg font-black text-white uppercase truncate font-display" title={player.name}>
                          {player.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-premium-muted">
                          <span className="text-loud-400 font-bold">{player.role}</span>
                          {player.age && <span>• {player.age} anos</span>}
                        </div>
                      </div>
                    </div>

                    {/* Social & Details */}
                    <div className="space-y-2 pt-2 border-t border-white/5 text-xs">
                      {player.instagram && (
                        <div className="flex items-center gap-2">
                          <Instagram size={14} className="text-pink-500 shrink-0" />
                          <a 
                            href={getInstagramUrl(player.instagram)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-pink-400 hover:text-pink-300 hover:underline truncate font-medium flex items-center gap-1"
                          >
                            {getInstagramHandle(player.instagram)}
                            <ExternalLink size={10} />
                          </a>
                        </div>
                      )}

                      {player.availability && (
                        <div className="flex items-center gap-2 text-premium-muted truncate" title={player.availability}>
                          <Clock size={12} className="text-white/40 shrink-0" />
                          <span className="truncate">{player.availability}</span>
                        </div>
                      )}

                      {player.teamsHistory && (
                        <div className="text-[11px] text-blue-400/90 truncate" title={player.teamsHistory}>
                          🛡 {player.teamsHistory}
                        </div>
                      )}
                    </div>

                    {/* Change / Replace button */}
                    <div className="pt-2 flex gap-2">
                      <button 
                        onClick={() => setActiveSlotId(slot.id)}
                        className="flex-1 bg-graphite-800 hover:bg-graphite-700 text-white text-xs font-bold py-2 rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Edit2 size={12} />
                        Trocar Jogador
                      </button>
                      
                      {player.id && (
                        <button 
                          onClick={() => {
                            const fullPlayer = availablePlayers.find(p => p.id === player.id);
                            if (fullPlayer) onViewPlayerDetails(fullPlayer);
                          }}
                          className="bg-loud-500/10 hover:bg-loud-500/20 text-loud-400 text-xs font-bold px-3 py-2 rounded-xl border border-loud-500/20 transition-colors"
                          title="Ver ficha completa"
                        >
                          Ficha
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Empty Slot Placeholder */
                  <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-graphite-800/80 border border-white/5 flex items-center justify-center text-white/30">
                      <UserPlus size={20} />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white/60 block">Slot Disponível</span>
                      <span className="text-xs text-premium-muted">Ideal: {slot.defaultRole}</span>
                    </div>
                    <button 
                      onClick={() => setActiveSlotId(slot.id)}
                      className="bg-loud-500/10 hover:bg-loud-500 text-loud-500 hover:text-graphite-900 border border-loud-500/30 px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus size={14} />
                      Adicionar Jogador
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Card Footer Info */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-premium-muted">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-loud-500" />
            <span>Escalação pronta para treinos, campeonatos diários e competições oficiais.</span>
          </div>
          <span className="font-mono text-[11px] text-white/40">
            Atualizado em {new Date().toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* ACTION BUTTONS (COPY, DOWNLOAD IMAGE) */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-graphite-800 p-6 rounded-3xl border border-white/10 shadow-xl">
        <div className="space-y-1">
          <h4 className="text-lg font-bold text-white uppercase font-display">Compartilhe sua Line</h4>
          <p className="text-xs text-premium-muted">
            Copie o texto pronto para WhatsApp e Discord ou baixe a imagem esport da sua formação.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleCopyRoster}
            className="bg-graphite-900 hover:bg-graphite-700 text-white border border-white/10 px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
          >
            {copiedText ? <Check size={16} className="text-loud-500" /> : <Copy size={16} />}
            {copiedText ? 'Copiado para a Área de Transferência!' : 'Copiar Escalação (Texto)'}
          </button>

          <button 
            onClick={handleDownloadImage}
            disabled={isExporting}
            className="bg-loud-500 hover:bg-loud-600 text-graphite-900 px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(58,255,0,0.25)] disabled:opacity-50"
          >
            <Download size={16} />
            {isExporting ? 'Gerando Imagem...' : 'Baixar Card da Line (PNG)'}
          </button>
        </div>
      </div>

      {/* MODAL: PLAYER PICKER FROM LFT OR MANUAL ENTRY */}
      {activeSlotId && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => {
            setActiveSlotId(null);
            setShowCustomManualForm(false);
          }}
        >
          <div 
            className="bg-graphite-800 border border-white/10 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-graphite-900 p-6 border-b border-white/10 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-loud-500 uppercase tracking-wider block">
                  Escolhendo para {slots.find(s => s.id === activeSlotId)?.slotLabel}
                </span>
                <h3 className="text-2xl font-black text-white uppercase font-display">
                  {showCustomManualForm ? 'Digitar Jogador Manualmente' : 'Selecionar Jogador do Banco LFT'}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setActiveSlotId(null);
                  setShowCustomManualForm(false);
                }}
                className="text-white/60 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Toggle Mode Buttons */}
            <div className="bg-graphite-900/50 p-4 border-b border-white/5 flex gap-3">
              <button 
                onClick={() => setShowCustomManualForm(false)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  !showCustomManualForm ? 'bg-loud-500 text-graphite-900' : 'bg-graphite-800 text-white hover:bg-graphite-700'
                }`}
              >
                <Users size={16} />
                Banco de Jogadores LFT ({availablePlayers.length})
              </button>
              <button 
                onClick={() => setShowCustomManualForm(true)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  showCustomManualForm ? 'bg-loud-500 text-graphite-900' : 'bg-graphite-800 text-white hover:bg-graphite-700'
                }`}
              >
                <Plus size={16} />
                Digitar Outro Jogador / Amigo
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {!showCustomManualForm ? (
                <>
                  {/* Search & Filter */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-premium-muted" />
                      <input 
                        type="text"
                        placeholder="Buscar por nick, histórico, conquistas..."
                        value={playerPickerSearch}
                        onChange={(e) => setPlayerPickerSearch(e.target.value)}
                        className="w-full bg-graphite-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-premium-muted/50 outline-none focus:border-loud-500"
                      />
                    </div>
                    <select 
                      value={playerPickerRole}
                      onChange={(e) => setPlayerPickerRole(e.target.value)}
                      className="bg-graphite-900 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-loud-500"
                    >
                      <option value="TODAS">Todas as Funções</option>
                      {ROLES_LIST.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  {/* Players List Grid */}
                  {filteredPickerPlayers.length === 0 ? (
                    <div className="bg-graphite-900/50 p-10 rounded-2xl text-center border border-white/5 space-y-3">
                      <p className="text-premium-muted text-sm">Nenhum jogador encontrado no banco LFT com esses filtros.</p>
                      <button 
                        onClick={() => setShowCustomManualForm(true)}
                        className="bg-graphite-800 hover:bg-graphite-700 text-loud-500 border border-loud-500/30 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                      >
                        Digitar Jogador Manualmente
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredPickerPlayers.map(p => (
                        <div 
                          key={p.id}
                          className="bg-graphite-900 p-4 rounded-2xl border border-white/5 hover:border-loud-500/40 transition-all flex flex-col justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-graphite-800 border-2 border-loud-500/40 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                              {p.photoUrl ? (
                                <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-bold text-loud-500">{p.name.slice(0, 2).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-white uppercase truncate" title={p.name}>{p.name}</h4>
                              <span className="inline-block bg-graphite-800 text-loud-400 px-2 py-0.5 rounded text-[11px] font-bold uppercase mt-0.5">
                                {p.role}
                              </span>
                            </div>
                          </div>

                          <div className="my-3 text-xs text-premium-muted space-y-1 font-mono bg-graphite-800/40 p-2 rounded-lg">
                            <div className="truncate">⏱ {p.availability}</div>
                            <div>🎂 {p.age} anos</div>
                            {p.teamsHistory && <div className="truncate text-blue-400">🛡 {p.teamsHistory}</div>}
                          </div>

                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                handleAssignPlayerToSlot(activeSlotId, {
                                  id: p.id,
                                  name: p.name,
                                  role: p.role,
                                  age: p.age,
                                  photoUrl: p.photoUrl,
                                  instagram: p.instagram,
                                  highlightsUrl: p.highlightsUrl,
                                  availability: p.availability,
                                  achievements: p.achievements,
                                  teamsHistory: p.teamsHistory,
                                  isCustom: false,
                                });
                              }}
                              className="flex-1 bg-loud-500 hover:bg-loud-600 text-graphite-900 font-extrabold py-2 rounded-xl text-xs transition-all shadow-sm"
                            >
                              Selecionar
                            </button>
                            <button 
                              onClick={() => onViewPlayerDetails(p)}
                              className="bg-graphite-800 hover:bg-graphite-700 text-white px-3 py-2 rounded-xl text-xs font-bold border border-white/10 transition-colors"
                              title="Ver perfil completo"
                            >
                              Ver
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Manual Player Form */
                <form onSubmit={handleManualSubmit} className="space-y-4 max-w-lg mx-auto py-2">
                  <div>
                    <label className="block text-xs font-bold text-premium-muted uppercase mb-1">Nome ou Nick *</label>
                    <input 
                      type="text" 
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="Ex: NOBRU, BAK, DIONIS..."
                      required
                      className="w-full bg-graphite-900 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold focus:border-loud-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-premium-muted uppercase mb-1">Função *</label>
                      <select 
                        value={manualRole}
                        onChange={(e) => setManualRole(e.target.value)}
                        className="w-full bg-graphite-900 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-loud-500 outline-none"
                      >
                        {ROLES_LIST.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-premium-muted uppercase mb-1">Idade</label>
                      <input 
                        type="number" 
                        value={manualAge}
                        onChange={(e) => setManualAge(e.target.value)}
                        placeholder="Ex: 19"
                        min="1"
                        max="99"
                        className="w-full bg-graphite-900 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-loud-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-premium-muted uppercase mb-1">Instagram (@ ou link)</label>
                    <input 
                      type="text" 
                      value={manualInsta}
                      onChange={(e) => setManualInsta(e.target.value)}
                      placeholder="@seu_instagram"
                      className="w-full bg-graphite-900 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-loud-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-premium-muted uppercase mb-1">URL da Foto (Opcional)</label>
                    <input 
                      type="text" 
                      value={manualPhoto}
                      onChange={(e) => setManualPhoto(e.target.value)}
                      placeholder="https://exemplo.com/foto.jpg"
                      className="w-full bg-graphite-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs focus:border-loud-500 outline-none"
                    />
                  </div>

                  <div className="pt-3 flex gap-3">
                    <button 
                      type="submit"
                      className="flex-1 bg-loud-500 hover:bg-loud-600 text-graphite-900 font-extrabold py-3 rounded-xl transition-all shadow-md text-sm"
                    >
                      Inserir no Slot
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowCustomManualForm(false)}
                      className="bg-graphite-900 hover:bg-graphite-700 text-white px-5 py-3 rounded-xl font-bold text-sm border border-white/10"
                    >
                      Voltar ao Banco LFT
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SAVED LINES LIST */}
      {showSavedList && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowSavedList(false)}
        >
          <div 
            className="bg-graphite-800 border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-graphite-900 p-6 border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <FolderOpen className="text-amber-400" size={24} />
                <h3 className="text-2xl font-black text-white uppercase font-display">Minhas Lines Salvas</h3>
              </div>
              <button 
                onClick={() => setShowSavedList(false)}
                className="text-white/60 hover:text-white p-2 rounded-full hover:bg-white/5"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {savedLines.length === 0 ? (
                <div className="text-center py-12 text-premium-muted space-y-2">
                  <p>Você ainda não salvou nenhuma line personalizada neste navegador.</p>
                  <p className="text-xs opacity-60">Monte sua escalação e clique no botão "Salvar Line" no topo!</p>
                </div>
              ) : (
                savedLines.map(saved => {
                  const filled = saved.slots.filter(s => s.player !== null);
                  return (
                    <div 
                      key={saved.id}
                      onClick={() => handleLoadLine(saved)}
                      className="bg-graphite-900 p-5 rounded-2xl border border-white/5 hover:border-loud-500/40 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer group"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-lg font-black text-white uppercase group-hover:text-loud-500 transition-colors font-display">
                            {saved.name}
                          </h4>
                          {saved.tag && (
                            <span className="bg-loud-500/10 text-loud-400 px-2 py-0.5 rounded text-xs font-bold uppercase">
                              {saved.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-premium-muted mb-2">{saved.description || 'Sem descrição'}</p>
                        
                        {/* Member names preview */}
                        <div className="flex flex-wrap gap-1.5">
                          {filled.map((s, idx) => (
                            <span key={idx} className="bg-graphite-800 text-white/80 px-2 py-0.5 rounded text-[10px] font-mono">
                              {s.player?.name} ({s.player?.role})
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLoadLine(saved);
                          }}
                          className="bg-loud-500 hover:bg-loud-600 text-graphite-900 font-extrabold px-4 py-2 rounded-xl text-xs transition-all shadow-sm"
                        >
                          Carregar
                        </button>
                        <button 
                          onClick={(e) => handleDeleteSavedLine(saved.id, e)}
                          className="text-red-400 hover:bg-red-500/10 p-2 rounded-xl transition-colors"
                          title="Excluir line salva"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
