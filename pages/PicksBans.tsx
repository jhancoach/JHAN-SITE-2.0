
import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Map as MapIcon, Shield, Users, 
  ChevronRight, Play, RefreshCw, LayoutGrid, 
  CheckCircle, History, Download, X, Sword, MonitorPlay, ChevronLeft, Save,
  RotateCcw, GripVertical, CheckSquare, Settings, Crown, AlertTriangle, ArrowRight, Clock, Pause,
  Search, Zap, Lock, Edit2, CornerDownRight, Timer, HelpCircle, UserPlus, Grid, GitMerge, Upload, List, BarChart2, Target, Heart, Crosshair, Plus, Eye, Unlock, User, Medal, Undo2, Redo2, Home, Minus,
  Activity, TrendingUp
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

type ViewState = 'home' | 'mode' | 'maps' | 'draft' | 'tournament_setup' | 'tournament_hub' | 'map_veto' | 'series_summary';
type DraftMode = 'snake' | 'linear';
type TournamentFormat = 'single' | 'double' | 'swiss';
type Winner = 'A' | 'B' | null;

interface DraftHistoryItem {
  team: 'A' | 'B';
  type: 'ban' | 'pick';
  charName: string;
  label: string;
}

interface TournamentPlayer {
    id: string;
    name: string;
    stats: { totalKills: number; totalDamage: number; matchesPlayed: number; }
}

interface TournamentTeam {
    id: string;
    name: string;
    logo: string | null;
    players: TournamentPlayer[];
    stats: { wins: number, losses: number, matchesPlayed: number, roundsWon: number, roundsLost: number };
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
    map?: string;
    isFinal?: boolean;
}

interface TournamentState {
    name: string;
    format: TournamentFormat;
    draftMode: DraftMode;
    seriesFormat: number; 
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
  ]
};

