
import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Map as MapIcon, Shield, Users, 
  ChevronRight, Play, RefreshCw, LayoutGrid, 
  CheckCircle, History, Download, X, Sword, MonitorPlay, ChevronLeft, Save,
  RotateCcw, GripVertical, CheckSquare, Settings, Crown, AlertTriangle, ArrowRight, Clock, Pause,
  Search, Zap, Lock, Edit2, CornerDownRight, Timer, HelpCircle, UserPlus, Grid, GitMerge, Upload, List, BarChart2, Target, Heart, Crosshair, Plus, Eye, Unlock, User, Medal, Undo2, Redo2, Home, Minus
} from 'lucide-react';
import { downloadDivAsImage } from '../utils';

// --- DATA CONSTANTS ---

const CHARACTERS_DB = [
  { name: 'A124', img: 'https://i.ibb.co/fzTd41Lx/A124.png', type: 'Active' },
  { name: 'ORION', img: 'https://i.ibb.co/7xr1ys7f/ORION.png', type: 'Active' },
  { name: 'SKYLER', img: 'https://i.ibb.co/0RhD9WNz/SKYLER.png', type: 'Active' },
  { name: 'STEFFIE', img: 'https://i.ibb.co/1GJv2jqG/STEFFIE.png', type: 'Active' },
  { name: 'IRIS', img: 'https://i.ibb.co/x8Fhfsty/IRIS.png', type: 'Active' },
  { name: 'CR7', img: 'https://i.ibb.co/TqHmqFrH/CR7.png', type: 'Active' },
  { name: 'TATSUYA', img: 'https://i.ibb.co/rK6NSGgF/TATSUYA.png', type: 'Active' },
  { name: 'HOMERO', img: 'https://i.ibb.co/qLD3MckR/HOMERO.png', type: 'Active' },
  { name: 'DIMITRI', img: 'https://i.ibb.co/YB8WTZpL/DIMITRI.png', type: 'Active' },
  { name: 'EVELYN', img: 'https://i.ibb.co/N6HnVHmh/EVELYN.png', type: 'Active' },
  { name: 'KAMIR', img: 'https://i.ibb.co/605w44By/KAMIR.png', type: 'Active' },
  { name: 'SANTINO', img: 'https://i.ibb.co/sd1Kz8Gj/SANTINO.png', type: 'Active' },
  { name: 'KODA', img: 'https://i.ibb.co/849xyhhR/KODA.png', type: 'Active' },
  { name: 'RYDEN', img: 'https://i.ibb.co/1YWRw9yF/RYDEN.png', type: 'Active' },
  { name: 'OSCAR', img: 'https://i.ibb.co/KzKM9VKT/OSCAR.png', type: 'Active' },
  { name: 'KASSIE', img: 'https://i.ibb.co/qYD4KqYj/KASSIE.png', type: 'Active' },
  { name: 'KENTA', img: 'https://i.ibb.co/nXycc5H/KENTA.png', type: 'Active' },
  { name: 'EXTREMA', img: 'https://i.ibb.co/C3Nv8cYH/EXTREMA.png', type: 'Active' },
  { name: 'ALOK', img: 'https://i.ibb.co/JwG3C41h/ALOK.png', type: 'Active' },
  { name: 'IGNIS', img: 'https://i.ibb.co/7N2n6qC0/IGNIS.png', type: 'Active' },
  { name: 'WUKONG', img: 'https://i.ibb.co/W4JLHZXz/WUKONG.png', type: 'Active' },
  { name: 'NERO', img: 'https://i.ibb.co/9HSp4GsC/NERO.png', type: 'Active' },
];

const MAPS_DB = [
  { name: 'ALPINE', img: 'https://i.ibb.co/M5SKjzyg/ALPINE.jpg' },
  { name: 'BERMUDA', img: 'https://i.ibb.co/zVZRhrzW/BERMUDA.jpg' },
  { name: 'KALAHARI', img: 'https://i.ibb.co/Mxtfgvm0/KALAHARI.jpg' },
  { name: 'NOVA TERRA', img: 'https://i.ibb.co/bgrHzY8R/NOVA-TERRA.jpg' },
  { name: 'PURGATÓRIO', img: 'https://i.ibb.co/JR6RxXdZ/PURGAT-RIO.jpg' },
  { name: 'SOLARA', img: 'https://i.ibb.co/nMzg9Qbs/SOLARA.jpg' },
];

// --- TYPES ---

type ViewState = 'home' | 'mode' | 'maps' | 'draft' | 'result' | 'tournament_setup' | 'tournament_hub' | 'map_veto';
type DraftMode = 'snake' | 'linear' | 'mirrored';
type TournamentFormat = 'single' | 'double' | 'swiss';
type Winner = 'A' | 'B' | null;

interface TournamentPlayer {
    id: string;
    name: string;
    stats: {
        totalKills: number;
        totalDamage: number;
        matchesPlayed: number;
    }
}

interface TournamentTeam {
    id: string;
    name: string;
    logo: string | null;
    players: TournamentPlayer[];
    stats: { 
        wins: number, 
        losses: number, 
        matchesPlayed: number,
        roundsWon: number,
        roundsLost: number
    };
}

interface TournamentMatch {
    id: string;
    round: number;
    teamAId: string | null;
    teamBId: string | null;
    scoreA: number;
    scoreB: number;
    winnerId: string | null;
    status: 'scheduled' | 'veto' | 'live' | 'finished' | 'wo';
    bracketGroup?: string; 
    map?: string;
}

interface TournamentState {
    name: string;
    format: TournamentFormat;
    adminPassword?: string;
    teams: TournamentTeam[];
    matches: TournamentMatch[];
    activeMatchId: string | null;
}

const ORDERS: Record<DraftMode, any[]> = {
  snake: [
    { team: 'A', type: 'ban', label: 'BAN' }, { team: 'B', type: 'ban', label: 'BAN' },
    { team: 'A', type: 'pick', label: 'PICK 1' }, { team: 'B', type: 'pick', label: 'PICK 1' },
    { team: 'B', type: 'pick', label: 'PICK 2' }, { team: 'A', type: 'pick', label: 'PICK 2' },
    { team: 'A', type: 'pick', label: 'PICK 3' }, { team: 'B', type: 'pick', label: 'PICK 3' },
    { team: 'B', type: 'pick', label: 'PICK 4' }, { team: 'A', type: 'pick', label: 'PICK 4' },
  ],
  linear: [
    { team: 'A', type: 'ban', label: 'BAN' }, { team: 'B', type: 'ban', label: 'BAN' },
    { team: 'A', type: 'pick', label: 'PICK 1' }, { team: 'B', type: 'pick', label: 'PICK 1' },
    { team: 'A', type: 'pick', label: 'PICK 2' }, { team: 'B', type: 'pick', label: 'PICK 2' },
    { team: 'A', type: 'pick', label: 'PICK 3' }, { team: 'B', type: 'pick', label: 'PICK 3' },
    { team: 'A', type: 'pick', label: 'PICK 4' }, { team: 'B', type: 'pick', label: 'PICK 4' },
  ],
  mirrored: [
    { team: 'A', type: 'ban', label: 'BAN' }, { team: 'B', type: 'ban', label: 'BAN' },
    { team: 'A', type: 'pick', label: 'PICK 1' }, { team: 'B', type: 'pick', label: 'PICK 1' },
    { team: 'A', type: 'pick', label: 'PICK 2' }, { team: 'B', type: 'pick', label: 'PICK 2' },
    { team: 'A', type: 'pick', label: 'PICK 3' }, { team: 'B', type: 'pick', label: 'PICK 3' },
    { team: 'A', type: 'pick', label: 'PICK 4' }, { team: 'B', type: 'pick', label: 'PICK 4' },
  ]
};