const PicksBans: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');
  const [isAdmin, setIsAdmin] = useState(false);
  const [hubTab, setHubTab] = useState<'bracket' | 'mvp' | 'standings'>('bracket');

  // --- GENERAL MATCH STATE ---
  const [teamA, setTeamA] = useState('TIME A');
  const [teamB, setTeamB] = useState('TIME B');
  const [teamAId, setTeamAId] = useState<string | null>(null);
  const [teamBId, setTeamBId] = useState<string | null>(null);
  const [mode, setMode] = useState<DraftMode>('snake');
  const [format, setFormat] = useState(1); 

  const [maps, setMaps] = useState<string[]>([]);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const [seriesScore, setSeriesScore] = useState({ A: 0, B: 0 });
  
  // --- DRAFT SESSION STATE ---
  const [stepIndex, setStepIndex] = useState(0);
  const [bans, setBans] = useState({ A: null as string | null, B: null as string | null });
  const [picksA, setPicksA] = useState<string[]>([]);
  const [picksB, setPicksB] = useState<string[]>([]);
  const [draftHistory, setDraftHistory] = useState<DraftHistoryItem[]>([]);
  const [timer, setTimer] = useState(30);

  // --- TOURNAMENT STATE ---
  const [tournament, setTournament] = useState<TournamentState>(() => {
      const saved = localStorage.getItem('pb_tournament_v3');
      return saved ? JSON.parse(saved) : {
          name: '', format: 'single', draftMode: 'snake', seriesFormat: 1, adminPassword: '', teams: [], matches: [], activeMatchId: null
      };
  });
  const [newTeam, setNewTeam] = useState({ name: '', logo: '', players: Array(6).fill('') });
  const [vetoState, setVetoState] = useState<{ turn: 'A' | 'B', bans: string[] }>({ turn: 'A', bans: [] });

  // Modals
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [matchResult, setMatchResult] = useState({ winner: 'A' as Winner, scoreA: 0, scoreB: 0, isWO: false });
  const [tempPlayerStats, setTempPlayerStats] = useState<Record<string, { kills: number, damage: number }>>({});

  // --- PERSISTENCE ---
  useEffect(() => {
      localStorage.setItem('pb_tournament_v3', JSON.stringify(tournament));
  }, [tournament]);

  // --- LOGIC ---

  const order = ORDERS[mode];
  const isComplete = stepIndex >= order.length;
  const currentStep = !isComplete ? order[stepIndex] : null;
  const winsNeeded = Math.ceil(format / 2);

  useEffect(() => {
    if (view === 'draft' && !isComplete && timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [view, stepIndex, timer, isComplete]);

  const resetDraftState = () => {
      setStepIndex(0);
      setBans({ A: null, B: null });
      setPicksA([]);
      setPicksB([]);
      setDraftHistory([]);
      setTimer(30);
  };

  /**
   * FUNÇÃO DE RESET DEFINITIVO
   * Limpa tudo: localStorage, states de série, chaves, times e redireciona.
   */
  const endTournament = () => {
      if (window.confirm("⚠️ ENCERRAR TUDO?\n\nEsta ação é irreversível e apagará permanentemente todos os resultados, chaves de campeonato e placares de série.")) {
          // Limpa Storage
          localStorage.removeItem('pb_tournament_v3');
          
          // Reseta Estado do Campeonato
          setTournament({ 
              name: '', format: 'single', draftMode: 'snake', seriesFormat: 1, 
              adminPassword: '', teams: [], matches: [], activeMatchId: null 
          });

          // Reseta Estado de Times
          setNewTeam({ name: '', logo: '', players: Array(6).fill('') });

          // Reseta Estado de Série/Partida
          setSeriesScore({ A: 0, B: 0 });
          setCurrentMatchIdx(0);
          setMaps([]);
          resetDraftState();

          // Reseta Login/Visão
          setIsAdmin(false); 
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
      setTournament(prev => ({ ...prev, teams: [...prev.teams, { id: teamId, name: newTeam.name, logo: newTeam.logo || null, players, stats: { wins: 0, losses: 0, matchesPlayed: 0, roundsWon: 0, roundsLost: 0 } }] }));
      setNewTeam({ name: '', logo: '', players: Array(6).fill('') });
  };

  const startQuickMatchDraft = () => {
      resetDraftState();
      // Em Partida Rápida, o reset do score da série deve acontecer ao iniciar uma NOVA partida
      // Mas aqui garantimos que a navegação funcione
      setView('draft');
  };

  const drawMaps = () => {
      const pool = [...MAPS_DB]; const selected: string[] = [];
      const numMaps = format === 1 ? 1 : format;
      for(let i=0; i<numMaps; i++) {
          if (pool.length === 0) break;
          const rand = Math.floor(Math.random() * pool.length);
          selected.push(pool[rand].name); pool.splice(rand, 1);
      }
      setMaps(selected); 
      setSeriesScore({ A: 0, B: 0 }); // Inicia série do zero
      setCurrentMatchIdx(0);
      setView('maps');
  };

  const handlePick = (char: string) => {
    if (isComplete) return;
    const step = order[stepIndex];
    
    setDraftHistory(prev => [...prev, {
      team: step.team,
      type: step.type,
      charName: char,
      label: step.label
    }]);

    if (step.type === 'ban') setBans(prev => ({ ...prev, [step.team]: char }));
    else { if (step.team === 'A') setPicksA(prev => [...prev, char]); else setPicksB(prev => [...prev, char]); }
    
    setStepIndex(prev => prev + 1); 
    setTimer(30);
  };

  const saveMatchResults = () => {
    const isWinnerA = matchResult.winner === 'A';
    const newScoreA = seriesScore.A + (isWinnerA ? 1 : 0);
    const newScoreB = seriesScore.B + (isWinnerA ? 0 : 1);
    
    const isSeriesOver = newScoreA >= winsNeeded || newScoreB >= winsNeeded || format === 1;

    if (!isSeriesOver) {
        setSeriesScore({ A: newScoreA, B: newScoreB });
        setCurrentMatchIdx(prev => prev + 1);
        resetDraftState();
        setShowStatsModal(false);
        alert(`Queda finalizada!\nPróximo mapa: ${maps[currentMatchIdx + 1]}`);
        return;
    }

    if (!tournament.activeMatchId) {
        setSeriesScore({ A: newScoreA, B: newScoreB });
        setView('series_summary');
        setShowStatsModal(false);
        return;
    }

    const matchId = tournament.activeMatchId;
    const winnerId = isWinnerA ? teamAId : teamBId;

    setTournament(prev => {
        const updatedMatches = prev.matches.map(m => m.id === matchId ? { 
            ...m, status: matchResult.isWO ? 'wo' as const : 'finished' as const, winnerId: winnerId || null, 
            scoreA: newScoreA, scoreB: newScoreB, map: maps.slice(0, currentMatchIdx + 1).join(', ')
        } : m);

        const matchInfo = (matchId as string).split('-');
        const currentRound = parseInt(matchInfo[0].replace('M', ''), 10);
        const currentPos = parseInt(matchInfo[1], 10);
        const nextRound = currentRound + 1;
        const nextMatchId = `M${nextRound}-${Math.floor(currentPos / 2)}`;
        
        let finalMatches = [...updatedMatches];
        const nextIdx = updatedMatches.findIndex(m => m.id === nextMatchId);
        if (nextIdx !== -1) {
            const isTeamASlot = currentPos % 2 === 0;
            finalMatches[nextIdx] = { ...finalMatches[nextIdx], [isTeamASlot ? 'teamAId' : 'teamBId']: winnerId };
        }

        const updatedTeams = prev.teams.map(team => {
            if (team.id !== teamAId && team.id !== teamBId) return team;
            const isWinner = team.id === winnerId;
            const myRounds = team.id === teamAId ? newScoreA : newScoreB;
            const opRounds = team.id === teamAId ? newScoreB : newScoreA;
            const updatedPlayers = team.players.map(p => {
                const stats = tempPlayerStats[p.id] || { kills: 0, damage: 0 };
                return { ...p, stats: { ...p.stats, totalKills: p.stats.totalKills + stats.kills, totalDamage: p.stats.totalDamage + stats.damage, matchesPlayed: p.stats.matchesPlayed + 1 } };
            });
            return { ...team, players: updatedPlayers, stats: { ...team.stats, wins: team.stats.wins + (isWinner ? 1 : 0), losses: team.stats.losses + (isWinner ? 0 : 1), matchesPlayed: team.stats.matchesPlayed + 1, roundsWon: team.stats.roundsWon + myRounds, roundsLost: team.stats.roundsLost + opRounds } };
        });

        return { ...prev, teams: updatedTeams, matches: finalMatches, activeMatchId: null };
    });

    setShowStatsModal(false); 
    setTempPlayerStats({}); 
    setView('tournament_hub');
  };

  const startTournamentMatch = (matchId: string) => {
    if (!isAdmin) { alert("⚠️ ADMIN: Faça login na tela de Setup para gerenciar."); return; }
    const match = tournament.matches.find(m => m.id === matchId);
    if (!match || !match.teamAId || !match.teamBId) return;
    
    setTournament(prev => ({ ...prev, activeMatchId: matchId }));
    const tA = tournament.teams.find(t => t.id === match.teamAId);
    const tB = tournament.teams.find(t => t.id === match.teamBId);
    setTeamA(tA!.name); setTeamB(tB!.name);
    setTeamAId(tA!.id); setTeamBId(tB!.id);
    
    // Regra da Final forçada para MD3
    setFormat(match.isFinal ? 3 : tournament.seriesFormat);
    setMode(tournament.draftMode);
    setSeriesScore({ A: 0, B: 0 });
    setCurrentMatchIdx(0);
    
    if (match.status === 'finished') {
        alert("Esta partida já foi finalizada.");
        return;
    }
    
    setVetoState({ turn: 'A', bans: [] });
    setView('map_veto');
  };

  // --- VIEWS ---

  if (view === 'home') {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-fade-in px-4">
            <div className="text-center space-y-2">
                <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-600 uppercase tracking-tighter italic">Picks & Bans</h1>
                <p className="text-gray-500 text-lg uppercase tracking-widest font-medium">Plataforma Analítica Profissional</p>
            </div>
            
            {tournament.matches.length > 0 ? (
                <div className="bg-brand-500/10 border border-brand-500 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between shadow-2xl w-full max-w-4xl gap-6">
                    <div className="flex items-center gap-4 text-left">
                        <div className="p-3 bg-brand-500 rounded-2xl text-black shadow-lg"><Trophy size={24} /></div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase italic leading-none">{tournament.name}</h3>
                            <p className="text-xs text-brand-500 font-bold uppercase mt-1">Campeonato Ativo</p>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button onClick={() => setView('tournament_hub')} className="flex-1 bg-brand-500 hover:bg-brand-600 text-black px-8 py-3 rounded-xl font-black uppercase text-xs italic transition-all shadow-lg">Continuar</button>
                        <button onClick={endTournament} className="flex-1 bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-xl font-black uppercase text-xs italic transition-all shadow-lg">Encerrar</button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                    <button onClick={() => { setSeriesScore({A:0, B:0}); setView('mode'); }} className="bg-gray-950 border border-gray-800 rounded-3xl p-8 hover:border-brand-500 transition-all text-left group shadow-xl">
                        <div className="p-3 bg-gray-900 rounded-2xl mb-4 text-brand-500 group-hover:scale-110 transition-transform"><Sword size={32} /></div>
                        <h2 className="text-2xl font-black text-white mb-1 uppercase italic">Partida Rápida</h2>
                        <p className="text-sm text-gray-500">Draft avulso MD1, MD3 ou MD5.</p>
                    </button>
                    <button onClick={() => setView('tournament_setup')} className="bg-gray-950 border border-gray-800 rounded-3xl p-8 hover:border-blue-500 transition-all text-left group shadow-xl">
                        <div className="p-3 bg-gray-900 rounded-2xl mb-4 text-blue-500 group-hover:scale-110 transition-transform"><Trophy size={32} /></div>
                        <h2 className="text-2xl font-black text-white mb-1 uppercase italic">Campeonato</h2>
                        <p className="text-sm text-gray-500">Gestão completa de chaves e ranking.</p>
                    </button>
                </div>
            )}
        </div>
    );
  }

  if (view === 'mode') {
    return (
        <div className="max-w-4xl mx-auto py-20 px-4 animate-fade-in text-center space-y-10">
            <button onClick={() => setView('home')} className="flex items-center gap-2 font-bold uppercase text-xs text-gray-500 hover:text-white transition-colors"><ChevronLeft /> Voltar</button>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter">Configuração da Série</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 space-y-4">
                    <h3 className="text-brand-500 font-bold uppercase text-xs tracking-widest">Série (MD)</h3>
                    <div className="flex gap-2">{[1, 3, 5].map(f => <button key={f} onClick={() => setFormat(f)} className={`flex-1 py-3 rounded-xl font-black border-2 transition-all ${format === f ? 'bg-brand-500 text-black border-brand-500 shadow-lg' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>MD{f}</button>)}</div>
                </div>
                <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 space-y-4">
                    <h3 className="text-brand-500 font-bold uppercase text-xs tracking-widest">Modo de Seleção</h3>
                    <div className="flex gap-2">{['snake', 'linear'].map(m => <button key={m} onClick={() => setMode(m as any)} className={`flex-1 py-3 rounded-xl font-black border-2 uppercase transition-all ${mode === m ? 'bg-brand-500 text-black border-brand-500 shadow-lg' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>{m}</button>)}</div>
                </div>
            </div>
            <button onClick={drawMaps} className="bg-brand-500 hover:bg-brand-600 text-black px-12 py-5 rounded-2xl font-black text-xl shadow-2xl uppercase italic transition-all hover:scale-105 active:scale-95">Sortear Mapas & Iniciar</button>
        </div>
    );
  }

  if (view === 'maps') {
    return (
        <div className="max-w-5xl mx-auto py-20 px-4 animate-fade-in text-center">
            <h2 className="text-3xl font-black uppercase mb-10 italic tracking-tighter">Mapas Sorteados (MD{format})</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {maps.map((m, i) => (
                    <div key={i} className="relative aspect-video rounded-2xl overflow-hidden border-2 border-gray-800 shadow-xl group transition-all hover:border-brand-500">
                        <img src={MAPS_DB.find(map => map.name === m)?.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-2xl font-black uppercase text-white drop-shadow-lg italic">{m}</span></div>
                        <div className="absolute top-2 left-2 bg-brand-500 text-black px-3 py-1 rounded-lg text-xs font-black italic">JOGO {i+1}</div>
                    </div>
                ))}
            </div>
            <div className="flex justify-center gap-4">
                <button onClick={drawMaps} className="p-4 bg-gray-800 rounded-xl text-white hover:bg-gray-700 transition-all shadow-lg"><RefreshCw size={24}/></button>
                <button onClick={startQuickMatchDraft} className="px-10 py-4 bg-green-600 rounded-xl text-white font-black uppercase italic shadow-2xl hover:bg-green-500 transition-all">Iniciar Picks & Bans</button>
            </div>
        </div>
    );
  }

  if (view === 'map_veto') {
      const currentVetoTeam = vetoState.turn === 'A' ? teamA : teamB;
      const mapsLeft = MAPS_DB.length - vetoState.bans.length;
      const mapsNeeded = format;

      const handleVeto = (mapName: string) => {
          const newBans = [...vetoState.bans, mapName];
          if (mapsLeft > mapsNeeded + 1) {
              setVetoState({ turn: vetoState.turn === 'A' ? 'B' : 'A', bans: newBans });
          } else {
              const remaining = MAPS_DB.filter(m => !newBans.includes(m.name)).map(m => m.name);
              setMaps(remaining.slice(0, format));
              resetDraftState();
              setView('draft');
          }
      };

      return (
          <div className="max-w-4xl mx-auto py-20 px-4 animate-fade-in text-center">
              <h2 className="text-4xl font-black uppercase text-white mb-2 italic tracking-tighter">Veto de Mapas</h2>
              <p className={`text-xl font-bold uppercase mb-10 ${vetoState.turn === 'A' ? 'text-teamA' : 'text-teamB'}`}>Vez de {currentVetoTeam} BANIR um mapa</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {MAPS_DB.map(map => {
                      const isBanned = vetoState.bans.includes(map.name);
                      return (
                          <button key={map.name} disabled={isBanned} onClick={() => handleVeto(map.name)} className={`relative aspect-video rounded-2xl overflow-hidden border-4 transition-all ${isBanned ? 'border-red-600 grayscale opacity-40' : 'border-gray-800 hover:border-white hover:scale-105 shadow-xl'}`}>
                              <img src={map.img} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-xl font-black uppercase text-white drop-shadow-lg italic">{map.name}</span></div>
                              {isBanned && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><X size={60} className="text-red-500" strokeWidth={4} /></div>}
                          </button>
                      );
                  })}
              </div>
          </div>
      );
  }

  if (view === 'draft') {
      const renderSlot = (type: 'ban' | 'pick', team: 'A' | 'B', index: number) => {
          const isTarget = !isComplete && currentStep.type === type && currentStep.team === team && (type === 'ban' ? true : (team === 'A' ? picksA.length === index : picksB.length === index));
          let charName = (type === 'ban') ? (team === 'A' ? bans.A : bans.B) : (team === 'A' ? picksA[index] : picksB[index]);
          const char = charName ? CHARACTERS_DB.find(c => c.name === charName) : null;
          return (
              <div className={`relative w-20 h-28 rounded-xl border-2 transition-all flex flex-col items-center justify-center overflow-hidden ${isTarget ? 'border-brand-500 bg-brand-500/10 shadow-[0_0_15px_rgba(234,179,8,0.4)] animate-pulse' : charName ? (type === 'ban' ? 'border-red-500 bg-red-500/5' : (team === 'A' ? 'border-teamA bg-teamA/5' : 'border-teamB bg-teamB/5')) : 'border-gray-800 bg-gray-950 border-dashed opacity-40'}`}>
                  {char ? (<><img src={char.img} className="w-full h-full object-cover" /><div className="absolute bottom-0 inset-x-0 bg-black/80 py-1 text-[8px] font-black text-center uppercase italic border-t border-white/10">{char.name}</div></>) : (<span className="text-[10px] font-black uppercase opacity-20">{type === 'ban' ? 'BAN' : `P${index + 1}`}</span>)}
              </div>
          );
      };

      return (
          <div className="flex flex-col h-screen bg-gray-950 text-white animate-fade-in select-none overflow-hidden">
              {/* Draft Header */}
              <div className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 shrink-0 shadow-lg">
                  <div className="flex items-center gap-4">
                      <button onClick={() => setView('home')} className="p-2 hover:bg-gray-800 rounded-lg text-gray-500 transition-colors"><Home size={20}/></button>
                      <div className="h-6 w-px bg-gray-800"></div>
                      <div className="flex flex-col">
                          <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest italic">{maps[currentMatchIdx]}</span>
                          <span className="text-xs font-bold text-gray-400">MD{format} - Queda {currentMatchIdx + 1}</span>
                      </div>
                  </div>
                  
                  <div className="bg-gray-950 px-6 py-1.5 rounded-full border border-gray-800 flex items-center gap-8 shadow-inner">
                      <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-teamA shadow-[0_0_8px_#3b82f6]"></div><span className="text-sm font-black uppercase italic">{teamA} <span className="text-brand-500 ml-2 text-xl">{seriesScore.A}</span></span></div>
                      <div className="text-[10px] font-black text-gray-700 italic tracking-tighter">VS</div>
                      <div className="flex items-center gap-3"><span className="text-sm font-black uppercase italic"><span className="text-brand-500 mr-2 text-xl">{seriesScore.B}</span> {teamB}</span><div className="w-2 h-2 rounded-full bg-teamB shadow-[0_0_8px_#f97316]"></div></div>
                  </div>

                  <div className="flex items-center gap-3">
                      {isComplete && <button onClick={() => setShowStatsModal(true)} className="bg-green-600 hover:bg-green-500 text-white px-8 py-2.5 rounded-xl font-black shadow-lg animate-pulse uppercase text-xs italic tracking-widest transition-all">Confirmar Resultado</button>}
                      <button onClick={() => downloadDivAsImage('draft-main-capture', 'draft-resumo')} className="p-2.5 bg-gray-800 rounded-xl hover:bg-gray-700 transition-all text-brand-500"><Download size={20}/></button>
                  </div>
              </div>

              {/* Draft Area */}
              <div id="draft-main-capture" className="bg-gray-900 border-b border-gray-800 p-8 shadow-xl">
                  <div className="flex justify-between items-start max-w-7xl mx-auto w-full gap-8">
                      <div className="flex flex-col gap-6 items-start">
                          <div className="flex items-center gap-4"><div className="w-12 h-12 bg-teamA/10 border border-teamA rounded-2xl flex items-center justify-center font-black text-teamA text-xl italic shadow-lg">A</div><div className="text-left"><p className="text-2xl font-black uppercase italic leading-none tracking-tighter text-white">{teamA}</p><p className="text-[10px] font-bold text-teamA uppercase tracking-widest mt-1 opacity-60">ATAQUE</p></div></div>
                          <div className="flex gap-2.5">{renderSlot('ban', 'A', 0)}<div className="w-px h-28 bg-gray-800 mx-2"></div>{[0, 1, 2, 3].map(i => renderSlot('pick', 'A', i))}</div>
                      </div>

                      <div className="flex flex-col items-center flex-1 py-4 justify-center">
                          {!isComplete ? (
                              <div className="flex flex-col items-center animate-fade-in">
                                  <div className={`text-8xl font-black italic tracking-tighter tabular-nums leading-none ${timer < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timer}</div>
                                  <div className={`mt-6 px-8 py-2.5 rounded-full font-black uppercase text-xs tracking-widest shadow-lg ${currentStep.type === 'ban' ? 'bg-red-600' : currentStep.team === 'A' ? 'bg-teamA shadow-teamA/20' : 'bg-teamB shadow-teamB/20'}`}>{currentStep.type === 'ban' ? 'BANIMENTO' : 'SELEÇÃO'} • {currentStep.team === 'A' ? teamA : teamB}</div>
                              </div>
                          ) : (
                              <div className="flex flex-col items-center text-center animate-fade-in">
                                  <div className="w-20 h-20 rounded-full bg-green-500/10 border-4 border-green-500 flex items-center justify-center text-green-500 mb-4 shadow-[0_0_30px_rgba(34,197,94,0.3)]"><CheckCircle size={48} strokeWidth={3}/></div>
                                  <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white leading-none">DRAFT PRONTO</h2>
                                  <p className="text-[10px] font-bold text-gray-500 uppercase mt-2 tracking-widest italic">Prepare-se para entrar no jogo</p>
                              </div>
                          )}
                          
                          <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-md opacity-40">
                              {order.map((o, idx) => (
                                  <div key={idx} className={`w-2 h-2 rounded-full border ${idx < stepIndex ? (o.type === 'ban' ? 'bg-red-500 border-red-500' : o.team === 'A' ? 'bg-teamA border-teamA' : 'bg-teamB border-teamB') : 'border-gray-700 bg-transparent'}`}></div>
                              ))}
                          </div>
                      </div>

                      <div className="flex flex-col gap-6 items-end">
                          <div className="flex items-center gap-4 flex-row-reverse"><div className="w-12 h-12 bg-teamB/10 border border-teamB rounded-2xl flex items-center justify-center font-black text-teamB text-xl italic shadow-lg">B</div><div className="text-right"><p className="text-2xl font-black uppercase italic leading-none tracking-tighter text-white">{teamB}</p><p className="text-[10px] font-bold text-teamB uppercase tracking-widest mt-1 opacity-60">DEFESA</p></div></div>
                          <div className="flex gap-2.5 flex-row-reverse">{renderSlot('ban', 'B', 0)}<div className="w-px h-28 bg-gray-800 mx-2"></div>{[0, 1, 2, 3].map(i => renderSlot('pick', 'B', i))}</div>
                      </div>
                  </div>
              </div>

              {/* Characters Grid */}
              <div className="flex-1 overflow-y-auto p-8 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4 max-w-7xl mx-auto">
                      {CHARACTERS_DB.map(char => {
                          const isUsed = picksA.includes(char.name) || picksB.includes(char.name) || bans.A === char.name || bans.B === char.name;
                          return (
                              <button key={char.name} disabled={isUsed || isComplete} onClick={() => handlePick(char.name)} className={`relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all duration-300 shadow-xl ${isUsed ? 'border-gray-800 opacity-20 grayscale cursor-not-allowed' : 'border-gray-700 hover:border-brand-500 hover:scale-110 active:scale-95'}`}>
                                  <img src={char.img} className="w-full h-full object-cover" />
                                  <div className="absolute bottom-0 inset-x-0 bg-black/90 py-1.5 text-[9px] font-black text-center uppercase truncate italic border-t border-white/5">{char.name}</div>
                              </button>
                          );
                      })}
                  </div>
              </div>

              {/* RESULT MODAL */}
              {showStatsModal && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
                      <div className="bg-gray-900 border border-brand-500/50 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden my-auto border-2">
                          <div className="p-8 border-b border-gray-800 flex justify-between items-center bg-gray-950/50">
                              <div><h2 className="text-3xl font-black uppercase text-white italic tracking-tighter">Quem venceu a queda?</h2><p className="text-sm text-gray-500 uppercase font-bold tracking-widest mt-1">{maps[currentMatchIdx]} • JOGO {currentMatchIdx + 1} DE {format}</p></div>
                              <button onClick={() => setShowStatsModal(false)} className="p-3 hover:bg-gray-800 rounded-full transition-all hover:rotate-90"><X size={28}/></button>
                          </div>
                          
                          <div className="p-10 space-y-12">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                  <div onClick={() => setMatchResult(p => ({...p, winner: 'A'}))} className={`p-10 rounded-[2rem] border-4 cursor-pointer transition-all relative overflow-hidden ${matchResult.winner === 'A' ? 'border-teamA bg-teamA/10 scale-105 shadow-[0_0_50px_rgba(59,130,246,0.3)]' : 'border-gray-800 grayscale hover:grayscale-0'}`}>
                                      {matchResult.winner === 'A' && <div className="absolute top-6 left-6 bg-teamA text-white p-3 rounded-2xl shadow-xl animate-bounce"><Trophy size={32} fill="currentColor"/></div>}
                                      <h3 className="text-4xl font-black text-teamA italic uppercase text-center mb-2 tracking-tighter">{teamA}</h3>
                                      <p className="text-xs font-black text-gray-500 uppercase tracking-widest text-center mt-4">Vencedor</p>
                                  </div>
                                  <div onClick={() => setMatchResult(p => ({...p, winner: 'B'}))} className={`p-10 rounded-[2rem] border-4 cursor-pointer transition-all relative overflow-hidden ${matchResult.winner === 'B' ? 'border-teamB bg-teamB/10 scale-105 shadow-[0_0_50px_rgba(249,115,22,0.3)]' : 'border-gray-800 grayscale hover:grayscale-0'}`}>
                                      {matchResult.winner === 'B' && <div className="absolute top-6 right-6 bg-teamB text-white p-3 rounded-2xl shadow-xl animate-bounce"><Trophy size={32} fill="currentColor"/></div>}
                                      <h3 className="text-4xl font-black text-teamB italic uppercase text-center mb-2 tracking-tighter">{teamB}</h3>
                                      <p className="text-xs font-black text-gray-500 uppercase tracking-widest text-center mt-4">Vencedor</p>
                                  </div>
                              </div>

                              {/* Timeline Visualizer */}
                              <div className="bg-gray-950 p-8 rounded-[2rem] border border-gray-800 relative overflow-hidden shadow-inner">
                                  <div className="flex items-center gap-3 mb-6"><Activity size={18} className="text-brand-500"/><h4 className="text-xs font-black text-gray-400 uppercase italic tracking-[0.2em]">Timeline do Draft</h4></div>
                                  <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar">
                                      {draftHistory.map((step, i) => (
                                          <div key={i} className="flex flex-col items-center gap-3 shrink-0 animate-fade-in-down" style={{animationDelay: `${i*0.05}s`}}>
                                              <span className="text-[9px] font-black text-gray-600 uppercase">{step.label}</span>
                                              <div className={`w-16 h-22 rounded-xl border-2 overflow-hidden shadow-lg ${step.type === 'ban' ? 'border-red-500 bg-red-600/5' : step.team === 'A' ? 'border-teamA bg-teamA/5' : 'border-teamB bg-teamB/5'}`}>
                                                  <img src={CHARACTERS_DB.find(c => c.name === step.charName)?.img} className="w-full h-full object-cover" />
                                              </div>
                                              <span className={`text-[10px] font-black uppercase italic ${step.team === 'A' ? 'text-teamA' : 'text-teamB'}`}>{step.team}</span>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                              
                              {/* SCOUT (Só aparece se for campeonato para salvar stats dos jogadores) */}
                              {tournament.activeMatchId && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-teamA uppercase border-b border-teamA/20 pb-2 flex items-center gap-2"><Plus size={14}/> Scout {teamA}</h4>
                                        {tournament.teams.find(t => t.id === teamAId)?.players.map(p => (
                                            <div key={p.id} className="grid grid-cols-[1fr_80px_80px] gap-2 items-center bg-black/40 p-2 rounded-xl border border-white/5">
                                                <span className="text-xs font-black truncate text-gray-300 ml-2">{p.name}</span>
                                                <input type="number" placeholder="KILLS" className="bg-gray-900 border border-gray-800 p-1.5 rounded text-center text-[10px] font-black outline-none focus:border-brand-500" value={tempPlayerStats[p.id]?.kills || ''} onChange={e => setTempPlayerStats(prev => ({...prev, [p.id]: { ...(prev[p.id] || {damage:0}), kills: parseInt(e.target.value) || 0 }}))}/>
                                                <input type="number" placeholder="DANO" className="bg-gray-900 border border-gray-800 p-1.5 rounded text-center text-[10px] font-black outline-none focus:border-brand-500" value={tempPlayerStats[p.id]?.damage || ''} onChange={e => setTempPlayerStats(prev => ({...prev, [p.id]: { ...(prev[p.id] || {kills:0}), damage: parseInt(e.target.value) || 0 }}))}/>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-teamB uppercase border-b border-teamB/20 pb-2 flex items-center gap-2"><Plus size={14}/> Scout {teamB}</h4>
                                        {tournament.teams.find(t => t.id === teamBId)?.players.map(p => (
                                            <div key={p.id} className="grid grid-cols-[1fr_80px_80px] gap-2 items-center bg-black/40 p-2 rounded-xl border border-white/5">
                                                <span className="text-xs font-black truncate text-gray-300 ml-2">{p.name}</span>
                                                <input type="number" placeholder="KILLS" className="bg-gray-900 border border-gray-800 p-1.5 rounded text-center text-[10px] font-black outline-none focus:border-brand-500" value={tempPlayerStats[p.id]?.kills || ''} onChange={e => setTempPlayerStats(prev => ({...prev, [p.id]: { ...(prev[p.id] || {damage:0}), kills: parseInt(e.target.value) || 0 }}))}/>
                                                <input type="number" placeholder="DANO" className="bg-gray-900 border border-gray-800 p-1.5 rounded text-center text-[10px] font-black outline-none focus:border-brand-500" value={tempPlayerStats[p.id]?.damage || ''} onChange={e => setTempPlayerStats(prev => ({...prev, [p.id]: { ...(prev[p.id] || {kills:0}), damage: parseInt(e.target.value) || 0 }}))}/>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                              )}
                          </div>

                          <div className="p-10 bg-gray-950/80 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-8">
                              <div className="flex items-center gap-10 text-left">
                                  <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase italic tracking-widest mb-1">Placar Atual da Série</p>
                                    <div className="text-4xl font-black text-white italic tracking-tighter flex items-center gap-4">
                                        <span className="text-teamA">{seriesScore.A + (matchResult.winner === 'A' ? 1 : 0)}</span>
                                        <span className="text-gray-700 text-xl">X</span>
                                        <span className="text-teamB">{seriesScore.B + (matchResult.winner === 'B' ? 1 : 0)}</span>
                                    </div>
                                  </div>
                                  <div className="h-14 w-px bg-gray-800 hidden md:block"></div>
                                  <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase italic tracking-widest mb-1">Vitórias Necessárias</p>
                                    <p className="text-2xl font-black text-brand-500 italic">{winsNeeded}</p>
                                  </div>
                              </div>
                              <div className="flex gap-4 w-full md:w-auto">
                                  <button onClick={() => setShowStatsModal(false)} className="flex-1 md:flex-none px-12 py-5 bg-gray-800 hover:bg-gray-700 rounded-2xl font-black text-xs uppercase italic transition-all border border-white/5">Cancelar</button>
                                  <button onClick={saveMatchResults} className="flex-1 md:flex-none px-16 py-5 bg-brand-500 hover:bg-brand-600 text-black rounded-2xl font-black text-sm uppercase italic transition-all shadow-[0_0_40px_rgba(234,179,8,0.3)] hover:scale-105 active:scale-95">
                                    {(seriesScore.A + (matchResult.winner === 'A' ? 1 : 0) >= winsNeeded || seriesScore.B + (matchResult.winner === 'B' ? 1 : 0) >= winsNeeded || format === 1) ? 'Ver Resultado Final' : 'Confirmar e Próxima Queda'}
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  if (view === 'series_summary') {
    const winnerName = seriesScore.A > seriesScore.B ? teamA : teamB;
    return (
        <div className="flex flex-col items-center justify-center min-h-[85vh] p-4 animate-fade-in space-y-12">
            <div className="relative text-center">
                <div className="absolute inset-0 bg-brand-500/20 blur-[120px] rounded-full animate-pulse"></div>
                <div className="relative">
                    <div className="w-24 h-24 bg-brand-500 rounded-3xl flex items-center justify-center text-black shadow-2xl mx-auto mb-8 transform -rotate-12 animate-bounce"><Trophy size={48} fill="currentColor" /></div>
                    <h1 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter uppercase leading-none">{winnerName}</h1>
                    <p className="text-2xl font-black text-brand-500 uppercase tracking-[0.5em] mt-4">VENCEDOR DA SÉRIE MD{format}</p>
                </div>
            </div>

            <div className="bg-gray-900 border-2 border-brand-500/50 rounded-[3rem] p-12 w-full max-w-2xl shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform"><Crown size={120} /></div>
                <div className="flex items-center justify-around gap-12 relative z-10">
                    <div className="text-center space-y-4">
                        <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Placar Final da Série</p>
                        <div className="text-9xl font-black italic tracking-tighter flex items-center gap-8">
                            <span className={seriesScore.A > seriesScore.B ? 'text-brand-500' : 'text-gray-700'}>{seriesScore.A}</span>
                            <span className="text-gray-800 text-5xl">X</span>
                            <span className={seriesScore.B > seriesScore.A ? 'text-brand-500' : 'text-gray-700'}>{seriesScore.B}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                <button onClick={() => downloadDivAsImage('summary-capture', 'vencedor-serie')} className="px-10 py-5 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl font-black uppercase text-xs italic transition-all flex items-center gap-3 shadow-xl border border-white/5"><Download size={20} /> Salvar Resumo</button>
                <button onClick={() => setView('home')} className="px-16 py-5 bg-brand-500 hover:bg-brand-600 text-black rounded-2xl font-black uppercase text-xs italic transition-all shadow-xl hover:scale-105 active:scale-95">Início</button>
            </div>
        </div>
    );
  }

  if (view === 'tournament_setup') {
    return (
        <div className="max-w-6xl mx-auto py-10 px-4 animate-fade-in space-y-12">
            <button onClick={() => setView('home')} className="flex items-center gap-2 text-gray-500 hover:text-white font-bold uppercase text-xs italic transition-colors"><ChevronLeft size={16} /> Voltar</button>
            <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-10 flex flex-col md:flex-row gap-10 items-end shadow-2xl">
                <div className="flex-1 space-y-4 w-full"><label className="text-xs font-black text-gray-500 uppercase italic tracking-widest">Nome do Campeonato</label><input type="text" placeholder="EX: COPA FUMAÇA PREMIUM" className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-5 text-xl font-black text-white focus:border-brand-500 outline-none italic transition-all" value={tournament.name} onChange={e => setTournament(prev => ({...prev, name: e.target.value}))}/></div>
                <div className="w-full md:w-64 space-y-4"><label className="text-xs font-black text-gray-500 uppercase italic tracking-widest">Senha Mestra</label><input type="password" placeholder="••••••" className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-5 font-bold text-white focus:border-brand-500 outline-none" value={tournament.adminPassword} onChange={e => setTournament(prev => ({...prev, adminPassword: e.target.value}))}/></div>
            </div>
            
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-900 p-8 rounded-[2rem] border border-gray-800 space-y-6 shadow-xl"><h3 className="text-brand-500 font-bold uppercase text-xs tracking-widest flex items-center gap-2"><Zap size={14}/> Modo de Seleção</h3><div className="flex gap-3">{['snake', 'linear'].map(m => <button key={m} onClick={() => setTournament(prev => ({...prev, draftMode: m as any}))} className={`flex-1 py-4 rounded-xl font-black border-2 transition-all uppercase italic text-xs ${tournament.draftMode === m ? 'bg-brand-500 text-black border-brand-500 shadow-lg scale-105' : 'bg-gray-800 text-gray-500 border-gray-700 hover:border-gray-600'}`}>{m}</button>)}</div></div>
                <div className="bg-gray-900 p-8 rounded-[2rem] border border-gray-800 space-y-6 shadow-xl"><h3 className="text-brand-500 font-bold uppercase text-xs tracking-widest flex items-center gap-2"><MonitorPlay size={14}/> Formato das Séries</h3><div className="grid grid-cols-3 gap-3">{[1, 3, 5].map(f => <button key={f} onClick={() => setTournament(prev => ({...prev, seriesFormat: f}))} className={`py-4 rounded-xl font-black border-2 transition-all italic text-xs ${tournament.seriesFormat === f ? 'bg-brand-500 text-black border-brand-500 shadow-lg scale-105' : 'bg-gray-800 text-gray-500 border-gray-700 hover:border-gray-600'}`}>MD{f}</button>)}<div className="bg-black/40 border border-brand-500/30 text-brand-500 text-[10px] font-black rounded-xl p-2 text-center flex items-center justify-center uppercase italic">Final é MD3 por padrão</div></div></div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-gray-900 border border-gray-800 rounded-[2rem] p-10 space-y-8 shadow-xl"><h3 className="text-xl font-black uppercase text-white flex items-center gap-3 italic"><UserPlus className="text-brand-500" /> Registrar Equipe</h3><input type="text" placeholder="NOME DA GUILDA" className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 font-black text-white outline-none focus:border-brand-500 italic" value={newTeam.name} onChange={e => setNewTeam(prev => ({...prev, name: e.target.value}))}/><div className="grid grid-cols-2 gap-4">{newTeam.players.map((p, i) => (<input key={i} type="text" placeholder={`PLAYER ${i+1}`} className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs font-bold text-gray-300 outline-none focus:border-brand-500" value={p} onChange={e => { const pCopy = [...newTeam.players]; pCopy[i] = e.target.value; setNewTeam(prev => ({...prev, players: pCopy})); }}/>))}</div><button onClick={handleAddTeam} className="w-full bg-gray-800 hover:bg-brand-500 hover:text-black text-white font-black py-5 rounded-2xl transition-all uppercase text-sm italic tracking-widest shadow-lg">Confirmar Inscrição</button></div>
                <div className="bg-gray-950 border border-gray-800 rounded-[2rem] p-6 overflow-y-auto max-h-[550px] custom-scrollbar shadow-inner">{tournament.teams.map((t, idx) => (<div key={t.id} className="flex items-center justify-between p-5 bg-gray-900 border border-gray-800 rounded-2xl mb-3 group hover:border-brand-500 transition-all"><div className="flex items-center gap-4"><span className="text-xs font-black text-gray-600 italic tracking-widest">RANK {idx + 1}</span><p className="font-black text-white uppercase italic text-lg tracking-tighter">{t.name}</p></div><button onClick={() => setTournament(prev => ({...prev, teams: prev.teams.filter(team => team.id !== t.id)}))} className="text-gray-600 hover:text-red-500 transition-all p-2 rounded-lg hover:bg-red-500/10"><X size={24} /></button></div>))}</div>
            </section>

            <div className="flex justify-center pt-10"><button onClick={() => { 
                if(tournament.teams.length < 2) return alert("Adicione pelo menos 2 times.");
                const shuffled = [...tournament.teams].sort(() => Math.random() - 0.5);
                const totalRounds = Math.ceil(Math.log2(shuffled.length));
                const matches: TournamentMatch[] = [];
                for (let r = 1; r <= totalRounds; r++) {
                    const matchesInRound = Math.pow(2, totalRounds - r);
                    for (let m = 0; m < matchesInRound; m++) { 
                        matches.push({ 
                            id: `M${r}-${m}`, round: r, teamAId: null, teamBId: null, scoreA: 0, scoreB: 0, winnerId: null, status: 'scheduled',
                            isFinal: (r === totalRounds)
                        }); 
                    }
                }
                for (let i = 0; i < shuffled.length; i += 2) {
                    const idx = matches.findIndex(m => m.id === `M1-${i/2}`);
                    if (idx !== -1) { 
                        matches[idx].teamAId = shuffled[i].id; 
                        if (shuffled[i+1]) matches[idx].teamBId = shuffled[i+1].id;
                        else {
                            matches[idx].winnerId = shuffled[i].id;
                            matches[idx].status = 'finished';
                            matches[idx].scoreA = 1;
                        }
                    }
                }
                setTournament(prev => ({ ...prev, matches })); setIsAdmin(true); setView('tournament_hub'); 
            }} className="bg-brand-500 text-black px-16 py-6 rounded-[2.5rem] font-black text-2xl shadow-[0_20px_50px_rgba(234,179,8,0.3)] uppercase italic flex items-center gap-4 hover:scale-105 active:scale-95 transition-all"><Trophy size={32} /> Gerar Chaves & Sorteio</button></div>
        </div>
    );
  }

  if (view === 'tournament_hub') {
    const totalRounds = Math.ceil(Math.log2(tournament.teams.length));
    return (
        <div className="max-w-full mx-auto py-8 px-4 animate-fade-in flex flex-col h-screen overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 bg-gray-900 p-8 rounded-[2.5rem] border border-gray-800 shrink-0 shadow-2xl">
                <div className="text-left">
                    <h1 className="text-4xl font-black uppercase text-white italic tracking-tighter leading-none">{tournament.name}</h1>
                    <p className="text-brand-500 font-bold text-xs uppercase tracking-[0.3em] mt-3 flex items-center gap-2"><Target size={12}/> COMPETIÇÃO ATIVA • SÉRIES MD{tournament.seriesFormat}</p>
                </div>
                <div className="flex gap-2 bg-gray-950 p-2 rounded-2xl border border-gray-800 shadow-inner">
                    <button onClick={() => setHubTab('bracket')} className={`px-8 py-3 rounded-xl font-black text-xs uppercase transition-all italic ${hubTab === 'bracket' ? 'bg-brand-500 text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>Chaves</button>
                    <button onClick={() => setHubTab('standings')} className={`px-8 py-3 rounded-xl font-black text-xs uppercase transition-all italic ${hubTab === 'standings' ? 'bg-brand-500 text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>Tabela</button>
                    <button onClick={() => setHubTab('mvp')} className={`px-8 py-3 rounded-xl font-black text-xs uppercase transition-all italic ${hubTab === 'mvp' ? 'bg-brand-500 text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>MVP</button>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={endTournament} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase italic tracking-widest border border-red-500/20 transition-all shadow-lg">Encerrar Torneio</button>
                    <button onClick={() => setView('home')} className="p-3 hover:bg-gray-800 rounded-full text-gray-500 transition-all active:scale-90"><X size={28}/></button>
                </div>
            </div>
            
            <div className="flex-1 bg-gray-900/50 border border-gray-800 rounded-[3rem] p-10 overflow-auto custom-scrollbar shadow-inner relative">
                {hubTab === 'bracket' && (
                    <div id="bracket-capture" className="min-w-[1200px] min-h-full flex gap-16 justify-center py-10">
                        {Array.from({ length: totalRounds }).map((_, rIdx) => {
                            const rNum = rIdx + 1;
                            return (
                                <div key={rNum} className="flex flex-col gap-10">
                                    <h3 className="text-center font-black text-brand-500 uppercase text-[10px] mb-6 border-b border-brand-500/20 pb-4 italic tracking-[0.4em]">{rNum === totalRounds ? 'GRANDE FINAL' : `ROUND ${rNum}`}</h3>
                                    <div className="flex flex-col justify-around gap-20 h-full">
                                        {tournament.matches.filter(m => m.round === rNum).map(m => (
                                            <div key={m.id} onClick={() => startTournamentMatch(m.id)} className={`relative group bg-gray-900 border-2 rounded-3xl w-72 p-5 transition-all cursor-pointer shadow-2xl ${m.status === 'finished' ? 'border-gray-800 opacity-60 hover:opacity-100' : 'border-gray-800 hover:border-brand-500 hover:scale-105'}`}>
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest italic">{m.isFinal ? '🏆 FINAL MD3' : `JOGO MD${tournament.seriesFormat}`}</span>
                                                    {m.status === 'finished' && <CheckCircle size={14} className="text-green-500"/>}
                                                </div>
                                                <div className="space-y-2">
                                                    <div className={`flex justify-between items-center p-3 rounded-xl border ${m.winnerId === m.teamAId && m.winnerId ? 'bg-brand-500/10 border-brand-500 text-brand-500 shadow-[0_0_10px_#eab30822]' : 'bg-black/40 border-white/5 text-gray-400'}`}><span className="text-xs font-black truncate uppercase italic">{tournament.teams.find(t => t.id === m.teamAId)?.name || 'AGUARDANDO'}</span><span className="font-black text-sm">{m.scoreA}</span></div>
                                                    <div className={`flex justify-between items-center p-3 rounded-xl border ${m.winnerId === m.teamBId && m.winnerId ? 'bg-brand-500/10 border-brand-500 text-brand-500 shadow-[0_0_10px_#eab30822]' : 'bg-black/40 border-white/5 text-gray-400'}`}><span className="text-xs font-black truncate uppercase italic">{tournament.teams.find(t => t.id === m.teamBId)?.name || 'AGUARDANDO'}</span><span className="font-black text-sm">{m.scoreB}</span></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {hubTab === 'standings' && (
                    <div className="overflow-hidden rounded-[2.5rem] border border-gray-800 shadow-2xl bg-gray-950/30">
                        <table className="w-full text-left">
                            <thead className="bg-gray-900/80 text-gray-500 text-[10px] font-black uppercase sticky top-0 backdrop-blur-md">
                                <tr><th className="p-6 italic">#</th><th className="p-6">Equipe</th><th className="p-6 text-center">Partidas</th><th className="p-6 text-center text-green-500">VIT</th><th className="p-6 text-center text-red-500">DER</th><th className="p-6 text-center text-brand-500">RG</th><th className="p-6 text-center">Saldo</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {[...tournament.teams].sort((a,b) => b.stats.wins - a.stats.wins || b.stats.roundsWon - a.stats.roundsWon).map((t, idx) => (
                                    <tr key={t.id} className="hover:bg-brand-500/5 transition-colors group">
                                        <td className="p-6 font-black text-gray-600 italic group-hover:text-brand-500 transition-colors">#{idx + 1}</td>
                                        <td className="p-6 font-black text-white uppercase italic text-lg tracking-tighter">{t.name}</td>
                                        <td className="p-6 text-center font-bold text-gray-500">{t.stats.matchesPlayed}</td>
                                        <td className="p-6 text-center font-black text-green-500">{t.stats.wins}</td>
                                        <td className="p-6 text-center font-black text-red-500">{t.stats.losses}</td>
                                        <td className="p-6 text-center font-black text-brand-500 text-xl">{t.stats.roundsWon}</td>
                                        <td className="p-6 text-center font-black text-white">{t.stats.roundsWon - t.stats.roundsLost}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {hubTab === 'mvp' && (
                    <div className="overflow-hidden rounded-[2.5rem] border border-gray-800 shadow-2xl bg-gray-950/30">
                        <table className="w-full text-left">
                            <thead className="bg-gray-900/80 text-gray-500 text-[10px] font-black uppercase sticky top-0 backdrop-blur-md">
                                <tr><th className="p-6">Rank</th><th className="p-6">Player</th><th className="p-6">Time</th><th className="p-6 text-center">Abates</th><th className="p-6 text-center">K/D Médio</th><th className="p-6 text-center">Dano Total</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {tournament.teams.flatMap(t => t.players.map(p => ({ ...p, tName: t.name }))).sort((a,b) => b.stats.totalKills - a.stats.totalKills).map((p, idx) => (
                                    <tr key={p.id} className="hover:bg-brand-500/5 transition-colors group">
                                        <td className="p-6">{idx === 0 ? <Crown className="text-yellow-500" size={24} fill="currentColor"/> : <span className="font-black text-gray-600">#{idx + 1}</span>}</td>
                                        <td className="p-6 font-black text-white uppercase italic text-lg tracking-tighter group-hover:text-brand-500 transition-colors">{p.name}</td>
                                        <td className="p-6"><span className="text-[9px] font-black text-gray-400 uppercase bg-gray-800/50 px-3 py-1.5 rounded-lg border border-white/5">{p.tName}</span></td>
                                        <td className="p-6 text-center font-black text-white text-xl">{p.stats.totalKills}</td>
                                        <td className="p-6 text-center font-black text-brand-500">{(p.stats.totalKills / (p.stats.matchesPlayed || 1)).toFixed(2)}</td>
                                        <td className="p-6 text-center font-mono text-xs text-gray-500 tabular-nums">{p.stats.totalDamage}</td>
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