// --- COMPONENTS ---

const FormatCard: React.FC<{ id: TournamentFormat, active: boolean, title: string, description: string, icon: React.ReactNode, onClick: () => void }> = ({ id, active, title, description, icon, onClick }) => (
    <button onClick={onClick} className={`relative flex flex-col p-6 rounded-2xl border-2 transition-all text-left h-full ${active ? 'border-brand-500 bg-brand-500/5 ring-1 ring-brand-500' : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'}`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${active ? 'bg-brand-500 text-black' : 'bg-gray-800 text-gray-400'}`}>{icon}</div>
        <h3 className={`text-xl font-black uppercase mb-2 ${active ? 'text-brand-500' : 'text-white'}`}>{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed italic">{description}</p>
    </button>
);

const PicksBans: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminInput, setAdminInput] = useState('');
  const [hubTab, setHubTab] = useState<'bracket' | 'mvp' | 'standings'>('bracket');

  // --- GENERAL MATCH STATE ---
  const [teamA, setTeamA] = useState('TIME A');
  const [teamB, setTeamB] = useState('TIME B');
  const [teamAId, setTeamAId] = useState<string | null>(null);
  const [teamBId, setTeamBId] = useState<string | null>(null);
  const [mode, setMode] = useState<DraftMode>('snake');
  const [format, setFormat] = useState(1); // MD1 por padrão
  const [maps, setMaps] = useState<string[]>([]);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [bans, setBans] = useState({ A: null as string | null, B: null as string | null });
  const [picksA, setPicksA] = useState<string[]>([]);
  const [picksB, setPicksB] = useState<string[]>([]);
  const [timer, setTimer] = useState(30);

  // --- UNDO/REDO HISTORY ---
  const [historyStack, setHistoryStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);

  // --- TOURNAMENT STATE ---
  const [tournament, setTournament] = useState<TournamentState>({
      name: '', format: 'single', adminPassword: '', teams: [], matches: [], activeMatchId: null
  });
  const [newTeam, setNewTeam] = useState({ name: '', logo: '', players: Array(6).fill('') });
  const [vetoState, setVetoState] = useState<{ turn: 'A' | 'B', bans: string[] }>({ turn: 'A', bans: [] });

  // MVP Input Modal State
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [matchResult, setMatchResult] = useState({ winner: 'A' as Winner, scoreA: 0, scoreB: 0, isWO: false });
  const [tempPlayerStats, setTempPlayerStats] = useState<Record<string, { kills: number, damage: number }>>({});

  // --- LOGIC ---

  const order = ORDERS[mode];
  const isComplete = stepIndex >= order.length;
  const currentStep = !isComplete ? order[stepIndex] : null;

  useEffect(() => {
    if (view === 'draft' && !isComplete && timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [view, stepIndex, timer, isComplete]);

  const recordState = () => {
    const currentState = { stepIndex, bans: { ...bans }, picksA: [...picksA], picksB: [...picksB], timer: 30 };
    setHistoryStack(prev => [...prev, currentState]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const currentState = { stepIndex, bans: { ...bans }, picksA: [...picksA], picksB: [...picksB], timer };
    setRedoStack(prev => [...prev, currentState]);
    const last = historyStack[historyStack.length - 1];
    setStepIndex(last.stepIndex); setBans(last.bans); setPicksA(last.picksA); setPicksB(last.picksB); setTimer(last.timer);
    setHistoryStack(prev => prev.slice(0, -1));
  };

  const endTournament = () => {
      const confirmEnd = window.confirm("⚠️ ENCERRAR CAMPEONATO?\n\nIsso apagará permanentemente todos os resultados, chaves e ranking deste torneio.");
      if (confirmEnd) {
          // Reset completo de todos os estados do torneio
          setTournament({ 
              name: '', 
              format: 'single', 
              adminPassword: '', 
              teams: [], 
              matches: [], 
              activeMatchId: null 
          });
          setNewTeam({ name: '', logo: '', players: Array(6).fill('') });
          setTempPlayerStats({});
          setMatchResult({ winner: 'A', scoreA: 0, scoreB: 0, isWO: false });
          setIsAdmin(false); 
          setAdminInput(''); 
          setView('home');
      }
  };

  const handleAddTeam = () => {
      if (!newTeam.name) return;
      const teamId = Date.now().toString();
      const players: TournamentPlayer[] = newTeam.players
        .filter(p => p.trim() !== '')
        .map(p => ({
            id: Math.random().toString(36).substr(2, 9),
            name: p,
            stats: { totalKills: 0, totalDamage: 0, matchesPlayed: 0 }
        }));

      const team: TournamentTeam = {
          id: teamId, name: newTeam.name, logo: newTeam.logo || null, players,
          stats: { wins: 0, losses: 0, matchesPlayed: 0, roundsWon: 0, roundsLost: 0 }
      };

      setTournament(prev => ({ ...prev, teams: [...prev.teams, team] }));
      setNewTeam({ name: '', logo: '', players: Array(6).fill('') });
  };

  const startQuickMatchDraft = () => {
      setStepIndex(0); setBans({A:null, B:null}); setPicksA([]); setPicksB([]);
      setTimer(30); setView('draft'); setHistoryStack([]); setRedoStack([]);
      // Garante que não há vínculo com torneio na partida rápida
      setTournament(prev => ({ ...prev, activeMatchId: null })); 
  };

  const drawMaps = () => {
      const pool = [...MAPS_DB]; const selected: string[] = [];
      for(let i=0; i<format; i++) {
          const rand = Math.floor(Math.random() * pool.length);
          selected.push(pool[rand].name); pool.splice(rand, 1);
      }
      setMaps(selected); setView('maps');
  };

  const startTournamentMatch = (matchId: string) => {
    if (!isAdmin) { alert("⚠️ LOGIN NECESSÁRIO: Você deve estar logado como administrador para gerenciar esta partida."); return; }
    const match = tournament.matches.find(m => m.id === matchId);
    if (!match) return;

    setTournament(prev => ({ ...prev, activeMatchId: matchId }));
    
    if (match.teamAId && match.teamBId) {
        const tA = tournament.teams.find(t => t.id === match.teamAId);
        const tB = tournament.teams.find(t => t.id === match.teamBId);
        setTeamA(tA!.name); setTeamB(tB!.name);
        setTeamAId(tA!.id); setTeamBId(tB!.id);
        
        if(match.status === 'finished' || match.status === 'wo') {
            setMatchResult({ 
                winner: match.winnerId === tA!.id ? 'A' : 'B', 
                scoreA: match.scoreA, 
                scoreB: match.scoreB, 
                isWO: match.status === 'wo' 
            });
            setShowStatsModal(true);
        } else {
            setVetoState({ turn: 'A', bans: [] }); 
            setView('map_veto');
        }
    } else {
        alert("⚠️ Aguardando definição dos vencedores das fases anteriores para esta partida.");
    }
  };

  const handleVeto = (mapName: string) => {
    const newBans = [...vetoState.bans, mapName];
    if (newBans.length < MAPS_DB.length - 1) {
      setVetoState({ turn: vetoState.turn === 'A' ? 'B' : 'A', bans: newBans });
    } else {
      const finalMap = MAPS_DB.find(m => !newBans.includes(m.name))?.name || 'Bermuda';
      setMaps([finalMap]); setStepIndex(0); setBans({ A: null, B: null }); setPicksA([]); setPicksB([]);
      setView('draft');
    }
  };

  const handlePick = (char: string) => {
    if (isComplete) return;
    recordState();
    const step = order[stepIndex];
    if (step.type === 'ban') setBans(prev => ({ ...prev, [step.team]: char }));
    else { if (step.team === 'A') setPicksA(prev => [...prev, char]); else setPicksB(prev => [...prev, char]); }
    setStepIndex(prev => prev + 1); setTimer(30);
  };

  const onDragStart = (e: React.DragEvent, charName: string) => { if (isComplete) return; e.dataTransfer.setData("character", charName); };
  const onDrop = (e: React.DragEvent) => {
    if (isComplete) return;
    const charName = e.dataTransfer.getData("character");
    const isUsed = picksA.includes(charName) || picksB.includes(charName) || bans.A === charName || bans.B === charName;
    if (charName && !isUsed) handlePick(charName);
  };

  const saveMatchResults = () => {
    const matchId = tournament.activeMatchId;
    const winnerId = matchResult.winner === 'A' ? teamAId : teamBId;

    // Se for partida rápida (sem matchId), volta pra home
    if (!matchId) {
        alert(`Partida Finalizada!\nVencedor: ${matchResult.winner === 'A' ? teamA : teamB}\nPlacar: ${matchResult.scoreA} x ${matchResult.scoreB}`);
        setView('home');
        setShowStatsModal(false);
        return;
    }

    setTournament(prev => {
        // Atualiza a partida atual
        const updatedMatches = prev.matches.map(m => m.id === matchId ? { 
            ...m, status: matchResult.isWO ? 'wo' as const : 'finished' as const, winnerId: winnerId || null, 
            scoreA: matchResult.scoreA, scoreB: matchResult.scoreB, map: maps[0] || m.map
        } : m);

        // Lógica de Avanço Automático (Busca o ID pré-gerado no setup)
        const matchInfo = (matchId as string).split('-');
        const currentRound = parseInt(matchInfo[0].replace('M', ''), 10);
        const currentPos = parseInt(matchInfo[1], 10);
        const nextRound = currentRound + 1;
        const nextPos = Math.floor(currentPos / 2);
        const nextMatchId = `M${nextRound}-${nextPos}`;
        
        let finalMatches = [...updatedMatches];
        const nextMatchIndex = updatedMatches.findIndex(m => m.id === nextMatchId);
        
        if (nextMatchIndex !== -1) {
            const isTeamA = currentPos % 2 === 0;
            finalMatches[nextMatchIndex] = {
                ...finalMatches[nextMatchIndex],
                [isTeamA ? 'teamAId' : 'teamBId']: winnerId
            };
        }

        // Atualiza estatísticas coletivas e individuais
        const updatedTeams = prev.teams.map(team => {
            const playedThis = team.id === teamAId || team.id === teamBId;
            if (!playedThis) return team;
            
            const isWinner = team.id === winnerId;
            const myScore = team.id === teamAId ? matchResult.scoreA : matchResult.scoreB;
            const opScore = team.id === teamAId ? matchResult.scoreB : matchResult.scoreA;

            const updatedPlayers = team.players.map(p => {
                const stats = tempPlayerStats[p.id] || { kills: 0, damage: 0 };
                return { ...p, stats: { ...p.stats, totalKills: p.stats.totalKills + stats.kills, totalDamage: p.stats.totalDamage + stats.damage, matchesPlayed: p.stats.matchesPlayed + 1 } };
            });

            return { 
                ...team, 
                players: updatedPlayers,
                stats: { 
                    ...team.stats, 
                    wins: team.stats.wins + (isWinner ? 1 : 0), 
                    losses: team.stats.losses + (isWinner ? 0 : 1), 
                    matchesPlayed: team.stats.matchesPlayed + 1, 
                    roundsWon: team.stats.roundsWon + myScore, 
                    roundsLost: team.stats.roundsLost + opScore
                } 
            };
        });

        return { ...prev, teams: updatedTeams, matches: finalMatches as TournamentMatch[], activeMatchId: null };
    });

    setShowStatsModal(false); setTempPlayerStats({}); setMatchResult({ winner: 'A', scoreA: 0, scoreB: 0, isWO: false }); setView('tournament_hub');
  };

  const getRoundName = (round: number, totalRounds: number) => {
      const roundsRemaining = totalRounds - round;
      if (roundsRemaining === 0) return "GRANDE FINAL";
      if (roundsRemaining === 1) return "SEMIFINAIS";
      if (roundsRemaining === 2) return "QUARTAS DE FINAL";
      if (roundsRemaining === 3) return "OITAVAS DE FINAL";
      return `FASE ${round}`;
  };

  // --- RENDERING VIEWS ---

  if (view === 'home') {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-fade-in px-4">
            <div className="text-center space-y-2">
                <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-600 uppercase tracking-tighter italic">Picks & Bans</h1>
                <p className="text-gray-500 text-lg uppercase tracking-widest font-medium">Plataforma Analítica Profissional</p>
            </div>
            
            {/* Se houver torneio ativo, mostra opção de voltar ou encerrar */}
            {tournament.matches.length > 0 ? (
                <div className="flex flex-col gap-4 w-full max-w-4xl">
                    <div className="bg-brand-500/10 border border-brand-500 rounded-3xl p-6 flex items-center justify-between shadow-2xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-brand-500 rounded-2xl text-black"><Trophy size={24} /></div>
                            <div>
                                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">{tournament.name}</h3>
                                <p className="text-xs text-brand-500 font-bold uppercase">Torneio em andamento</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setView('tournament_hub')} className="bg-brand-500 hover:bg-brand-600 text-black px-6 py-2.5 rounded-xl font-black uppercase text-xs italic shadow-lg transition-all">Continuar Gestão</button>
                            <button onClick={endTournament} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl font-black uppercase text-xs italic shadow-lg transition-all">Encerrar e Novo</button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                    <button onClick={() => setView('mode')} className="group bg-gray-950 border border-gray-800 rounded-3xl p-8 hover:border-brand-500 transition-all shadow-xl"><div className="flex flex-col items-start text-left"><div className="p-3 bg-gray-900 rounded-2xl mb-4 text-brand-500"><Sword size={32} /></div><h2 className="text-2xl font-black text-white mb-1 uppercase italic">Partida Rápida</h2><p className="text-sm text-gray-500">Draft avulso MD1, MD3 ou MD5.</p></div></button>
                    <button onClick={() => setView('tournament_setup')} className="group bg-gray-950 border border-gray-800 rounded-3xl p-8 hover:border-blue-500 transition-all shadow-xl"><div className="flex flex-col items-start text-left"><div className="p-3 bg-gray-900 rounded-2xl mb-4 text-blue-500"><Trophy size={32} /></div><h2 className="text-2xl font-black text-white mb-1 uppercase italic">Criar Campeonato</h2><p className="text-sm text-gray-500">Gestão de chaves, W.O. e ranking.</p></div></button>
                </div>
            )}
        </div>
    );
  }

  if (view === 'mode') {
    return (
        <div className="max-w-4xl mx-auto py-20 px-4 animate-fade-in text-center space-y-10">
            <button onClick={() => setView('home')} className="absolute top-24 left-10 text-gray-500 hover:text-white flex items-center gap-2 font-bold uppercase text-xs italic"><ChevronLeft /> Voltar</button>
            <h2 className="text-3xl font-black uppercase italic">Configuração da Partida</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 space-y-4"><h3 className="text-brand-500 font-bold uppercase text-xs italic">Série</h3><div className="flex gap-2">{[1, 3, 5].map(f => <button key={f} onClick={() => setFormat(f)} className={`flex-1 py-3 rounded-xl font-black border-2 transition-all ${format === f ? 'bg-brand-500 text-black border-brand-500' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>MD{f}</button>)}</div></div>
                <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 space-y-4"><h3 className="text-brand-500 font-bold uppercase text-xs italic">Modo</h3><div className="flex gap-2">{['snake', 'linear'].map(m => <button key={m} onClick={() => setMode(m as any)} className={`flex-1 py-3 rounded-xl font-black border-2 uppercase transition-all ${mode === m ? 'bg-brand-500 text-black border-brand-500' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>{m}</button>)}</div></div>
            </div>
            <button onClick={drawMaps} className="bg-brand-500 hover:bg-brand-600 text-black px-12 py-5 rounded-2xl font-black text-xl shadow-xl transition-all uppercase italic">Sortear Mapas & Iniciar</button>
        </div>
    );
  }

  if (view === 'maps') {
    return (
        <div className="max-w-5xl mx-auto py-20 px-4 animate-fade-in text-center">
            <h2 className="text-3xl font-black uppercase mb-10 italic">Mapas da Série (MD{format})</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {maps.map((m, i) => (
                    <div key={i} className="relative aspect-video rounded-2xl overflow-hidden border-2 border-gray-800 shadow-xl group"><img src={MAPS_DB.find(map => map.name === m)?.img} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-2xl font-black uppercase text-white drop-shadow-lg italic">{m}</span></div><div className="absolute top-2 left-2 bg-brand-500 text-black px-3 py-1 rounded-lg text-xs font-black italic">JOGO {i+1}</div></div>
                ))}
            </div>
            <div className="flex justify-center gap-4">
                <button onClick={drawMaps} className="p-4 bg-gray-800 rounded-xl text-white font-bold transition-all hover:bg-gray-700"><RefreshCw size={24}/></button>
                <button onClick={startQuickMatchDraft} className="px-10 py-4 bg-green-600 rounded-xl text-white font-black uppercase italic shadow-lg hover:bg-green-500 transition-all">Iniciar Picks & Bans</button>
            </div>
        </div>
    );
  }

  if (view === 'map_veto') {
    return (
        <div className="max-w-4xl mx-auto py-20 px-4 animate-fade-in text-center">
            <h2 className="text-4xl font-black uppercase text-white mb-2 italic">Veto de Mapas</h2>
            <p className={`text-xl font-bold uppercase mb-10 ${vetoState.turn === 'A' ? 'text-teamA' : 'text-teamB'}`}>Vez de {vetoState.turn === 'A' ? teamA : teamB} BANIR um mapa</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {MAPS_DB.map(map => {
                    const isBanned = vetoState.bans.includes(map.name);
                    return (
                        <button key={map.name} disabled={isBanned} onClick={() => handleVeto(map.name)} className={`relative aspect-video rounded-2xl overflow-hidden border-4 transition-all ${isBanned ? 'border-red-600 grayscale opacity-40' : 'border-gray-800 hover:border-white hover:scale-105'}`}>
                            <img src={map.img} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-2xl font-black uppercase text-white drop-shadow-lg italic">{map.name}</span></div>
                            {isBanned && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><X size={60} className="text-red-500" strokeWidth={4} /></div>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
  }

  if (view === 'draft') {
      const renderDraftSlot = (type: 'ban' | 'pick', team: 'A' | 'B', index: number) => {
          const isTarget = !isComplete && currentStep.type === type && currentStep.team === team && (type === 'ban' ? true : (team === 'A' ? picksA.length === index : picksB.length === index));
          let charName = (type === 'ban') ? (team === 'A' ? bans.A : bans.B) : (team === 'A' ? picksA[index] : picksB[index]);
          const charData = charName ? CHARACTERS_DB.find(c => c.name === charName) : null;
          return (
              <div className={`relative w-20 h-28 rounded-xl border-2 transition-all overflow-hidden flex flex-col items-center justify-center ${isTarget ? 'border-brand-500 bg-brand-500/10 shadow-lg animate-pulse' : charName ? (type === 'ban' ? 'border-red-500 bg-red-500/5' : (team === 'A' ? 'border-teamA bg-teamA/5' : 'border-teamB bg-teamB/5')) : 'border-gray-800 bg-gray-950 border-dashed opacity-40'}`}>
                  {charData ? (<><img src={charData.img} className="w-full h-full object-cover" /><div className="absolute bottom-0 inset-x-0 bg-black/80 py-1 text-[8px] font-black text-center uppercase truncate italic">{charData.name}</div></>) : (<span className="text-[10px] font-black uppercase opacity-20">{type === 'ban' ? 'BAN' : `P${index + 1}`}</span>)}
              </div>
          );
      };

      return (
          <div className="flex flex-col h-screen bg-gray-950 text-white animate-fade-in select-none">
              <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
                  <div className="flex items-center gap-2">
                      <button onClick={() => setView('home')} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"><Home size={20} /></button>
                      <button onClick={() => setView('tournament_hub')} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"><ChevronLeft size={20} /></button>
                      <div className="h-6 w-px bg-gray-800 mx-2"></div>
                      <button onClick={handleUndo} disabled={historyStack.length === 0} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"><Undo2 size={20} /></button>
                  </div>
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">{maps[currentMatchIdx] || 'SÉRIE ATIVA'}</div>
                  <div className="flex items-center gap-4">
                      {isComplete && <button onClick={() => { setMatchResult({winner: 'A', scoreA:0, scoreB:0, isWO:false}); setShowStatsModal(true); }} className="bg-green-600 hover:bg-green-500 text-white px-6 py-1.5 rounded-lg font-black shadow-lg animate-pulse uppercase text-xs italic">Finalizar Partida</button>}
                      <button onClick={() => downloadDivAsImage('draft-capture-area', 'picks-bans-draft')} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700"><Download size={20}/></button>
                  </div>
              </div>

              <div id="draft-capture-area" className="bg-gray-900 border-b border-gray-800 p-6 flex flex-col gap-6">
                  <div className="flex justify-between items-start max-w-7xl mx-auto w-full">
                      <div className="flex flex-col items-start gap-4">
                          <div className="flex items-center gap-3"><div className="w-12 h-12 bg-teamA/10 border border-teamA rounded-xl flex items-center justify-center font-black text-teamA text-xl italic shadow-lg">A</div><div><p className="text-xl font-black text-white uppercase italic tracking-tighter">{teamA}</p><p className="text-[10px] font-bold text-teamA uppercase tracking-widest">Atacante</p></div></div>
                          <div className="flex gap-2">{renderDraftSlot('ban', 'A', 0)}<div className="w-px h-28 bg-gray-800 mx-1"></div>{[0, 1, 2, 3].map(i => renderDraftSlot('pick', 'A', i))}</div>
                      </div>
                      <div className="flex flex-col items-center justify-center mt-12">
                          {!isComplete ? (<><span className={`text-6xl font-black italic tabular-nums leading-none ${timer < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timer}</span><div className={`mt-4 px-6 py-1.5 rounded-full font-black uppercase text-xs tracking-widest ${currentStep.type === 'ban' ? 'bg-red-600 text-white' : (currentStep.team === 'A' ? 'bg-teamA text-white' : 'bg-teamB text-white')}`}>{currentStep.type} - {currentStep.team === 'A' ? teamA : teamB}</div></>) : (
                              <div className="flex flex-col items-center text-center animate-fade-in">
                                  <div className="w-20 h-20 rounded-full bg-green-500/20 border-4 border-green-500 flex items-center justify-center text-green-500 mb-4 shadow-[0_0_30px_rgba(34,197,94,0.3)]"><CheckCircle size={48} /></div>
                                  <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white leading-none">DRAFT<br/>FINALIZADO</h2>
                              </div>
                          )}
                      </div>
                      <div className="flex flex-col items-end gap-4">
                          <div className="flex items-center gap-3 flex-row-reverse"><div className="w-12 h-12 bg-teamB/10 border border-teamB rounded-xl flex items-center justify-center font-black text-teamB text-xl italic shadow-lg">B</div><div className="text-right"><p className="text-xl font-black text-white uppercase italic tracking-tighter">{teamB}</p><p className="text-[10px] font-bold text-teamB uppercase tracking-widest">Defensor</p></div></div>
                          <div className="flex gap-2 flex-row-reverse">{renderDraftSlot('ban', 'B', 0)}<div className="w-px h-28 bg-gray-800 mx-1"></div>{[0, 1, 2, 3].map(i => renderDraftSlot('pick', 'B', i))}</div>
                      </div>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 max-w-7xl mx-auto">
                      {CHARACTERS_DB.map(char => {
                          const isUsed = picksA.includes(char.name) || picksB.includes(char.name) || bans.A === char.name || bans.B === char.name;
                          return (<button key={char.name} disabled={isUsed || isComplete} onClick={() => handlePick(char.name)} className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all active:scale-95 ${isUsed ? 'border-gray-800 opacity-30 grayscale cursor-not-allowed' : 'border-gray-700 hover:border-brand-500 hover:scale-105 shadow-xl cursor-grab'}`}><img src={char.img} className="w-full h-full object-cover" /><div className="absolute bottom-0 inset-x-0 bg-black/80 py-1 text-[8px] font-black text-center uppercase truncate italic">{char.name}</div></button>);
                      })}
                  </div>
              </div>

              {showStatsModal && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
                      <div className="bg-gray-900 border-2 border-brand-500 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden">
                          <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900"><h2 className="text-2xl font-black uppercase text-white italic tracking-tighter">Gerenciar Resultado</h2><button onClick={() => setShowStatsModal(false)} className="p-2 hover:bg-gray-800 rounded-full"><X size={24}/></button></div>
                          <div className="p-8 space-y-10 overflow-y-auto max-h-[70vh] custom-scrollbar">
                              <div className="grid grid-cols-2 gap-10 text-center">
                                  <div onClick={() => setMatchResult(p => ({...p, winner: 'A'}))} className={`p-8 rounded-2xl border-4 cursor-pointer transition-all relative ${matchResult.winner === 'A' ? 'border-teamA bg-teamA/10 scale-105' : 'border-gray-800 hover:border-gray-700'}`}>
                                      {matchResult.winner === 'A' && <Crown className="absolute -top-4 -right-4 text-teamA" size={32} fill="currentColor"/>}
                                      <h3 className="text-2xl font-black text-teamA mb-6 italic uppercase">{teamA}</h3>
                                      <input type="number" placeholder="0" className="bg-gray-950 text-4xl font-black w-28 text-center py-3 rounded-2xl border border-gray-700 text-white outline-none focus:border-teamA" value={matchResult.scoreA} onChange={e => setMatchResult(p => ({...p, scoreA: parseInt(e.target.value) || 0}))} onClick={e => e.stopPropagation()}/>
                                  </div>
                                  <div onClick={() => setMatchResult(p => ({...p, winner: 'B'}))} className={`p-8 rounded-2xl border-4 cursor-pointer transition-all relative ${matchResult.winner === 'B' ? 'border-teamB bg-teamB/10 scale-105' : 'border-gray-800 hover:border-gray-700'}`}>
                                      {matchResult.winner === 'B' && <Crown className="absolute -top-4 -right-4 text-teamB" size={32} fill="currentColor"/>}
                                      <h3 className="text-2xl font-black text-teamB mb-6 italic uppercase">{teamB}</h3>
                                      <input type="number" placeholder="0" className="bg-gray-950 text-4xl font-black w-28 text-center py-3 rounded-2xl border border-gray-700 text-white outline-none focus:border-teamB" value={matchResult.scoreB} onChange={e => setMatchResult(p => ({...p, scoreB: parseInt(e.target.value) || 0}))} onClick={e => e.stopPropagation()}/>
                                  </div>
                              </div>

                              <div className="flex gap-4">
                                  <button onClick={() => setMatchResult(p => ({...p, isWO: !p.isWO, scoreA: !p.isWO && p.winner === 'A' ? 7 : 0, scoreB: !p.isWO && p.winner === 'B' ? 7 : 0}))} className={`flex-1 py-5 rounded-xl font-black uppercase text-base border-2 transition-all ${matchResult.isWO ? 'bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'border-gray-800 text-gray-500 hover:border-red-500 hover:text-red-500'}`}>Vitória por W.O. (7x0 Automático)</button>
                              </div>

                              <div className="grid grid-cols-2 gap-8">
                                  <div className="space-y-4">
                                      <h4 className="text-xs font-black text-teamA uppercase border-b border-teamA/20 pb-2">Scout {teamA}</h4>
                                      {tournament.teams.find(t => t.id === teamAId)?.players.map(p => (
                                          <div key={p.id} className="grid grid-cols-[1fr_80px_80px] gap-2 items-center bg-black/40 p-2 rounded-xl">
                                              <span className="text-xs font-black truncate text-gray-300">{p.name}</span>
                                              <input type="number" placeholder="KILLS" className="bg-gray-900 border border-gray-800 p-1.5 rounded text-center text-[10px] font-black" value={tempPlayerStats[p.id]?.kills || ''} onChange={e => setTempPlayerStats(prev => ({...prev, [p.id]: { ...(prev[p.id] || {damage:0}), kills: parseInt(e.target.value) || 0 }}))}/>
                                              <input type="number" placeholder="DANO" className="bg-gray-900 border border-gray-800 p-1.5 rounded text-center text-[10px] font-black" value={tempPlayerStats[p.id]?.damage || ''} onChange={e => setTempPlayerStats(prev => ({...prev, [p.id]: { ...(prev[p.id] || {kills:0}), damage: parseInt(e.target.value) || 0 }}))}/>
                                          </div>
                                      ))}
                                  </div>
                                  <div className="space-y-4">
                                      <h4 className="text-xs font-black text-teamB uppercase border-b border-teamB/20 pb-2">Scout {teamB}</h4>
                                      {tournament.teams.find(t => t.id === teamBId)?.players.map(p => (
                                          <div key={p.id} className="grid grid-cols-[1fr_80px_80px] gap-2 items-center bg-black/40 p-2 rounded-xl">
                                              <span className="text-xs font-black truncate text-gray-300">{p.name}</span>
                                              <input type="number" placeholder="KILLS" className="bg-gray-900 border border-gray-800 p-1.5 rounded text-center text-[10px] font-black" value={tempPlayerStats[p.id]?.kills || ''} onChange={e => setTempPlayerStats(prev => ({...prev, [p.id]: { ...(prev[p.id] || {damage:0}), kills: parseInt(e.target.value) || 0 }}))}/>
                                              <input type="number" placeholder="DANO" className="bg-gray-900 border border-gray-800 p-1.5 rounded text-center text-[10px] font-black" value={tempPlayerStats[p.id]?.damage || ''} onChange={e => setTempPlayerStats(prev => ({...prev, [p.id]: { ...(prev[p.id] || {kills:0}), damage: parseInt(e.target.value) || 0 }}))}/>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </div>
                          <div className="p-6 bg-gray-900 border-t border-gray-800 flex justify-end gap-4"><button onClick={() => setShowStatsModal(false)} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold uppercase text-xs italic">Cancelar</button><button onClick={saveMatchResults} className="px-12 py-3 bg-brand-500 hover:bg-brand-600 rounded-xl font-black text-black uppercase text-sm shadow-lg italic">Salvar Resultado</button></div>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  if (view === 'tournament_setup') {
    return (
        <div className="max-w-6xl mx-auto py-10 px-4 animate-fade-in pb-20">
            <button onClick={() => setView('home')} className="mb-6 text-gray-500 hover:text-white flex items-center gap-2 font-bold uppercase text-xs italic"><ChevronLeft size={16} /> Voltar</button>
            <div className="space-y-12">
                <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-end">
                    <div className="flex-1 space-y-4 w-full"><label className="text-xs font-black text-gray-500 uppercase tracking-widest italic">Nome do Campeonato</label><input type="text" placeholder="EX: COPA FUMAÇA" className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-4 text-xl font-black text-white focus:border-brand-500 outline-none italic" value={tournament.name} onChange={e => setTournament(prev => ({...prev, name: e.target.value}))}/></div>
                    <div className="w-full md:w-64 space-y-4"><label className="text-xs font-black text-gray-500 uppercase tracking-widest italic">Senha Admin</label><input type="password" placeholder="SENHA" className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-4 font-bold text-white focus:border-brand-500 outline-none italic" value={tournament.adminPassword} onChange={e => setTournament(prev => ({...prev, adminPassword: e.target.value}))}/></div>
                </div>
                
                <section>
                    <h2 className="text-3xl font-black uppercase text-white mb-6 italic">Formato de Competição</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormatCard id="single" active={tournament.format === 'single'} title="Eliminação Simples" icon={<GitMerge size={24}/>} description="O perdedor de cada partida será imediatamente eliminado do torneio." onClick={() => setTournament(prev => ({...prev, format: 'single'}))}/>
                        <FormatCard id="double" active={tournament.format === 'double'} title="Eliminação Dupla" icon={<RefreshCw size={24}/>} description="Um participante só é eliminado após perder duas partidas ou jogos." onClick={() => setTournament(prev => ({...prev, format: 'double'}))}/>
                        <FormatCard id="swiss" active={tournament.format === 'swiss'} title="Sistema Suíço" icon={<Grid size={24}/>} description="Enfrente oponentes com pontuação semelhante. Garante mais jogos a todos." onClick={() => setTournament(prev => ({...prev, format: 'swiss'}))}/>
                    </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 space-y-6"><h3 className="text-xl font-black uppercase text-white flex items-center gap-2 italic"><UserPlus className="text-brand-500" /> Adicionar Equipe</h3><input type="text" placeholder="NOME DO TIME" className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 font-bold text-white focus:border-brand-500 outline-none italic" value={newTeam.name} onChange={e => setNewTeam(prev => ({...prev, name: e.target.value}))}/><div className="grid grid-cols-2 gap-4">{newTeam.players.map((p, i) => (<input key={i} type="text" placeholder={`JOGADOR ${i+1}`} className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm font-bold text-gray-300 focus:border-brand-500 outline-none" value={p} onChange={e => { const pCopy = [...newTeam.players]; pCopy[i] = e.target.value; setNewTeam(prev => ({...prev, players: pCopy})); }}/>))}</div><button onClick={handleAddTeam} className="w-full bg-gray-800 hover:bg-gray-700 text-white font-black py-4 rounded-xl transition-all uppercase tracking-widest text-sm italic">Registrar Equipe</button></div>
                    <div className="bg-gray-950 border border-gray-800 rounded-3xl p-4 overflow-y-auto max-h-[500px] custom-scrollbar">{tournament.teams.map((t, idx) => (<div key={t.id} className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-2xl mb-2"><div className="flex items-center gap-4"><span className="text-xs font-black text-gray-600 italic">#{idx + 1}</span><p className="font-black text-white uppercase italic">{t.name}</p></div><button onClick={() => setTournament(prev => ({...prev, teams: prev.teams.filter(team => team.id !== t.id)}))} className="text-gray-600 hover:text-red-500 transition-colors"><X size={20} /></button></div>))}</div>
                </section>

                <div className="flex justify-center pt-10"><button onClick={() => { 
                    if(tournament.teams.length < 2) { alert("Adicione pelo menos 2 times para gerar as chaves."); return; } 
                    if(!tournament.adminPassword) { alert("Defina uma Senha Admin para proteger o gerenciamento."); return; } 
                    if(!tournament.name) { alert("Dê um nome ao seu campeonato."); return; }
                    
                    const shuffled = [...tournament.teams].sort(() => Math.random() - 0.5);
                    const totalRounds = Math.ceil(Math.log2(shuffled.length));
                    const allMatches: TournamentMatch[] = [];

                    for (let r = 1; r <= totalRounds; r++) {
                        const matchesInRound = Math.pow(2, totalRounds - r);
                        for (let m = 0; m < matchesInRound; m++) {
                            allMatches.push({
                                id: `M${r}-${m}`,
                                round: r,
                                teamAId: null,
                                teamBId: null,
                                scoreA: 0,
                                scoreB: 0,
                                winnerId: null,
                                status: 'scheduled'
                            });
                        }
                    }

                    for (let i = 0; i < shuffled.length; i += 2) {
                        const matchIdx = allMatches.findIndex(m => m.id === `M1-${i/2}`);
                        if (matchIdx !== -1) {
                            allMatches[matchIdx].teamAId = shuffled[i].id;
                            if (shuffled[i+1]) {
                                allMatches[matchIdx].teamBId = shuffled[i+1].id;
                            } else {
                                allMatches[matchIdx].winnerId = shuffled[i].id;
                                allMatches[matchIdx].status = 'finished';
                                allMatches[matchIdx].scoreA = 7;
                                
                                const nextRound = 2;
                                const nextPos = Math.floor((i/2)/2);
                                const nextIdx = allMatches.findIndex(m => m.id === `M${nextRound}-${nextPos}`);
                                if (nextIdx !== -1) {
                                    if ((i/2) % 2 === 0) allMatches[nextIdx].teamAId = shuffled[i].id;
                                    else allMatches[nextIdx].teamBId = shuffled[i].id;
                                }
                            }
                        }
                    }

                    setTournament(prev => ({ ...prev, matches: allMatches })); 
                    setIsAdmin(true); 
                    setView('tournament_hub'); 
                }} className="bg-brand-500 hover:bg-brand-600 text-black px-12 py-5 rounded-2xl font-black text-xl shadow-xl transition-all uppercase italic flex items-center gap-3"><Trophy size={24} /> Gerar Chaveamento</button></div>
            </div>
        </div>
    );
  }

  if (view === 'tournament_hub') {
    const totalRounds = Math.ceil(Math.log2(tournament.teams.length));

    return (
        <div className="max-w-full mx-auto py-8 px-4 animate-fade-in flex flex-col h-screen overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-2xl shrink-0">
                <div><h1 className="text-3xl font-black uppercase text-white italic tracking-tighter">{tournament.name}</h1><p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">Status: Torneio Ativo</p></div>
                <div className="flex gap-2 bg-gray-950 p-1.5 rounded-2xl border border-gray-800">
                    <button onClick={() => setHubTab('bracket')} className={`px-6 py-2 rounded-xl font-black text-xs uppercase transition-all italic ${hubTab === 'bracket' ? 'bg-brand-500 text-black' : 'text-gray-500 hover:text-white'}`}>Chaveamento</button>
                    <button onClick={() => setHubTab('standings')} className={`px-6 py-2 rounded-xl font-black text-xs uppercase transition-all italic ${hubTab === 'standings' ? 'bg-brand-500 text-black' : 'text-gray-500 hover:text-white'}`}>Classificação</button>
                    <button onClick={() => setHubTab('mvp')} className={`px-6 py-2 rounded-xl font-black text-xs uppercase transition-all italic ${hubTab === 'mvp' ? 'bg-brand-500 text-black' : 'text-gray-500 hover:text-white'}`}>Ranking MVP</button>
                </div>
                <div className="flex items-center gap-3">
                    {isAdmin && <button onClick={endTournament} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg italic">Encerrar Torneio</button>}
                    {isAdmin && <button onClick={() => downloadDivAsImage('bracket-capture-area', 'chaveamento-camp')} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-brand-500 border border-brand-500/20" title="Baixar Bracket"><Download size={20}/></button>}
                    <button onClick={() => setView('home')} className="p-2 hover:bg-gray-800 rounded-full text-gray-500 transition-all active:scale-90"><X size={24}/></button>
                </div>
            </div>
            
            <div className="flex-1 bg-gray-900/50 border border-gray-800 rounded-3xl p-8 overflow-auto relative custom-scrollbar">
                {hubTab === 'bracket' && (
                    <div id="bracket-capture-area" className="min-w-[1200px] min-h-full bg-gray-950/20 p-10">
                        <div className="flex gap-24 items-center justify-center">
                            {Array.from({ length: totalRounds }).map((_, rIdx) => {
                                const roundNum = rIdx + 1;
                                const roundMatches = tournament.matches.filter(m => m.round === roundNum);
                                return (
                                  <div key={roundNum} className="flex flex-col gap-12 items-center">
                                      <h3 className="text-center font-black text-brand-500 uppercase text-sm mb-6 border-b-2 border-brand-500 pb-2 px-6 italic tracking-widest">{getRoundName(roundNum, totalRounds)}</h3>
                                      <div className="flex flex-col gap-20 justify-around h-full py-10">
                                          {roundMatches.map((m, mIdx) => (
                                              <div key={m.id} onClick={() => startTournamentMatch(m.id)} className={`relative bg-gray-900 border-2 rounded-xl w-72 transition-all cursor-pointer group shadow-2xl ${m.status === 'finished' || m.status === 'wo' ? 'border-gray-800 opacity-60' : 'border-gray-800 hover:border-brand-500'}`}>
                                                  <div className="absolute -top-3 left-4 px-2 bg-gray-950 text-[8px] font-black text-gray-500 uppercase tracking-widest italic">{m.status === 'wo' ? 'W.O.' : `Partida ${m.id}`}</div>
                                                  <div className="p-4 space-y-2">
                                                      <div className="flex justify-between items-center h-10 px-3 rounded bg-black/40 border border-white/5">
                                                          <span className={`font-black text-sm truncate italic ${m.winnerId === m.teamAId && m.winnerId ? 'text-brand-500' : 'text-gray-400'}`}>{tournament.teams.find(t => t.id === m.teamAId)?.name || 'AGUARDANDO...'}</span>
                                                          <span className="font-mono text-sm font-black text-gray-600">{m.scoreA}</span>
                                                      </div>
                                                      <div className="flex justify-between items-center h-10 px-3 rounded bg-black/40 border border-white/5">
                                                          <span className={`font-black text-sm truncate italic ${m.winnerId === m.teamBId && m.winnerId ? 'text-brand-500' : 'text-gray-400'}`}>{tournament.teams.find(t => t.id === m.teamBId)?.name || 'AGUARDANDO...'}</span>
                                                          <span className="font-mono text-sm font-black text-gray-600">{m.scoreB}</span>
                                                      </div>
                                                  </div>
                                                  {roundNum < totalRounds && (
                                                      <div className="absolute -right-24 top-1/2 -translate-y-1/2 w-24 flex items-center">
                                                          <div className="h-px bg-gray-800 flex-1"></div>
                                                          <div className={`w-px bg-gray-800 ${mIdx % 2 === 0 ? 'h-[160px] translate-y-[80px]' : 'h-[160px] -translate-y-[80px]'}`}></div>
                                                      </div>
                                                  )}
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                                );
                            })}
                            <div className="flex flex-col items-center ml-10">
                                <div className="w-20 h-20 rounded-full bg-brand-500 flex items-center justify-center text-black mb-4 shadow-[0_0_50px_rgba(234,179,8,0.4)] animate-pulse"><Trophy size={40} /></div>
                                <h3 className="text-center font-black text-white uppercase text-sm mb-2 italic">CAMPEÃO</h3>
                                <div className="bg-gray-800 px-10 py-5 rounded-3xl border-2 border-brand-500 text-3xl font-black text-brand-500 uppercase italic shadow-2xl tracking-tighter">
                                    {tournament.matches.find(m => m.round === totalRounds)?.winnerId 
                                      ? tournament.teams.find(t => t.id === tournament.matches.find(m => m.round === totalRounds)?.winnerId)?.name 
                                      : 'EM DISPUTA'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {hubTab === 'standings' && (
                    <div className="h-full overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-900 text-gray-500 text-[10px] uppercase font-black sticky top-0">
                                <tr>
                                    <th className="p-4 rounded-tl-2xl italic">#</th>
                                    <th className="p-4 italic">Time</th>
                                    <th className="p-4 text-center">Partidas</th>
                                    <th className="p-4 text-center text-green-500">Vitórias</th>
                                    <th className="p-4 text-center text-red-500">Derrotas</th>
                                    <th className="p-4 text-center text-brand-500">RG (Rounds Ganhas)</th>
                                    <th className="p-4 text-center text-gray-600">RP (Rounds Perdidas)</th>
                                    <th className="p-4 text-center rounded-tr-2xl">Saldo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {[...tournament.teams].sort((a, b) => (b.stats.wins - a.stats.wins) || (b.stats.roundsWon - a.stats.roundsWon)).map((t, idx) => (
                                    <tr key={t.id} className="hover:bg-gray-800/30 transition-colors">
                                        <td className="p-4 font-black text-gray-600 italic">#{idx + 1}</td>
                                        <td className="p-4 font-black text-white uppercase italic">{t.name}</td>
                                        <td className="p-4 text-center font-bold text-gray-400">{t.stats.matchesPlayed}</td>
                                        <td className="p-4 text-center font-bold text-green-500">{t.stats.wins}</td>
                                        <td className="p-4 text-center font-bold text-red-500">{t.stats.losses}</td>
                                        <td className="p-4 text-center font-black text-brand-500">{t.stats.roundsWon}</td>
                                        <td className="p-4 text-center font-black text-gray-600">{t.stats.roundsLost}</td>
                                        <td className="p-4 text-center font-black text-white">{t.stats.roundsWon - t.stats.roundsLost}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {hubTab === 'mvp' && (
                    <div className="h-full overflow-auto custom-scrollbar">
                         <div className="flex items-center gap-3 mb-8"><Medal className="text-brand-500" size={32} /><h2 className="text-2xl font-black uppercase text-white italic">Ranking MVP</h2></div>
                         <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-900 text-gray-500 text-[10px] uppercase font-black sticky top-0">
                                <tr><th className="p-4">Rank</th><th className="p-4">Jogador</th><th className="p-4">Equipe</th><th className="p-4 text-center">Abates</th><th className="p-4 text-center">Média</th><th className="p-4 text-center">Dano Total</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {tournament.teams.flatMap(t => t.players.map(p => ({ ...p, teamName: t.name }))).sort((a: any, b: any) => b.stats.totalKills - a.stats.totalKills).map((p, idx) => (
                                    <tr key={p.id} className="hover:bg-gray-800/30 transition-colors group">
                                        <td className="p-4">{idx === 0 ? <Crown className="text-yellow-500" size={18} /> : <span className="font-black text-gray-600">#{idx + 1}</span>}</td>
                                        <td className="p-4 font-black text-white uppercase group-hover:text-brand-500 transition-colors">{p.name}</td>
                                        <td className="p-4"><span className="text-[10px] font-black text-gray-500 uppercase bg-gray-800 px-2 py-1 rounded-md">{p.teamName}</span></td>
                                        <td className="p-4 text-center font-black text-white">{p.stats.totalKills}</td>
                                        <td className="p-4 text-center font-bold text-gray-400">{p.stats.matchesPlayed > 0 ? (p.stats.totalKills / p.stats.matchesPlayed).toFixed(2) : '0.00'}</td>
                                        <td className="p-4 text-center font-mono text-xs text-gray-500">{p.stats.totalDamage}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
  }

  return null;
}

export default PicksBans;
