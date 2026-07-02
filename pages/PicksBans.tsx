
import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Map as MapIcon, Shield, Users, 
  ChevronRight, Play, RefreshCw, LayoutGrid, 
  CheckCircle, History, Download, X, Sword, MonitorPlay, ChevronLeft, Save,
  RotateCcw, GripVertical, CheckSquare, Settings, Crown, AlertTriangle, ArrowRight, Clock, Pause,
  Search, Zap, Lock, Edit2, CornerDownRight, Timer, HelpCircle, UserPlus, Grid, GitMerge, Upload, List, BarChart2, Target, Heart, Crosshair, Plus, Eye, Unlock, User, Medal, Undo2, Redo2, Home, Minus,
  Activity, TrendingUp, MoreVertical, FastForward, ImageIcon, Key, Hand
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
  { name: 'MORSE', img: 'https://i.ibb.co/vxyycXym/morse.png', type: 'Active' },
  { name: 'RAY', img: 'https://i.ibb.co/M55pwhqr/image.png', type: 'Active' },
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
type TournamentFormat = 'single' | 'double';
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
    bracketType: 'winner' | 'loser' | 'grand-final';
}

interface TournamentState {
    name: string;
    format: TournamentFormat;
    draftMode: DraftMode;
    seriesFormat: number; 
    teamsLimit: number; // New field
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
          name: '', format: 'single', draftMode: 'snake', seriesFormat: 1, teamsLimit: 8, adminPassword: '', teams: [], matches: [], activeMatchId: null
      };
  });
  const [newTeam, setNewTeam] = useState({ name: '', logo: '', players: Array(6).fill('') });
  const [vetoState, setVetoState] = useState<{ turn: 'A' | 'B', bans: string[] }>({ turn: 'A', bans: [] });

  // Modals
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [adminInputPassword, setAdminInputPassword] = useState('');
  
  const [matchResult, setMatchResult] = useState({ winner: 'A' as Winner, scoreA: 0, scoreB: 0, isWO: false });
  const [tempPlayerStats, setTempPlayerStats] = useState<Record<string, { kills: number, damage: number }>>({});
  
  // Manual Edit Modal
  const [manualEditMatch, setManualEditMatch] = useState<{ id: string, slot: 'A' | 'B' | 'result' } | null>(null);

  // --- BROADCAST LAYOUT CUSTOMIZATION ---
  const [broadcastLogoA, setBroadcastLogoA] = useState('');
  const [broadcastLogoB, setBroadcastLogoB] = useState('');
  const [broadcastVideoUrl, setBroadcastVideoUrl] = useState('https://www.youtube.com/embed/S2pEAsC_hDk');
  const [broadcastActiveTab, setBroadcastActiveTab] = useState<'selection' | 'camera'>('selection');
  const [broadcastShowSettings, setBroadcastShowSettings] = useState(false);
  const [broadcastSearchQuery, setBroadcastSearchQuery] = useState('');
  const [hoveredChar, setHoveredChar] = useState<string | null>(null);
  const [customPlayersA, setCustomPlayersA] = useState<string[]>(['PLAYER 1', 'PLAYER 2', 'PLAYER 3', 'PLAYER 4']);
  const [customPlayersB, setCustomPlayersB] = useState<string[]>(['PLAYER 1', 'PLAYER 2', 'PLAYER 3', 'PLAYER 4']);

  // --- PERSISTENCE ---
  useEffect(() => {
      localStorage.setItem('pb_tournament_v3', JSON.stringify(tournament));
  }, [tournament]);

  // --- LOGIC ---

  const order = ORDERS[mode];
  const isComplete = stepIndex >= order.length;
  const currentStep = !isComplete ? order[stepIndex] : null;
  const winsNeeded = Math.ceil(format / 2);

  // EFFECT: Countdown & Auto-selection
  useEffect(() => {
    if (view === 'draft' && !isComplete) {
      if (timer > 0) {
        const interval = setInterval(() => setTimer(t => t - 1), 1000);
        return () => clearInterval(interval);
      } else {
        // TIMER HIT ZERO: Auto Pick/Ban
        const available = CHARACTERS_DB.find(c => 
          !picksA.includes(c.name) && 
          !picksB.includes(c.name) && 
          bans.A !== c.name && 
          bans.B !== c.name
        );
        if (available) {
          handlePick(available.name);
        }
      }
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

  const endTournament = () => {
      if (window.confirm("⚠️ ENCERRAR TUDO?\n\nEsta ação é irreversível e apagará permanentemente todos os resultados, chaves de campeonato e placares de série.")) {
          localStorage.removeItem('pb_tournament_v3');
          setTournament({ 
              name: '', format: 'single', draftMode: 'snake', seriesFormat: 1, teamsLimit: 8,
              adminPassword: '', teams: [], matches: [], activeMatchId: null 
          });
          setNewTeam({ name: '', logo: '', players: Array(6).fill('') });
          setSeriesScore({ A: 0, B: 0 });
          setCurrentMatchIdx(0);
          setMaps([]);
          resetDraftState();
          setIsAdmin(false); 
          setView('home');
      }
  };

  const handleAddTeam = () => {
      if (!newTeam.name) return;
      if (tournament.teams.length >= (tournament.teamsLimit || 8)) {
          alert("Limite de equipes para este torneio atingido!");
          return;
      }
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
      // Ensure we are in Quick Match Mode by nullifying activeMatchId
      setTournament(prev => ({ ...prev, activeMatchId: null }));
      resetDraftState();
      setView('draft');
  };

  const drawMaps = () => {
      // Ensure independence: Quick match doesn't have activeMatchId
      setTournament(prev => ({ ...prev, activeMatchId: null }));
      const pool = [...MAPS_DB]; const selected: string[] = [];
      const numMaps = format === 1 ? 1 : format;
      for(let i=0; i<numMaps; i++) {
          if (pool.length === 0) break;
          const rand = Math.floor(Math.random() * pool.length);
          selected.push(pool[rand].name); pool.splice(rand, 1);
      }
      setMaps(selected); 
      setSeriesScore({ A: 0, B: 0 });
      setCurrentMatchIdx(0);
      setView('maps');
  };

  const handlePick = (char: string) => {
    if (isComplete) return;
    const isUsed = picksA.includes(char) || picksB.includes(char) || bans.A === char || bans.B === char;
    if (isUsed) return;
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
        return;
    }

    // Check if it's QUICK MATCH or TOURNAMENT
    if (!tournament.activeMatchId) {
        // Flow for QUICK MATCH
        setSeriesScore({ A: newScoreA, B: newScoreB });
        setView('series_summary');
        setShowStatsModal(false);
        return;
    }

    // Flow for TOURNAMENT
    const matchId = tournament.activeMatchId;
    const winnerId = isWinnerA ? teamAId : teamBId;
    const loserId = isWinnerA ? teamBId : teamAId;

    setTournament(prev => {
        const updatedMatches = prev.matches.map(m => m.id === matchId ? { 
            ...m, status: matchResult.isWO ? 'wo' as const : 'finished' as const, winnerId: winnerId || null, 
            scoreA: newScoreA, scoreB: newScoreB, map: maps.slice(0, currentMatchIdx + 1).join(', ')
        } : m);

        // Logic for advancing in bracket (winner/loser)
        let finalMatches = [...updatedMatches];
        const match = updatedMatches.find(m => m.id === matchId);
        if (match) {
             const parts = matchId.split('-');
             const currentRound = parseInt(parts[0].replace(/^(W|L|G)/, ''), 10);
             const currentPos = parseInt(parts[1], 10);
             const totalRounds = Math.ceil(Math.log2(prev.teamsLimit || prev.teams.length));

             // Single Elim Logic
             if (prev.format === 'single') {
                const nextMatchId = `W${currentRound + 1}-${Math.floor(currentPos / 2)}`;
                const nextIdx = finalMatches.findIndex(m => m.id === nextMatchId);
                if (nextIdx !== -1) {
                    const isTeamASlot = currentPos % 2 === 0;
                    finalMatches[nextIdx] = { ...finalMatches[nextIdx], [isTeamASlot ? 'teamAId' : 'teamBId']: winnerId };
                }
             } else {
                 // DOUBLE ELIM LOGIC
                 if (match.bracketType === 'winner') {
                     // Winner goes to next winner round
                     const nextMatchId = `W${currentRound + 1}-${Math.floor(currentPos / 2)}`;
                     const nextIdx = finalMatches.findIndex(m => m.id === nextMatchId);
                     if (nextIdx !== -1) {
                         const isTeamASlot = currentPos % 2 === 0;
                         finalMatches[nextIdx] = { ...finalMatches[nextIdx], [isTeamASlot ? 'teamAId' : 'teamBId']: winnerId };
                     } else if (match.isFinal || currentRound === totalRounds) {
                         const gfIdx = finalMatches.findIndex(m => m.bracketType === 'grand-final');
                         if (gfIdx !== -1) finalMatches[gfIdx].teamAId = winnerId;
                     }
                     // Loser goes to Loser Bracket
                     const loserMatchId = `L${currentRound}-${Math.floor(currentPos / 2)}`;
                     const loserIdx = finalMatches.findIndex(m => m.id === loserMatchId);
                     if (loserIdx !== -1) {
                        const isTeamASlot = currentPos % 2 === 0;
                        finalMatches[loserIdx] = { ...finalMatches[loserIdx], [isTeamASlot ? 'teamAId' : 'teamBId']: loserId };
                     }
                 } else if (match.bracketType === 'loser') {
                     // Winner stays in Loser, moves to next loser round
                     const nextMatchId = `L${currentRound + 1}-${Math.floor(currentPos / 2)}`;
                     const nextIdx = finalMatches.findIndex(m => m.id === nextMatchId);
                     if (nextIdx !== -1) {
                        const isTeamASlot = currentPos % 2 === 0;
                        finalMatches[nextIdx] = { ...finalMatches[nextIdx], [isTeamASlot ? 'teamAId' : 'teamBId']: winnerId };
                     } else if (match.isFinal) {
                        const gfIdx = finalMatches.findIndex(m => m.bracketType === 'grand-final');
                        if (gfIdx !== -1) finalMatches[gfIdx].teamBId = winnerId;
                     }
                 }
             }
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
    if (!isAdmin) { setShowAdminLoginModal(true); return; }
    const match = tournament.matches.find(m => m.id === matchId);
    if (!match || !match.teamAId || !match.teamBId) return;
    
    setTournament(prev => ({ ...prev, activeMatchId: matchId }));
    const tA = tournament.teams.find(t => t.id === match.teamAId);
    const tB = tournament.teams.find(t => t.id === match.teamBId);
    setTeamA(tA!.name); setTeamB(tB!.name);
    setTeamAId(tA!.id); setTeamBId(tB!.id);
    setFormat(match.isFinal ? 3 : tournament.seriesFormat);
    setMode(tournament.draftMode);
    setSeriesScore({ A: 0, B: 0 });
    setCurrentMatchIdx(0);
    if (match.status === 'finished') return alert("Esta partida já foi finalizada.");
    setVetoState({ turn: 'A', bans: [] });
    setView('map_veto');
  };

  const updateManualSlot = (matchId: string, slot: 'A' | 'B', teamId: string | null) => {
    setTournament(prev => ({
        ...prev,
        matches: prev.matches.map(m => m.id === matchId ? { ...m, [slot === 'A' ? 'teamAId' : 'teamBId']: teamId } : m)
    }));
  };

  const forceAdvance = (matchId: string, teamSlot: 'A' | 'B') => {
      if (!isAdmin) { setShowAdminLoginModal(true); return; }
      const match = tournament.matches.find(m => m.id === matchId);
      if (!match) return;
      const winnerId = teamSlot === 'A' ? match.teamAId : match.teamBId;
      if (!winnerId) return;
      
      setMatchResult({ winner: teamSlot, scoreA: teamSlot === 'A' ? winsNeeded : 0, scoreB: teamSlot === 'B' ? winsNeeded : 0, isWO: true });
      setTournament(prev => ({ ...prev, activeMatchId: matchId }));
      setTeamAId(match.teamAId); setTeamBId(match.teamBId);
      setTimeout(() => saveMatchResults(), 10);
  };

  const handleAdminLogin = () => {
      if (adminInputPassword === tournament.adminPassword) {
          setIsAdmin(true);
          setShowAdminLoginModal(false);
          setAdminInputPassword('');
      } else {
          alert("❌ Senha incorreta!");
      }
  };

  // --- VIEWS ---

  if (view === 'home') {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-12 animate-fade-in px-4">
            <div className="text-center space-y-4">
                <h1 className="text-6xl md:text-8xl font-display font-bold text-white uppercase tracking-tighter italic">
                    Picks <span className="text-loud-500">&</span> Bans
                </h1>
                <p className="text-premium-muted text-lg uppercase tracking-[0.4em] font-black opacity-60">Plataforma Analítica Profissional</p>
            </div>
            
            {tournament.matches.length > 0 ? (
                <div className="bg-graphite-800 border-2 border-loud-500/30 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between shadow-2xl w-full max-w-4xl gap-8">
                    <div className="flex items-center gap-6 text-left">
                        <div className="p-4 bg-loud-500 rounded-2xl text-black shadow-[0_0_20px_rgba(58,255,0,0.4)]"><Trophy size={28} /></div>
                        <div>
                            <h3 className="text-2xl font-display font-bold text-white uppercase italic leading-none tracking-tight">{tournament.name}</h3>
                            <p className="text-xs text-loud-500 font-black uppercase mt-2 tracking-widest">Campeonato Ativo</p>
                        </div>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <button onClick={() => setView('tournament_hub')} className="btn-loud flex-1 md:flex-none px-10">Continuar</button>
                        <button onClick={endTournament} className="flex-1 md:flex-none bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white px-10 py-4 rounded-2xl font-black uppercase text-xs italic transition-all border border-red-500/20">Encerrar</button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                    <button onClick={() => { setSeriesScore({A:0, B:0}); setView('mode'); }} className="bg-graphite-800 border border-white/5 rounded-[2.5rem] p-10 hover:border-loud-500/50 transition-all text-left group shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform"><Sword size={120} className="text-loud-500" /></div>
                        <div className="p-4 bg-graphite-900 rounded-2xl mb-6 text-loud-500 group-hover:scale-110 transition-transform inline-block shadow-lg"><Sword size={32} /></div>
                        <h2 className="text-3xl font-display font-bold text-white mb-2 uppercase italic tracking-tighter">Partida Rápida</h2>
                        <p className="text-sm text-premium-muted uppercase tracking-widest font-bold opacity-60">Draft avulso MD1, MD3 ou MD5.</p>
                    </button>
                    <button onClick={() => setView('tournament_setup')} className="bg-graphite-800 border border-white/5 rounded-[2.5rem] p-10 hover:border-loud-500/50 transition-all text-left group shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform"><Trophy size={120} className="text-loud-500" /></div>
                        <div className="p-4 bg-graphite-900 rounded-2xl mb-6 text-loud-500 group-hover:scale-110 transition-transform inline-block shadow-lg"><Trophy size={32} /></div>
                        <h2 className="text-3xl font-display font-bold text-white mb-2 uppercase italic tracking-tighter">Campeonato</h2>
                        <p className="text-sm text-premium-muted uppercase tracking-widest font-bold opacity-60">Gestão completa de chaves e ranking.</p>
                    </button>
                </div>
            )}
        </div>
    );
  }

  if (view === 'mode') {
    return (
        <div className="max-w-4xl mx-auto py-20 px-4 animate-fade-in text-center space-y-12">
            <button onClick={() => setView('home')} className="flex items-center gap-2 font-black uppercase text-xs text-premium-muted hover:text-white transition-all opacity-60 hover:opacity-100"><ChevronLeft size={16} /> Voltar</button>
            <h2 className="text-5xl font-display font-bold text-white uppercase italic tracking-tighter">Configuração da Série</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="bg-graphite-800 p-8 rounded-[2rem] border border-white/5 space-y-6 shadow-2xl">
                    <h3 className="text-loud-500 font-black uppercase text-xs tracking-[0.3em] opacity-80">Série (MD)</h3>
                    <div className="flex gap-3">
                        {[1, 3, 5].map(f => (
                            <button 
                                key={f} 
                                onClick={() => setFormat(f)} 
                                className={`flex-1 py-4 rounded-xl font-black border-2 transition-all italic ${format === f ? 'bg-loud-500 text-black border-loud-500 shadow-[0_0_20px_rgba(58,255,0,0.3)]' : 'bg-graphite-900 text-premium-muted border-white/5 hover:border-white/20'}`}
                            >
                                MD{f}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="bg-graphite-800 p-8 rounded-[2rem] border border-white/5 space-y-6 shadow-2xl">
                    <h3 className="text-loud-500 font-black uppercase text-xs tracking-[0.3em] opacity-80">Modo de Seleção</h3>
                    <div className="flex gap-3">
                        {['snake', 'linear'].map(m => (
                            <button 
                                key={m} 
                                onClick={() => setMode(m as any)} 
                                className={`flex-1 py-4 rounded-xl font-black border-2 uppercase transition-all italic ${mode === m ? 'bg-loud-500 text-black border-loud-500 shadow-[0_0_20px_rgba(58,255,0,0.3)]' : 'bg-graphite-900 text-premium-muted border-white/5 hover:border-white/20'}`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <button onClick={drawMaps} className="btn-loud px-16 py-6 text-xl">Sortear Mapas & Iniciar</button>
        </div>
    );
  }

  if (view === 'maps') {
    return (
        <div className="max-w-6xl mx-auto py-20 px-4 animate-fade-in text-center">
            <h2 className="text-5xl font-display font-bold text-white uppercase mb-12 italic tracking-tighter">Mapas Sorteados <span className="text-loud-500">(MD{format})</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                {maps.map((m, i) => (
                    <div key={m} className="relative aspect-video rounded-[2rem] overflow-hidden border-2 border-white/5 shadow-2xl group transition-all hover:border-loud-500/50">
                        <img src={MAPS_DB.find(map => map.name === m)?.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-center justify-center">
                            <span className="text-3xl font-display font-bold uppercase text-white drop-shadow-2xl italic tracking-tight">{m}</span>
                        </div>
                        <div className="absolute top-4 left-4 bg-loud-500 text-black px-4 py-1.5 rounded-xl text-[10px] font-black italic shadow-lg">JOGO {i+1}</div>
                    </div>
                ))}
            </div>
            <div className="flex justify-center gap-6">
                <button onClick={() => setView('mode')} className="p-5 bg-graphite-800 rounded-2xl text-premium-muted hover:text-white hover:bg-graphite-700 transition-all shadow-xl border border-white/5"><ChevronLeft size={28}/></button>
                <button onClick={drawMaps} className="p-5 bg-graphite-800 rounded-2xl text-premium-muted hover:text-white hover:bg-graphite-700 transition-all shadow-xl border border-white/5"><RefreshCw size={28}/></button>
                <button onClick={startQuickMatchDraft} className="px-12 py-5 bg-green-600 hover:bg-green-500 text-white font-black uppercase italic shadow-[0_0_30px_rgba(22,163,74,0.3)] rounded-2xl transition-all tracking-widest">Iniciar Picks & Bans</button>
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
          if (mapsLeft > mapsNeeded + 1) setVetoState({ turn: vetoState.turn === 'A' ? 'B' : 'A', bans: newBans });
          else {
              const remaining = MAPS_DB.filter(m => !newBans.includes(m.name)).map(m => m.name);
              setMaps(remaining.slice(0, format));
              resetDraftState();
              setView('draft');
          }
      };
      return (
          <div className="flex flex-col h-screen bg-graphite-900 text-white animate-fade-in overflow-hidden">
              <div className="h-20 bg-graphite-800 border-b border-white/5 flex items-center justify-between px-8 shrink-0 shadow-2xl">
                  <div className="flex items-center gap-4">
                      <button onClick={() => tournament.activeMatchId ? setView('tournament_hub') : setView('home')} className="flex items-center gap-3 p-3 hover:bg-graphite-900 rounded-xl text-premium-muted hover:text-white transition-all border border-white/5"><ChevronLeft size={20}/><span className="text-[10px] font-black uppercase italic tracking-widest">Voltar</span></button>
                  </div>
                  <div className="bg-graphite-900 px-8 py-2.5 rounded-full border border-white/5 flex items-center gap-10 shadow-inner">
                      <div className="flex items-center gap-4">
                          <div className="w-3 h-3 rounded-full bg-teamA shadow-[0_0_12px_#3b82f6]"></div>
                          <span className="text-lg font-display font-bold uppercase italic tracking-tight">{teamA}</span>
                      </div>
                      <div className="text-xs font-black text-premium-muted italic tracking-widest opacity-40">VS</div>
                      <div className="flex items-center gap-4">
                          <span className="text-lg font-display font-bold uppercase italic tracking-tight">{teamB}</span>
                          <div className="w-3 h-3 rounded-full bg-teamB shadow-[0_0_12px_#f97316]"></div>
                      </div>
                  </div>
                  <div className="w-40"></div> 
              </div>
              <div className="flex-1 overflow-y-auto p-12 text-center custom-scrollbar">
                  <h2 className="text-5xl font-display font-bold text-white mb-4 uppercase italic tracking-tighter">Veto de Mapas</h2>
                  <p className={`text-2xl font-display font-bold uppercase mb-12 italic tracking-tight ${vetoState.turn === 'A' ? 'text-teamA' : 'text-teamB'}`}>
                      Vez de <span className="underline underline-offset-8 decoration-4">{currentVetoTeam}</span> BANIR um mapa
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
                      {MAPS_DB.map(map => {
                          const isBanned = vetoState.bans.includes(map.name);
                          return (
                              <button 
                                key={map.name} 
                                disabled={isBanned} 
                                onClick={() => handleVeto(map.name)} 
                                className={`relative aspect-video rounded-[2rem] overflow-hidden border-4 transition-all ${isBanned ? 'border-red-600/50 grayscale opacity-40 scale-95' : 'border-white/5 hover:border-loud-500 hover:scale-105 shadow-2xl'}`}
                              >
                                  <img src={map.img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-center justify-center">
                                      <span className="text-2xl font-display font-bold uppercase text-white drop-shadow-2xl italic tracking-tight">{map.name}</span>
                                  </div>
                                  {isBanned && (
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                                          <X size={80} className="text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]" strokeWidth={4} />
                                      </div>
                                  )}
                              </button>
                          );
                      })}
                  </div>
              </div>
          </div>
      );
  }

  if (view === 'draft') {
      const getPlayerName = (team: 'A' | 'B', index: number) => {
          const prefix = team === 'A' 
              ? (teamA.substring(0, 4).toUpperCase() + ".") 
              : (teamB.substring(0, 4).toUpperCase() + ".");
          
          if (team === 'A' && customPlayersA[index]) {
              return prefix + customPlayersA[index].toUpperCase();
          }
          if (team === 'B' && customPlayersB[index]) {
              return prefix + customPlayersB[index].toUpperCase();
          }

          const teamId = team === 'A' ? teamAId : teamBId;
          const t = tournament.teams.find(item => item.id === teamId);
          if (t && t.players[index] && t.players[index].name) {
              return prefix + t.players[index].name.toUpperCase();
          }
          const fallback = "PLAYER " + (index + 1);
          return prefix + fallback;
      };

      const renderSlotDetails = (team: 'A' | 'B', index: number) => {
          const isLocked = team === 'A' ? picksA.length > index : picksB.length > index;
          const charName = team === 'A' ? picksA[index] : picksB[index];
          const char = charName ? CHARACTERS_DB.find(c => c.name === charName) : null;
          
          const isActive = !isComplete && currentStep.type === 'pick' && currentStep.team === team && (team === 'A' ? picksA.length === index : picksB.length === index);
          
          // Use hover preview if active
          const isHoveredPreview = isActive && hoveredChar;
          const previewChar = isHoveredPreview ? CHARACTERS_DB.find(c => c.name === hoveredChar) : null;
          
          const displayChar = char || previewChar;

          return (
              <div 
                  key={`pick-${team}-${index}`}
                  className={`relative w-full h-[72px] md:h-[78px] rounded-xl overflow-hidden flex items-center transition-all duration-300 shadow-md ${
                      isActive 
                          ? (team === 'A' 
                              ? 'bg-gradient-to-r from-[#00FF00]/25 via-[#090b09] to-[#040504] border-2 border-[#00FF00] shadow-[0_0_20px_rgba(0,255,0,0.5)] scale-102 z-10' 
                              : 'bg-gradient-to-l from-[#C11B1B]/25 via-[#1a0a0a] to-[#0a0505] border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-102 z-10')
                          : isLocked
                              ? (team === 'A' 
                                  ? 'border border-[#00FF00]/30 bg-gradient-to-r from-[#0d120d] to-[#050507]' 
                                  : 'border border-red-500/30 bg-gradient-to-l from-[#210909] to-[#070404]')
                              : 'border border-white/5 bg-[#0c0c10]/70 opacity-50'
                  }`}
              >
                  {/* Background pattern */}
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>

                  {/* Character portrait (Clean unskewed profile display for perfect face framing) */}
                  {displayChar && (
                      <div className={`absolute top-0 bottom-0 w-20 h-full overflow-hidden ${team === 'A' ? 'left-0 border-r-2 border-[#00FF00]/40' : 'right-0 border-l-2 border-red-500/40'}`}>
                          <img 
                              src={displayChar.img} 
                              className={`w-full h-full object-cover object-top scale-110 ${isHoveredPreview ? 'opacity-40 animate-pulse' : ''}`} 
                              referrerPolicy="no-referrer" 
                          />
                      </div>
                  )}

                  {/* Content (Blue Team Layout - Character on left, name in middle, status on right) */}
                  {team === 'A' ? (
                      <div className="flex-1 flex items-center justify-between pl-[92px] pr-4 h-full relative z-10">
                          <div className="text-left flex flex-col justify-center">
                              <span className="text-[10px] font-extrabold text-[#00FF00] uppercase tracking-widest">{getPlayerName('A', index)}</span>
                              <span className="text-sm md:text-base font-display font-black tracking-tight text-white uppercase italic mt-0.5">
                                  {displayChar ? displayChar.name : "ESCOLHENDO..."}
                              </span>
                              {isHoveredPreview && (
                                  <span className="text-[8px] font-bold text-[#00FF00] animate-pulse uppercase tracking-wider">PRÉ-SELEÇÃO</span>
                              )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                              {/* Timer shown next to active slot */}
                              {isActive && (
                                  <div className="bg-[#00FF00] text-black font-black px-2 py-0.5 rounded text-[9px] uppercase tracking-widest animate-pulse">
                                      {timer}S
                                  </div>
                              )}
                              {isLocked ? (
                                  <div className="w-5 h-5 rounded-full bg-[#00FF00] flex items-center justify-center text-black text-[10px] font-black shadow-lg">✓</div>
                              ) : (
                                  <div className="w-5 h-5 rounded-full border border-white/10 bg-black/40"></div>
                              )}
                          </div>
                      </div>
                  ) : (
                      /* Red Team Layout (Mirrored) */
                      <div className="flex-1 flex items-center justify-between pr-[92px] pl-4 h-full relative z-10 flex-row-reverse">
                          <div className="text-right flex flex-col justify-center">
                              <span className="text-[10px] font-extrabold text-[#ef4444] uppercase tracking-widest">{getPlayerName('B', index)}</span>
                              <span className="text-sm md:text-base font-display font-black tracking-tight text-white uppercase italic mt-0.5">
                                  {displayChar ? displayChar.name : "ESCOLHENDO..."}
                              </span>
                              {isHoveredPreview && (
                                  <span className="text-[8px] font-bold text-yellow-400 animate-pulse uppercase tracking-wider">PRÉ-SELEÇÃO</span>
                              )}
                          </div>

                          <div className="flex items-center gap-2 flex-row-reverse">
                              {/* Timer shown next to active slot */}
                              {isActive && (
                                  <div className="bg-[#ef4444] text-white font-black px-2 py-0.5 rounded text-[9px] uppercase tracking-widest animate-pulse">
                                      {timer}S
                                  </div>
                              )}
                              {isLocked ? (
                                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-black shadow-lg">✓</div>
                              ) : (
                                  <div className="w-5 h-5 rounded-full border border-white/10 bg-black/40"></div>
                              )}
                          </div>
                      </div>
                  )}
              </div>
          );
      };

      const renderBanSlot = (team: 'A' | 'B') => {
          const charName = team === 'A' ? bans.A : bans.B;
          const char = charName ? CHARACTERS_DB.find(c => c.name === charName) : null;
          const isActive = !isComplete && currentStep.type === 'ban' && currentStep.team === team;

          return (
              <div 
                  className={`w-14 h-14 md:w-16 md:h-16 rounded-xl border-2 relative overflow-hidden flex items-center justify-center transition-all ${
                      isActive 
                          ? 'border-[#00FF00] bg-[#00FF00]/15 shadow-[0_0_15px_rgba(0,255,0,0.5)] animate-pulse' 
                          : char 
                              ? 'border-red-600/80 bg-red-950/20' 
                              : 'border-white/10 bg-black/50 border-dashed'
                  }`}
              >
                  {char ? (
                      <>
                           <img src={char.img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                           <div className="absolute inset-0 bg-red-950/80 flex items-center justify-center">
                               <div className="w-full h-1 bg-red-600 rotate-45 shadow-lg absolute"></div>
                               <span className="text-[8px] font-extrabold text-white bg-red-600 px-1 rounded uppercase tracking-wider relative z-10 scale-90">BAN</span>
                           </div>
                      </>
                  ) : (
                      <span className="text-[9px] font-bold text-premium-muted/50 uppercase tracking-widest">{isActive ? `${timer}S` : '-'}</span>
                  )}
              </div>
          );
      };

      const filteredCharacters = CHARACTERS_DB.filter(char => 
          char.name.toLowerCase().includes(broadcastSearchQuery.toLowerCase())
      );

      return (
          <div className="flex flex-col min-h-screen bg-[#060608] text-white animate-fade-in select-none">
              {/* Top Action Header bar (Provides navigation back, download action, and settings toggler) */}
              <div className="h-11 bg-[#0b0b0e] border-b border-white/5 flex items-center justify-between px-6 shrink-0 text-xs text-premium-muted relative z-30">
                  <div className="flex items-center gap-4">
                      <button 
                          onClick={() => tournament.activeMatchId ? setView('tournament_hub') : setView('maps')} 
                          className="flex items-center gap-1.5 hover:text-white transition-all font-black uppercase tracking-wider"
                      >
                          <ChevronLeft size={14}/> Voltar
                      </button>
                      <div className="h-4 w-px bg-white/10"></div>
                      <span className="font-black uppercase tracking-widest text-[#00FF00]">{maps[currentMatchIdx]}</span>
                      <span className="opacity-50">•</span>
                      <span>MD{format} • Partida {currentMatchIdx + 1}</span>
                  </div>

                  <div className="flex items-center gap-3">
                      <button 
                          onClick={() => setBroadcastShowSettings(!broadcastShowSettings)} 
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all font-black uppercase text-[10px] ${broadcastShowSettings ? 'bg-[#00FF00]/20 border-[#00FF00] text-[#00FF00] shadow-[0_0_10px_rgba(0,255,0,0.15)]' : 'border-white/10 hover:border-[#00FF00]/50 text-premium-muted hover:text-white'}`}
                      >
                          <Settings size={12}/> Configurar Transmissão
                      </button>
                      
                      {isComplete && (
                          <button 
                              onClick={() => setShowStatsModal(true)} 
                              className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(34,197,94,0.4)]"
                          >
                              ✓ Confirmar Queda
                          </button>
                      )}

                      <button 
                          onClick={() => downloadDivAsImage('draft-main-capture', 'esports-picks-bans-resumo')} 
                          className="p-1.5 hover:bg-white/5 rounded-lg transition-all text-[#00FF00]" 
                          title="Salvar Resumo da Queda"
                      >
                          <Download size={14}/>
                      </button>
                  </div>
              </div>

              {/* MAIN CAPTURE AREA (ESPORTS BROADCAST OVERLAY) */}
              <div 
                  id="draft-main-capture" 
                  className="flex-1 w-full bg-[#050507] p-4 md:p-6 flex flex-col justify-between relative overflow-hidden min-h-[580px] border-2 border-[#00FF00]/10"
                  style={{
                      backgroundImage: 'radial-gradient(circle at 50% 50%, #081008 0%, #030403 100%)'
                  }}
              >
                  {/* Decorative Esports Slanted Stripes on the backdrop */}
                  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                      <div className="absolute -left-1/4 -right-1/4 top-12 h-44 bg-[#030503]/90 -skew-y-6 opacity-95 shadow-2xl border-y border-[#00FF00]/10"></div>
                      <div className="absolute top-1/2 left-0 right-0 h-96 bg-gradient-to-r from-[#00FF00]/10 via-transparent to-red-500/10 -skew-y-12"></div>
                      <div className="absolute -right-32 top-0 w-96 h-96 bg-red-500/5 rounded-full filter blur-[100px]"></div>
                      <div className="absolute -left-32 bottom-0 w-96 h-96 bg-[#00FF00]/10 rounded-full filter blur-[100px]"></div>
                  </div>

                  {/* BROADCAST HEADER AREA */}
                  <div className="w-full flex justify-between items-center relative z-10 mb-4 px-2">
                      {/* Left Ban Slot */}
                      <div className="flex items-center gap-3">
                          {renderBanSlot('A')}
                          <div className="text-left">
                              <span className="text-[10px] font-black uppercase text-[#00FF00] block tracking-widest leading-none">TIME A BAN</span>
                              <span className="text-lg font-display font-black text-white uppercase tracking-tight">{bans.A || "PENDENTE"}</span>
                          </div>
                      </div>

                      {/* Center Angular Banner */}
                      <div className="flex flex-col items-center">
                          <div 
                              className="bg-[#050508] text-white px-12 md:px-20 py-2.5 md:py-3 relative shadow-2xl border-b-4 border-[#00FF00]"
                              style={{ clipPath: 'polygon(15px 0, calc(100% - 15px) 0, 100% 100%, 0 100%)' }}
                          >
                              <h2 className="text-lg md:text-2xl font-display font-black text-center tracking-widest uppercase italic text-[#00FF00] drop-shadow-[0_0_10px_rgba(0,255,0,0.5)]">
                                  {!isComplete ? "DRAFT PHASE" : "DRAFT PRONTO"}
                              </h2>
                              <div className="text-center text-[9px] font-black uppercase tracking-[0.2em] text-white/50 -mt-0.5">
                                  {!isComplete 
                                      ? `${currentStep.type === 'ban' ? 'BANIMENTO' : 'SELEÇÃO'} • ${currentStep.team === 'A' ? teamA : teamB}`
                                      : "PREPARE-SE PARA JOGAR"
                                  }
                              </div>
                          </div>
                          
                          {/* Main Floating Timer */}
                          {!isComplete && (
                              <div className="mt-2 bg-[#050508] border border-[#00FF00]/30 px-6 py-1 rounded-full shadow-lg flex items-center gap-2">
                                  <Clock size={12} className="text-[#00FF00] animate-pulse" />
                                  <span className="text-sm font-black text-white tabular-nums tracking-wider">{timer} SEGUNDOS</span>
                              </div>
                          )}
                      </div>

                      {/* Right Ban Slot */}
                      <div className="flex items-center gap-3 flex-row-reverse">
                          {renderBanSlot('B')}
                          <div className="text-right">
                              <span className="text-[10px] font-black uppercase text-red-500 block tracking-widest leading-none">TIME B BAN</span>
                              <span className="text-lg font-display font-black text-white uppercase tracking-tight">{bans.B || "PENDENTE"}</span>
                          </div>
                      </div>
                  </div>

                  {/* MAIN OVERLAY CONTENT ROW (LEFT TEAM, CENTER VIEWPORT, RIGHT TEAM) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center relative z-10 flex-1 my-2">
                      {/* Left Column - Blue Picks */}
                      <div className="lg:col-span-3 space-y-2 md:space-y-3 w-full">
                          {[0, 1, 2, 3].map(i => renderSlotDetails('A', i))}
                      </div>

                      {/* Center Panel (Dedicated Character Grid Panel - NO stream feed) */}
                      <div className="lg:col-span-6 h-full min-h-[450px] flex flex-col justify-between bg-[#050508] rounded-2xl md:rounded-3xl border-2 border-[#00FF00]/20 overflow-hidden shadow-[0_0_30px_rgba(0,255,0,0.05)] p-5 relative">
                          {/* Inner double border glow */}
                          <div className="absolute inset-0 border border-[#00FF00]/10 rounded-2xl pointer-events-none z-10"></div>

                          {/* Dedicated Header */}
                          <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-4 z-20">
                              <div className="flex items-center gap-2">
                                  <LayoutGrid size={14} className="text-[#00FF00]" />
                                  <span className="text-xs font-black uppercase tracking-widest text-white italic">GALERIA DE SELEÇÃO</span>
                              </div>
                              <span className="text-[9px] font-bold text-premium-muted/70 tracking-wider">CLIQUE NO PERSONAGEM PARA SELECIONAR</span>
                          </div>

                          {/* Character Search and Grid container */}
                          <div className="flex-1 flex flex-col justify-start z-20">
                              {/* Selection Search Bar */}
                              <div className="flex gap-2 bg-[#0c0c10] px-3 py-2.5 rounded-xl border border-[#00FF00]/20 mb-4 shadow-inner">
                                  <Search size={14} className="text-[#00FF00] my-auto" />
                                  <input 
                                      type="text" 
                                      placeholder="BUSCAR PERSONAGEM..." 
                                      className="bg-transparent text-[10px] font-black uppercase text-white outline-none flex-1 py-0.5 tracking-wider placeholder-premium-muted/50"
                                      value={broadcastSearchQuery}
                                      onChange={(e) => setBroadcastSearchQuery(e.target.value)}
                                  />
                                  {broadcastSearchQuery && (
                                      <button onClick={() => setBroadcastSearchQuery('')} className="text-premium-muted hover:text-white transition-all">
                                          <X size={12}/>
                                      </button>
                                  )}
                              </div>

                              {/* Characters Grid */}
                              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                                  {filteredCharacters.map(char => {
                                      const isUsed = picksA.includes(char.name) || picksB.includes(char.name) || bans.A === char.name || bans.B === char.name;
                                      return (
                                          <button 
                                              key={char.name} 
                                              disabled={isUsed || isComplete} 
                                              onClick={() => {
                                                  setHoveredChar(null);
                                                  handlePick(char.name);
                                              }} 
                                              onMouseEnter={() => !isUsed && !isComplete && setHoveredChar(char.name)}
                                              onMouseLeave={() => setHoveredChar(null)}
                                              className={`relative aspect-[3/4] rounded-xl overflow-hidden border transition-all duration-200 shadow-md ${
                                                  isUsed 
                                                      ? 'border-transparent opacity-15 grayscale cursor-not-allowed' 
                                                      : 'border-white/10 hover:border-[#00FF00] hover:scale-105 hover:shadow-[0_0_12px_rgba(0,255,0,0.3)] bg-[#0a0a0d]'
                                              }`}
                                          >
                                              <img src={char.img} className="w-full h-full object-cover object-top" referrerPolicy="no-referrer" />
                                              <div className="absolute bottom-0 inset-x-0 bg-[#040405]/95 py-1 text-[8px] font-black text-center uppercase truncate italic border-t border-white/5">{char.name}</div>
                                          </button>
                                      );
                                  })}
                              </div>
                          </div>

                          {/* Footer match indicators */}
                          <div className="mt-4 pt-2.5 border-t border-white/5 flex justify-between items-center text-[9px] font-black uppercase text-premium-muted tracking-widest z-20">
                              <span>SALA DE CONTROLE DE DRAFT</span>
                              <span className="text-[#00FF00] font-extrabold animate-pulse">● SISTEMA ATIVO</span>
                          </div>
                      </div>

                      {/* Right Column - Red Picks */}
                      <div className="lg:col-span-3 space-y-2 md:space-y-3 w-full">
                          {[0, 1, 2, 3].map(i => renderSlotDetails('B', i))}
                      </div>
                  </div>

                  {/* BOTTOM TEAM SLANTED BANNERS AND GAME DETAILS */}
                  <div className="w-full h-14 md:h-16 flex items-stretch border-t-4 border-[#030503] relative z-10 rounded-b-xl overflow-hidden shadow-2xl">
                      {/* Team A (Blue Team) Bar */}
                      <div 
                          className="bg-[#0a120a] border-l-4 border-[#00FF00] text-white flex items-center justify-between pl-6 pr-10 relative overflow-hidden flex-1 shadow-[inset_0_0_20px_rgba(0,255,0,0.15)]"
                      >
                          {/* Skew divider block on the right */}
                          <div className="absolute top-0 right-0 bottom-0 w-8 bg-[#0a120a] skew-x-12 translate-x-4 border-r-4 border-[#030503]"></div>
                          
                          <div className="flex items-center gap-3 relative z-10">
                              {broadcastLogoA && (
                                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-display font-bold text-lg border border-[#00FF00]/40 overflow-hidden shrink-0">
                                      {broadcastLogoA.length > 2 ? (
                                          <img src={broadcastLogoA} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                                      ) : (
                                          <span>{broadcastLogoA}</span>
                                      )}
                                  </div>
                              )}
                              <span className="font-display font-black text-xl md:text-2xl tracking-tighter uppercase italic text-white drop-shadow-md">
                                  {teamA}
                              </span>
                          </div>
                          
                          <div className="text-right flex flex-col justify-center relative z-10">
                              <span className="text-[10px] font-extrabold text-green-300 uppercase tracking-widest leading-none">PONTUAÇÃO</span>
                              <span className="text-2xl font-display font-black italic tracking-tighter text-[#00FF00] mt-1 drop-shadow-[0_0_8px_rgba(0,255,0,0.4)]">{seriesScore.A}</span>
                          </div>
                      </div>

                      {/* Middle Game Stage / Match details (Black Angular Block) */}
                      <div 
                          className="bg-[#050508] text-white flex flex-col items-center justify-center px-8 text-center border-x-4 border-[#00FF00]/20 shrink-0 min-w-[150px]"
                      >
                          <span className="text-xs md:text-sm font-display font-black tracking-wider text-[#00FF00] uppercase italic leading-none">
                              {maps[currentMatchIdx] || "QUEDA 1"}
                          </span>
                          <span className="text-[8px] font-extrabold text-white/60 uppercase tracking-[0.2em] mt-1">
                              QUEDA {currentMatchIdx + 1}
                          </span>
                      </div>

                      {/* Team B (Red Team) Bar */}
                      <div 
                          className="bg-[#120a0a] border-r-4 border-red-500 text-white flex items-center justify-between pr-6 pl-10 relative overflow-hidden flex-1 flex-row-reverse shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]"
                      >
                          {/* Skew divider block on the left */}
                          <div className="absolute top-0 left-0 bottom-0 w-8 bg-[#120a0a] skew-x-12 -translate-x-4 border-l-4 border-[#030503]"></div>
                          
                          <div className="flex items-center gap-3 relative z-10 flex-row-reverse">
                              {broadcastLogoB && (
                                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-display font-bold text-lg border border-red-500/40 overflow-hidden shrink-0">
                                      {broadcastLogoB.length > 2 ? (
                                          <img src={broadcastLogoB} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                                      ) : (
                                          <span>{broadcastLogoB}</span>
                                      )}
                                  </div>
                              )}
                              <span className="font-display font-black text-xl md:text-2xl tracking-tighter uppercase italic text-white drop-shadow-md">
                                  {teamB}
                              </span>
                          </div>

                          <div className="text-left flex flex-col justify-center relative z-10">
                              <span className="text-[10px] font-extrabold text-red-300 uppercase tracking-widest leading-none">PONTUAÇÃO</span>
                              <span className="text-2xl font-display font-black italic tracking-tighter text-red-500 mt-1 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]">{seriesScore.B}</span>
                          </div>
                      </div>
                  </div>
              </div>

              {/* BROADCAST TRANSMISSION CONTROL ROOM (Tab 3 Panel - Collapsible drawer at the bottom of the screen) */}
              {broadcastShowSettings && (
                  <div className="bg-[#0b0b0e] border-t border-white/5 p-6 animate-fade-in z-20">
                      <div className="max-w-4xl mx-auto space-y-6">
                          <div className="flex justify-between items-center border-b border-white/5 pb-3">
                              <div className="flex items-center gap-2">
                                  <Settings size={18} className="text-[#00FF00]"/>
                                  <h3 className="text-sm font-black uppercase text-white tracking-widest italic">SALA DE CONFIGURAÇÕES DE TRANSMISSÃO</h3>
                              </div>
                              <button 
                                  onClick={() => setBroadcastShowSettings(false)} 
                                  className="text-premium-muted hover:text-white transition-all text-xs uppercase font-bold"
                              >
                                  Fechar ✕
                              </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                              {/* Team A customizer */}
                              <div className="bg-[#0f0f13] p-4 rounded-xl border border-white/5 space-y-4 text-left">
                                  <h4 className="font-black text-[#00FF00] uppercase tracking-wider border-b border-[#00FF00]/10 pb-1.5 flex items-center gap-1.5">
                                      <span>🟢 CONFIGURAÇÕES DO TIME A</span>
                                  </h4>
                                  <div className="space-y-1.5">
                                      <label className="text-[9px] font-black text-premium-muted uppercase tracking-widest">Nome do Time A</label>
                                      <input 
                                          type="text"
                                          value={teamA}
                                          onChange={(e) => setTeamA(e.target.value)}
                                          className="w-full bg-[#16161c] border border-white/5 rounded-lg p-2 font-bold text-white outline-none focus:border-[#00FF00]/50"
                                          placeholder="Ex: LOUD"
                                      />
                                  </div>
                                  <div className="space-y-1.5">
                                      <label className="text-[9px] font-black text-premium-muted uppercase tracking-widest">Logo do Time A (Upload ou Texto/Emoji)</label>
                                      <div className="flex gap-2">
                                          <input 
                                              type="text" 
                                              value={broadcastLogoA} 
                                              onChange={(e) => setBroadcastLogoA(e.target.value)}
                                              placeholder="Cole URL, Emoji ou deixe vazio"
                                              className="flex-1 bg-[#16161c] border border-white/5 rounded-lg p-2 font-bold text-white text-xs outline-none focus:border-[#00FF00]/50"
                                          />
                                          <label className="bg-[#16161c] hover:bg-neutral-800 border border-white/10 rounded-lg px-3 flex items-center justify-center cursor-pointer font-bold text-xs hover:text-[#00FF00] transition-colors shrink-0">
                                              <span>Upload</span>
                                              <input 
                                                  type="file" 
                                                  accept="image/*" 
                                                  className="hidden" 
                                                  onChange={(e) => {
                                                      const file = e.target.files?.[0];
                                                      if (file) {
                                                          const reader = new FileReader();
                                                          reader.onload = (event) => {
                                                              if (event.target?.result) {
                                                                  setBroadcastLogoA(event.target.result as string);
                                                              }
                                                          };
                                                          reader.readAsDataURL(file);
                                                      }
                                                  }}
                                              />
                                          </label>
                                          {broadcastLogoA && (
                                              <button 
                                                  type="button"
                                                  onClick={() => setBroadcastLogoA('')} 
                                                  className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-lg px-2.5 font-bold text-xs"
                                                  title="Remover Logo"
                                              >
                                                  ✕
                                              </button>
                                          )}
                                      </div>
                                  </div>
                                  <div className="space-y-1.5">
                                      <label className="text-[9px] font-black text-premium-muted uppercase tracking-widest">Jogadores (Time A)</label>
                                      <div className="grid grid-cols-2 gap-2">
                                          {customPlayersA.map((p, idx) => (
                                              <input 
                                                  key={idx}
                                                  type="text"
                                                  value={p}
                                                  onChange={(e) => {
                                                      const next = [...customPlayersA];
                                                      next[idx] = e.target.value;
                                                      setCustomPlayersA(next);
                                                  }}
                                                  className="bg-[#16161c] border border-white/5 rounded-lg p-2 text-xs font-semibold text-white outline-none focus:border-[#00FF00]/40"
                                                  placeholder={`PLAYER ${idx + 1}`}
                                              />
                                          ))}
                                      </div>
                                  </div>
                              </div>

                              {/* Team B customizer */}
                              <div className="bg-[#0f0f13] p-4 rounded-xl border border-white/5 space-y-4 text-left">
                                  <h4 className="font-black text-red-400 uppercase tracking-wider border-b border-red-500/10 pb-1.5 flex items-center gap-1.5">
                                      <span>🔴 CONFIGURAÇÕES DO TIME B</span>
                                  </h4>
                                  <div className="space-y-1.5">
                                      <label className="text-[9px] font-black text-premium-muted uppercase tracking-widest">Nome do Time B</label>
                                      <input 
                                          type="text"
                                          value={teamB}
                                          onChange={(e) => setTeamB(e.target.value)}
                                          className="w-full bg-[#16161c] border border-white/5 rounded-lg p-2 font-bold text-white outline-none focus:border-red-500/50"
                                          placeholder="Ex: EMULADORES"
                                      />
                                  </div>
                                  <div className="space-y-1.5">
                                      <label className="text-[9px] font-black text-premium-muted uppercase tracking-widest">Logo do Time B (Upload ou Texto/Emoji)</label>
                                      <div className="flex gap-2">
                                          <input 
                                              type="text" 
                                              value={broadcastLogoB} 
                                              onChange={(e) => setBroadcastLogoB(e.target.value)}
                                              placeholder="Cole URL, Emoji ou deixe vazio"
                                              className="flex-1 bg-[#16161c] border border-white/5 rounded-lg p-2 font-bold text-white text-xs outline-none focus:border-red-500/50"
                                          />
                                          <label className="bg-[#16161c] hover:bg-neutral-800 border border-white/10 rounded-lg px-3 flex items-center justify-center cursor-pointer font-bold text-xs hover:text-red-500 transition-colors shrink-0">
                                              <span>Upload</span>
                                              <input 
                                                  type="file" 
                                                  accept="image/*" 
                                                  className="hidden" 
                                                  onChange={(e) => {
                                                      const file = e.target.files?.[0];
                                                      if (file) {
                                                          const reader = new FileReader();
                                                          reader.onload = (event) => {
                                                              if (event.target?.result) {
                                                                  setBroadcastLogoB(event.target.result as string);
                                                              }
                                                          };
                                                          reader.readAsDataURL(file);
                                                      }
                                                  }}
                                              />
                                          </label>
                                          {broadcastLogoB && (
                                              <button 
                                                  type="button"
                                                  onClick={() => setBroadcastLogoB('')} 
                                                  className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-lg px-2.5 font-bold text-xs"
                                                  title="Remover Logo"
                                              >
                                                  ✕
                                              </button>
                                          )}
                                      </div>
                                  </div>
                                  <div className="space-y-1.5">
                                      <label className="text-[9px] font-black text-premium-muted uppercase tracking-widest">Jogadores (Time B)</label>
                                      <div className="grid grid-cols-2 gap-2">
                                          {customPlayersB.map((p, idx) => (
                                              <input 
                                                  key={idx}
                                                  type="text"
                                                  value={p}
                                                  onChange={(e) => {
                                                      const next = [...customPlayersB];
                                                      next[idx] = e.target.value;
                                                      setCustomPlayersB(next);
                                                  }}
                                                  className="bg-[#16161c] border border-white/5 rounded-lg p-2 text-xs font-semibold text-white outline-none focus:border-red-500/40"
                                                  placeholder={`PLAYER ${idx + 1}`}
                                              />
                                          ))}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {/* TIMELINE TRACKER (Muted dot timeline under the broadcast card) */}
              <div className="bg-[#050508] py-4 px-6 flex justify-center border-t border-white/5 shrink-0">
                  <div className="flex items-center gap-1.5">
                      {order.map((o, idx) => (
                          <div 
                              key={idx} 
                              className={`w-2.5 h-2.5 rounded-full border transition-all duration-300 ${
                                  idx < stepIndex 
                                      ? (o.type === 'ban' 
                                          ? 'bg-red-500 border-red-500' 
                                          : o.team === 'A' 
                                              ? 'bg-[#00FF00] border-[#00FF00] shadow-[0_0_8px_rgba(0,255,0,0.5)]' 
                                              : 'bg-red-500 border-red-500') 
                                      : 'border-white/10 bg-transparent'
                              }`}
                              title={`${o.type.toUpperCase()} - TIME ${o.team}`}
                          ></div>
                      ))}
                  </div>
              </div>

              {/* STATS MODAL (Unchanged - needed for result compilation) */}
              {showStatsModal && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
                      <div className="bg-graphite-900 border border-loud-500/50 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden my-auto border-2">
                          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-graphite-800/50">
                              <div><h2 className="text-3xl font-black uppercase text-white italic tracking-tighter">Quem venceu a queda?</h2><p className="text-sm text-premium-muted uppercase font-bold tracking-widest mt-1">{maps[currentMatchIdx]} • JOGO {currentMatchIdx + 1} DE {format}</p></div>
                              <button onClick={() => setShowStatsModal(false)} className="p-3 hover:bg-graphite-800 rounded-full transition-all hover:rotate-90"><X size={28}/></button>
                          </div>
                          <div className="p-10 space-y-12">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                  <div onClick={() => setMatchResult(p => ({...p, winner: 'A'}))} className={`p-10 rounded-[2rem] border-4 cursor-pointer transition-all relative overflow-hidden ${matchResult.winner === 'A' ? 'border-teamA bg-teamA/10 scale-105 shadow-[0_0_50px_rgba(59,130,246,0.3)]' : 'border-white/5 grayscale hover:grayscale-0'}`}>
                                      {matchResult.winner === 'A' && <div className="absolute top-6 left-6 bg-teamA text-white p-3 rounded-2xl shadow-xl animate-bounce"><Trophy size={32} fill="currentColor"/></div>}
                                      <h3 className="text-4xl font-black text-teamA italic uppercase text-center mb-2 tracking-tighter">{teamA}</h3>
                                      <p className="text-xs font-black text-premium-muted uppercase tracking-widest text-center mt-4">Vencedor</p>
                                  </div>
                                  <div onClick={() => setMatchResult(p => ({...p, winner: 'B'}))} className={`p-10 rounded-[2rem] border-4 cursor-pointer transition-all relative overflow-hidden ${matchResult.winner === 'B' ? 'border-teamB bg-teamB/10 scale-105 shadow-[0_0_50px_rgba(249,115,22,0.3)]' : 'border-white/5 grayscale hover:grayscale-0'}`}>
                                      {matchResult.winner === 'B' && <div className="absolute top-6 right-6 bg-teamB text-white p-3 rounded-2xl shadow-xl animate-bounce"><Trophy size={32} fill="currentColor"/></div>}
                                      <h3 className="text-4xl font-black text-teamB italic uppercase text-center mb-2 tracking-tighter">{teamB}</h3>
                                      <p className="text-xs font-black text-premium-muted uppercase tracking-widest text-center mt-4">Vencedor</p>
                                  </div>
                              </div>
                              <div className="bg-graphite-900 p-8 rounded-[2rem] border border-white/5 relative overflow-hidden shadow-inner">
                                  <div className="flex items-center gap-3 mb-6"><Activity size={18} className="text-[#3b82f6]"/><h4 className="text-xs font-black text-premium-muted uppercase italic tracking-[0.2em]">Timeline do Draft</h4></div>
                                  <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar">
                                      {draftHistory.map((step, i) => (
                                          <div key={i} className="flex flex-col items-center gap-3 shrink-0 animate-fade-in-down" style={{animationDelay: `${i*0.05}s`}}>
                                              <span className="text-[9px] font-black text-premium-muted uppercase">{step.label}</span>
                                              <div className={`w-16 h-22 rounded-xl border-2 overflow-hidden shadow-lg ${step.type === 'ban' ? 'border-red-500 bg-red-600/5' : step.team === 'A' ? 'border-teamA bg-teamA/5' : 'border-teamB bg-teamB/5'}`}>
                                                  <img src={CHARACTERS_DB.find(c => c.name === step.charName)?.img} className="w-full h-full object-cover" />
                                              </div>
                                              <span className={`text-[10px] font-black uppercase italic ${step.team === 'A' ? 'text-teamA' : 'text-teamB'}`}>{step.team}</span>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                              {tournament.activeMatchId && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-[#3b82f6] uppercase border-b border-[#3b82f6]/20 pb-2 flex items-center gap-2"><Plus size={14}/> Scout {teamA}</h4>
                                        {tournament.teams.find(t => t.id === teamAId)?.players.map(p => (
                                            <div key={p.id} className="grid grid-cols-[1fr_80px_80px] gap-2 items-center bg-black/40 p-2 rounded-xl border border-white/5">
                                                <span className="text-xs font-black truncate text-white/80 ml-2">{p.name}</span>
                                                <input type="number" placeholder="KILLS" className="bg-graphite-900 border border-white/5 p-1.5 rounded text-center text-[10px] font-black outline-none focus:border-loud-500" value={tempPlayerStats[p.id]?.kills || ''} onChange={e => setTempPlayerStats(prev => ({...prev, [p.id]: { ...(prev[p.id] || {damage:0}), kills: parseInt(e.target.value) || 0 }}))}/>
                                                <input type="number" placeholder="DANO" className="bg-graphite-900 border border-white/5 p-1.5 rounded text-center text-[10px] font-black outline-none focus:border-loud-500" value={tempPlayerStats[p.id]?.damage || ''} onChange={e => setTempPlayerStats(prev => ({...prev, [p.id]: { ...(prev[p.id] || {kills:0}), damage: parseInt(e.target.value) || 0 }}))}/>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-[#ef4444] uppercase border-b border-[#ef4444]/20 pb-2 flex items-center gap-2"><Plus size={14}/> Scout {teamB}</h4>
                                        {tournament.teams.find(t => t.id === teamBId)?.players.map(p => (
                                            <div key={p.id} className="grid grid-cols-[1fr_80px_80px] gap-2 items-center bg-black/40 p-2 rounded-xl border border-white/5">
                                                <span className="text-xs font-black truncate text-white/80 ml-2">{p.name}</span>
                                                <input type="number" placeholder="KILLS" className="bg-graphite-900 border border-white/5 p-1.5 rounded text-center text-[10px] font-black outline-none focus:border-loud-500" value={tempPlayerStats[p.id]?.kills || ''} onChange={e => setTempPlayerStats(prev => ({...prev, [p.id]: { ...(prev[p.id] || {damage:0}), kills: parseInt(e.target.value) || 0 }}))}/>
                                                <input type="number" placeholder="DANO" className="bg-graphite-900 border border-white/5 p-1.5 rounded text-center text-[10px] font-black outline-none focus:border-loud-500" value={tempPlayerStats[p.id]?.damage || ''} onChange={e => setTempPlayerStats(prev => ({...prev, [p.id]: { ...(prev[p.id] || {kills:0}), damage: parseInt(e.target.value) || 0 }}))}/>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                              )}
                          </div>
                          <div className="p-10 bg-[#0e0e11] border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                              <div className="flex items-center gap-10 text-left">
                                  <div>
                                    <p className="text-[10px] font-black text-premium-muted uppercase italic tracking-widest mb-1">Placar Atual</p>
                                    <div className="text-4xl font-black text-white italic tracking-tighter flex items-center gap-4">
                                        <span className="text-[#3b82f6]">{seriesScore.A + (matchResult.winner === 'A' ? 1 : 0)}</span>
                                        <span className="text-graphite-600 text-xl">X</span>
                                        <span className="text-[#ef4444]">{seriesScore.B + (matchResult.winner === 'B' ? 1 : 0)}</span>
                                    </div>
                                  </div>
                                  <div className="h-14 w-px bg-white/5 hidden md:block"></div>
                                  <div><p className="text-[10px] font-black text-premium-muted uppercase italic tracking-widest mb-1">MD</p><p className="text-2xl font-black text-yellow-500 italic">{format}</p></div>
                              </div>
                              <div className="flex gap-4 w-full md:w-auto">
                                  <button onClick={() => setShowStatsModal(false)} className="flex-1 md:flex-none px-12 py-5 bg-graphite-800 hover:bg-graphite-700 rounded-2xl font-black text-xs uppercase italic transition-all border border-white/5">Cancelar</button>
                                  <button onClick={saveMatchResults} className="flex-1 md:flex-none px-16 py-5 bg-[#3b82f6] hover:bg-blue-600 text-black rounded-2xl font-black text-sm uppercase italic transition-all shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:scale-105 active:scale-95">
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
                <div className="absolute inset-0 bg-loud-500/20 blur-[120px] rounded-full animate-pulse"></div>
                <div className="relative">
                    <div className="w-24 h-24 bg-loud-500 rounded-3xl flex items-center justify-center text-black shadow-2xl mx-auto mb-8 transform -rotate-12 animate-bounce"><Trophy size={48} fill="currentColor" /></div>
                    <h1 className="text-6xl md:text-8xl font-display font-bold text-white italic tracking-tighter uppercase leading-none">{winnerName}</h1>
                    <p className="text-2xl font-display font-bold text-loud-500 uppercase tracking-[0.5em] mt-4">VENCEDOR DA SÉRIE MD{format}</p>
                </div>
            </div>
            <div className="bg-graphite-800 border-2 border-loud-500/50 rounded-[3rem] p-12 w-full max-w-2xl shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform"><Crown size={120} className="text-loud-500" /></div>
                <div className="flex items-center justify-around gap-12 relative z-10">
                    <div className="text-center space-y-4">
                        <p className="text-xs font-black text-premium-muted uppercase tracking-widest opacity-60">Placar Final</p>
                        <div className="text-9xl font-display font-bold italic tracking-tighter flex items-center gap-8">
                            <span className={seriesScore.A > seriesScore.B ? 'text-loud-500' : 'text-graphite-600'}>{seriesScore.A}</span>
                            <span className="text-graphite-700 text-5xl">X</span>
                            <span className={seriesScore.B > seriesScore.A ? 'text-loud-500' : 'text-graphite-600'}>{seriesScore.B}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex gap-4">
                <button onClick={() => tournament.matches.length > 0 ? setView('tournament_hub') : setView('home')} className="btn-loud px-16 py-5">Voltar ao Início</button>
            </div>
        </div>
    );
  }

  if (view === 'tournament_setup') {
    return (
        <div className="max-w-6xl mx-auto py-10 px-4 animate-fade-in space-y-12">
            <button onClick={() => setView('home')} className="flex items-center gap-2 text-premium-muted hover:text-white font-black uppercase text-xs italic transition-all opacity-60 hover:opacity-100"><ChevronLeft size={16} /> Voltar</button>
            <div className="bg-graphite-800 border border-white/5 rounded-[2.5rem] p-10 flex flex-col md:flex-row gap-10 items-end shadow-2xl">
                <div className="flex-1 space-y-4 w-full">
                    <label className="text-xs font-black text-loud-500 uppercase italic tracking-widest opacity-80">Nome do Campeonato</label>
                    <input 
                        type="text" 
                        placeholder="EX: COPA FUMAÇA PREMIUM" 
                        className="w-full bg-graphite-900 border border-white/5 rounded-2xl p-5 text-xl font-display font-bold text-white focus:border-loud-500 outline-none italic transition-all tracking-tight" 
                        value={tournament.name} 
                        onChange={e => setTournament(prev => ({...prev, name: e.target.value}))}
                    />
                </div>
                <div className="w-full md:w-64 space-y-4">
                    <label className="text-xs font-black text-loud-500 uppercase italic tracking-widest opacity-80">Senha Mestra</label>
                    <input 
                        type="password" 
                        placeholder="••••••" 
                        className="w-full bg-graphite-900 border border-white/5 rounded-2xl p-5 font-bold text-white focus:border-loud-500 outline-none" 
                        value={tournament.adminPassword} 
                        onChange={e => setTournament(prev => ({...prev, adminPassword: e.target.value}))}
                    />
                </div>
            </div>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-graphite-800 p-8 rounded-[2rem] border border-white/5 space-y-6 shadow-xl">
                    <h3 className="text-loud-500 font-bold uppercase text-xs tracking-widest flex items-center gap-2 italic opacity-80"><Hand size={14}/> Equipes Totais</h3>
                    <select 
                        value={tournament.teamsLimit || 8} 
                        onChange={e => setTournament(prev => ({...prev, teamsLimit: parseInt(e.target.value), teams: []}))}
                        className="w-full bg-graphite-900 border border-white/5 rounded-xl p-4 font-black text-white focus:border-loud-500 outline-none uppercase italic text-xs cursor-pointer"
                    >
                        {[2, 4, 8, 10, 12, 14, 16].map(num => <option key={num} value={num}>{num} Equipes</option>)}
                    </select>
                </div>
                <div className="bg-graphite-800 p-8 rounded-[2rem] border border-white/5 space-y-6 shadow-xl">
                    <h3 className="text-loud-500 font-bold uppercase text-xs tracking-widest flex items-center gap-2 italic opacity-80"><FastForward size={14}/> Formato do Torneio</h3>
                    <div className="flex gap-3">
                        {['single', 'double'].map(f => (
                            <button 
                                key={f} 
                                onClick={() => setTournament(prev => ({...prev, format: f as any}))} 
                                className={`flex-1 py-4 rounded-xl font-black border-2 transition-all uppercase italic text-xs ${tournament.format === f ? 'bg-loud-500 text-black border-loud-500 shadow-[0_0_20px_rgba(58,255,0,0.3)] scale-105' : 'bg-graphite-900 text-premium-muted border-white/5 hover:border-white/20'}`}
                            >
                                {f === 'single' ? 'E. Simples' : 'E. Dupla'}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="bg-graphite-800 p-8 rounded-[2rem] border border-white/5 space-y-6 shadow-xl">
                    <h3 className="text-loud-500 font-bold uppercase text-xs tracking-widest flex items-center gap-2 italic opacity-80"><MonitorPlay size={14}/> Formato das Séries</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {[1, 3, 5].map(f => (
                            <button 
                                key={f} 
                                onClick={() => setTournament(prev => ({...prev, seriesFormat: f}))} 
                                className={`py-4 rounded-xl font-black border-2 transition-all italic text-xs ${tournament.seriesFormat === f ? 'bg-loud-500 text-black border-loud-500 shadow-[0_0_20px_rgba(58,255,0,0.3)] scale-105' : 'bg-graphite-900 text-premium-muted border-white/5 hover:border-white/20'}`}
                            >
                                MD{f}
                            </button>
                        ))}
                        <div className="bg-graphite-900 border border-loud-500/30 text-loud-500 text-[10px] font-black rounded-xl p-2 text-center flex items-center justify-center uppercase italic">Final é MD3</div>
                    </div>
                </div>
            </section>
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-graphite-800 border border-white/5 rounded-[2rem] p-10 space-y-8 shadow-xl">
                    <h3 className="text-2xl font-display font-bold uppercase text-white flex items-center gap-3 italic tracking-tight">
                        <UserPlus className="text-loud-500" /> Registrar Equipe <span className="text-loud-500">({tournament.teams.length}/{tournament.teamsLimit})</span>
                    </h3>
                    <input 
                        type="text" 
                        placeholder="NOME DA GUILDA" 
                        className="w-full bg-graphite-900 border border-white/5 rounded-xl p-4 font-display font-bold text-white outline-none focus:border-loud-500 italic tracking-tight" 
                        value={newTeam.name} 
                        onChange={e => setNewTeam(prev => ({...prev, name: e.target.value}))}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        {newTeam.players.map((p, i) => (
                            <input 
                                key={i} 
                                type="text" 
                                placeholder={`PLAYER ${i+1}`} 
                                className="w-full bg-graphite-900 border border-white/5 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-loud-500 transition-all" 
                                value={p} 
                                onChange={e => { const pCopy = [...newTeam.players]; pCopy[i] = e.target.value; setNewTeam(prev => ({...prev, players: pCopy})); }}
                            />
                        ))}
                    </div>
                    <button 
                        onClick={handleAddTeam} 
                        disabled={tournament.teams.length >= (tournament.teamsLimit || 8)}
                        className="btn-loud w-full py-5 text-lg disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        {tournament.teams.length >= (tournament.teamsLimit || 8) ? 'Vagas Esgotadas' : 'Confirmar Inscrição'}
                    </button>
                </div>
                <div className="bg-black/40 border border-white/5 rounded-[2rem] p-6 overflow-y-auto max-h-[550px] custom-scrollbar shadow-inner">
                    {tournament.teams.map((t, idx) => (
                        <div key={t.id} className="flex items-center justify-between p-5 bg-graphite-900 border border-white/5 rounded-2xl mb-3 group hover:border-loud-500/30 transition-all">
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-black text-premium-muted italic tracking-widest opacity-40">#{idx + 1}</span>
                                <p className="font-display font-bold text-white uppercase italic text-lg tracking-tight">{t.name}</p>
                            </div>
                            <button onClick={() => setTournament(prev => ({...prev, teams: prev.teams.filter(team => team.id !== t.id)}))} className="text-premium-muted hover:text-red-500 transition-all p-2 rounded-lg hover:bg-red-500/10 opacity-40 hover:opacity-100"><X size={24} /></button>
                        </div>
                    ))}
                    {tournament.teams.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-premium-muted opacity-20 py-20">
                            <Users size={64} className="mb-4"/>
                            <p className="text-xs font-black uppercase tracking-[0.3em]">Aguardando Inscrições</p>
                        </div>
                    )}
                </div>
            </section>
            <div className="flex justify-center pt-10">
                <button 
                    disabled={tournament.teams.length < 2 || !tournament.name}
                    onClick={() => { 
                        if(tournament.teams.length < 2) return;
                        const shuffled = [...tournament.teams].sort(() => Math.random() - 0.5);
                        const count = tournament.teamsLimit || shuffled.length;
                        const totalRounds = Math.ceil(Math.log2(count));
                        const matches: TournamentMatch[] = [];
                        // Winner Bracket
                        for (let r = 1; r <= totalRounds; r++) {
                            const matchesInRound = Math.pow(2, totalRounds - r);
                            for (let m = 0; m < matchesInRound; m++) { 
                                matches.push({ 
                                    id: `W${r}-${m}`, round: r, teamAId: null, teamBId: null, scoreA: 0, scoreB: 0, winnerId: null, status: 'scheduled',
                                    isFinal: (r === totalRounds && tournament.format === 'single'), bracketType: 'winner'
                                }); 
                            }
                        }
                        // Loser Bracket (Only if Double)
                        if (tournament.format === 'double') {
                            for (let r = 1; r < totalRounds; r++) {
                                const matchesInRound = Math.pow(2, totalRounds - r - 1);
                                for (let m = 0; m < matchesInRound; m++) {
                                    matches.push({ 
                                        id: `L${r}-${m}`, round: r, teamAId: null, teamBId: null, scoreA: 0, scoreB: 0, winnerId: null, status: 'scheduled',
                                        isFinal: (r === totalRounds - 1), bracketType: 'loser'
                                    });
                                }
                            }
                            // Grand Final
                            matches.push({ id: `G1-0`, round: 1, teamAId: null, teamBId: null, scoreA: 0, scoreB: 0, winnerId: null, status: 'scheduled', isFinal: true, bracketType: 'grand-final' });
                        }
                        // Initial Seeding
                        const slotsInRound1 = Math.pow(2, totalRounds);
                        for (let i = 0; i < shuffled.length; i += 2) {
                            const idx = matches.findIndex(m => m.id === `W1-${Math.floor(i/2)}`);
                            if (idx !== -1) { 
                                matches[idx].teamAId = shuffled[i].id; 
                                if (shuffled[i+1]) {
                                    matches[idx].teamBId = shuffled[i+1].id;
                                } else { 
                                    // BYE: Automatic winner
                                    matches[idx].winnerId = shuffled[i].id; 
                                    matches[idx].status = 'finished'; 
                                    matches[idx].scoreA = 1; 
                                    // Advance auto-winner to next round
                                    const nextMatchId = `W2-${Math.floor(Math.floor(i/2)/2)}`;
                                    const nextIdx = matches.findIndex(m => m.id === nextMatchId);
                                    if (nextIdx !== -1) {
                                        const isTeamASlot = Math.floor(i/2) % 2 === 0;
                                        matches[nextIdx][isTeamASlot ? 'teamAId' : 'teamBId'] = shuffled[i].id;
                                    }
                                }
                            }
                        }
                        setTournament(prev => ({ ...prev, matches })); setIsAdmin(true); setView('tournament_hub'); 
                    }} 
                    className="btn-loud px-20 py-6 text-2xl"
                >
                    <Trophy size={32} className="mr-4" /> Gerar Chaves & Sorteio
                </button>
            </div>
        </div>
    );
  }

  if (view === 'tournament_hub') {
    const totalRounds = Math.ceil(Math.log2(tournament.teamsLimit || tournament.teams.length));
    
    const renderBracketMatch = (m: TournamentMatch) => (
        <div key={m.id} className={`relative group bg-graphite-800 border-2 rounded-3xl w-72 p-5 transition-all shadow-2xl ${m.status === 'finished' ? 'border-white/5 opacity-60 hover:opacity-100' : 'border-white/5 hover:border-loud-500/50'}`}>
            <div className="flex justify-between items-center mb-4">
                <span className="text-[9px] font-black text-premium-muted uppercase tracking-widest italic truncate opacity-60">{m.bracketType.toUpperCase()} • {m.isFinal ? 'FINAL MD3' : `MD${tournament.seriesFormat}`}</span>
                <div className="flex gap-1 shrink-0">
                    {isAdmin && <button onClick={() => setManualEditMatch({ id: m.id, slot: 'A' })} className="p-1 text-premium-muted hover:text-loud-500"><Edit2 size={12}/></button>}
                    {m.status === 'finished' && <CheckCircle size={14} className="text-emerald-500"/>}
                </div>
            </div>
            <div className="space-y-2">
                <div onClick={() => startTournamentMatch(m.id)} className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition-all ${m.winnerId === m.teamAId && m.winnerId ? 'bg-loud-500/10 border-loud-500 text-loud-500 shadow-[0_0_10px_#3AFF0022]' : 'bg-graphite-900 border-white/5 text-premium-muted'} hover:border-white/20`}><span className="text-xs font-black truncate uppercase italic">{tournament.teams.find(t => t.id === m.teamAId)?.name || 'AGUARDANDO'}</span><span className="font-black text-sm">{m.scoreA}</span></div>
                <div onClick={() => startTournamentMatch(m.id)} className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition-all ${m.winnerId === m.teamBId && m.winnerId ? 'bg-loud-500/10 border-loud-500 text-loud-500 shadow-[0_0_10px_#3AFF0022]' : 'bg-graphite-900 border-white/5 text-premium-muted'} hover:border-white/20`}><span className="text-xs font-black truncate uppercase italic">{tournament.teams.find(t => t.id === m.teamBId)?.name || 'AGUARDANDO'}</span><span className="font-black text-sm">{m.scoreB}</span></div>
            </div>
            {isAdmin && m.status !== 'finished' && (m.teamAId || m.teamBId) && (
                <div className="mt-3 flex gap-2 justify-center border-t border-white/5 pt-3">
                    <button onClick={() => forceAdvance(m.id, 'A')} className="text-[8px] font-black uppercase text-loud-500 hover:underline flex items-center gap-1"><FastForward size={10}/> Avançar A</button>
                    <button onClick={() => forceAdvance(m.id, 'B')} className="text-[8px] font-black uppercase text-loud-500 hover:underline flex items-center gap-1"><FastForward size={10}/> Avançar B</button>
                </div>
            )}
        </div>
    );

    return (
        <div className="max-w-full mx-auto py-8 px-4 animate-fade-in flex flex-col h-screen overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 bg-graphite-800 p-8 rounded-[2.5rem] border border-white/5 shrink-0 shadow-2xl">
                <div className="text-left">
                    <h1 className="text-4xl font-display font-bold uppercase text-white italic tracking-tighter leading-none">{tournament.name}</h1>
                    <div className="flex items-center gap-4 mt-3">
                        <p className="text-loud-500 font-bold text-xs uppercase tracking-[0.3em] flex items-center gap-2"><Target size={12}/> {tournament.format === 'double' ? 'ELIMINAÇÃO DUPLA' : 'ELIMINAÇÃO SIMPLES'}</p>
                        <div className="h-4 w-px bg-white/10"></div>
                        <button 
                            onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminLoginModal(true)} 
                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all ${isAdmin ? 'bg-emerald-600/20 text-emerald-500 border border-emerald-500/30' : 'bg-red-600/20 text-red-500 border border-red-500/30 animate-pulse'}`}
                        >
                            {isAdmin ? <Unlock size={12}/> : <Lock size={12}/>}
                            {isAdmin ? 'ADMIN ATIVO' : 'CLIQUE PARA DESBLOQUEAR'}
                        </button>
                    </div>
                </div>
                <div className="flex gap-2 bg-graphite-900 p-2 rounded-2xl border border-white/5 shadow-inner">
                    <button onClick={() => setHubTab('bracket')} className={`px-8 py-3 rounded-xl font-black text-xs uppercase transition-all italic ${hubTab === 'bracket' ? 'bg-loud-500 text-black shadow-lg' : 'text-premium-muted hover:text-white'}`}>Chaves</button>
                    <button onClick={() => setHubTab('standings')} className={`px-8 py-3 rounded-xl font-black text-xs uppercase transition-all italic ${hubTab === 'standings' ? 'bg-loud-500 text-black shadow-lg' : 'text-premium-muted hover:text-white'}`}>Tabela</button>
                    <button onClick={() => setHubTab('mvp')} className={`px-8 py-3 rounded-xl font-black text-xs uppercase transition-all italic ${hubTab === 'mvp' ? 'bg-loud-500 text-black shadow-lg' : 'text-premium-muted hover:text-white'}`}>MVP</button>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => downloadDivAsImage('bracket-capture', 'chaveamento-campeonato')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase italic tracking-widest border border-blue-500/20 transition-all shadow-lg flex items-center gap-2">
                        <ImageIcon size={16}/> Salvar Chaves
                    </button>
                    <button onClick={endTournament} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase italic tracking-widest border border-blue-500/20 transition-all shadow-lg">Encerrar</button>
                    <button onClick={() => setView('home')} className="p-3 hover:bg-graphite-700 rounded-full text-premium-muted transition-all active:scale-90"><X size={28}/></button>
                </div>
            </div>
            
            <div className="flex-1 bg-graphite-800/50 border border-white/5 rounded-[3rem] p-10 overflow-auto custom-scrollbar shadow-inner relative">
                {hubTab === 'bracket' && (
                    <div id="bracket-capture" className="min-w-max min-h-full flex flex-col items-center py-10 gap-20 bg-graphite-900">
                        
                        {/* --- WINNER BRACKET (SYMMETRICAL) --- */}
                        <div className="flex items-center justify-center gap-10">
                            {/* Left Side Rounds */}
                            <div className="flex gap-10">
                                {Array.from({ length: Math.max(0, totalRounds - 1) }).map((_, rIdx) => {
                                    const rNum = rIdx + 1;
                                    const matchesInRound = Math.pow(2, totalRounds - rNum);
                                    const sideCount = Math.max(1, matchesInRound / 2);
                                    return (
                                        <div key={`left-${rNum}`} className="flex flex-col gap-10">
                                            <h3 className="text-center font-black text-loud-500 uppercase text-[10px] mb-4 border-b border-loud-500/20 pb-2 italic tracking-[0.4em]">ROUND {rNum} L</h3>
                                            <div className="flex flex-col justify-around gap-8 h-full">
                                                {tournament.matches.filter(m => m.bracketType === 'winner' && m.round === rNum).slice(0, sideCount).map(renderBracketMatch)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Center Final */}
                            <div className="flex flex-col items-center gap-10">
                                <div className="text-center">
                                    <div className="bg-loud-500 w-16 h-16 rounded-3xl flex items-center justify-center text-black shadow-[0_0_50px_rgba(58,255,0,0.4)] mx-auto mb-4 animate-bounce">
                                        <Trophy size={32} fill="currentColor"/>
                                    </div>
                                    <h3 className="font-black text-white uppercase text-xs italic tracking-[0.5em] mb-4">GRANDE FINAL</h3>
                                </div>
                                {tournament.matches.filter(m => m.round === totalRounds && m.bracketType === 'winner').map(renderBracketMatch)}
                                {tournament.format === 'double' && tournament.matches.filter(m => m.bracketType === 'grand-final').map(renderBracketMatch)}
                            </div>

                            {/* Right Side Rounds (Reversed for symmetry) */}
                            <div className="flex flex-row-reverse gap-10">
                                {Array.from({ length: Math.max(0, totalRounds - 1) }).map((_, rIdx) => {
                                    const rNum = rIdx + 1;
                                    const matchesInRound = Math.pow(2, totalRounds - rNum);
                                    const sideCount = Math.max(1, matchesInRound / 2);
                                    return (
                                        <div key={`right-${rNum}`} className="flex flex-col gap-10">
                                            <h3 className="text-center font-black text-loud-500 uppercase text-[10px] mb-4 border-b border-loud-500/20 pb-2 italic tracking-[0.4em]">ROUND {rNum} R</h3>
                                            <div className="flex flex-col justify-around gap-8 h-full">
                                                {tournament.matches.filter(m => m.bracketType === 'winner' && m.round === rNum).slice(sideCount).map(renderBracketMatch)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* --- LOSER BRACKET (BELOW IF DOUBLE ELIM) --- */}
                        {tournament.format === 'double' && (
                            <div className="flex flex-col items-center gap-10 border-t border-white/5 pt-16 w-full">
                                <h2 className="text-2xl font-black text-loud-500 uppercase italic tracking-widest bg-loud-500/10 px-10 py-3 rounded-full border border-loud-500/20">Repescagem (Losers Bracket)</h2>
                                <div className="flex gap-16 justify-center">
                                    {Array.from({ length: Math.max(0, totalRounds - 1) }).map((_, rIdx) => (
                                        <div key={`loser-${rIdx + 1}`} className="flex flex-col gap-10">
                                            <h3 className="text-center font-black text-loud-500 uppercase text-[10px] mb-6 border-b border-loud-500/20 pb-4 italic tracking-[0.4em]">LOSERS ROUND {rIdx + 1}</h3>
                                            <div className="flex flex-col justify-around gap-12 h-full">
                                                {tournament.matches.filter(m => m.bracketType === 'loser' && m.round === rIdx + 1).map(renderBracketMatch)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {hubTab === 'standings' && (
                    <div className="overflow-hidden rounded-[2.5rem] border border-white/5 shadow-2xl bg-graphite-900/30">
                        <table className="w-full text-left">
                            <thead className="bg-graphite-800/80 text-premium-muted text-[10px] font-black uppercase sticky top-0 backdrop-blur-md">
                                <tr><th className="p-6 italic">#</th><th className="p-6">Equipe</th><th className="p-6 text-center">Partidas</th><th className="p-6 text-center text-emerald-500">VIT</th><th className="p-6 text-center text-red-500">DER</th><th className="p-6 text-center text-loud-500">RG</th><th className="p-6 text-center">Saldo</th></tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {[...tournament.teams].sort((a,b) => b.stats.wins - a.stats.wins || b.stats.roundsWon - a.stats.roundsWon).map((t, idx) => (
                                    <tr key={t.id} className="hover:bg-loud-500/5 transition-colors group">
                                        <td className="p-6 font-black text-premium-muted italic group-hover:text-loud-500 transition-colors">#{idx + 1}</td>
                                        <td className="p-6 font-black text-white uppercase italic text-lg tracking-tighter">{t.name}</td>
                                        <td className="p-6 text-center font-bold text-premium-muted">{t.stats.matchesPlayed}</td>
                                        <td className="p-6 text-center font-black text-emerald-500">{t.stats.wins}</td>
                                        <td className="p-6 text-center font-black text-red-500">{t.stats.losses}</td>
                                        <td className="p-6 text-center font-black text-loud-500 text-xl">{t.stats.roundsWon}</td>
                                        <td className="p-6 text-center font-black text-white">{t.stats.roundsWon - t.stats.roundsLost}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {hubTab === 'mvp' && (
                    <div className="overflow-hidden rounded-[2.5rem] border border-white/5 shadow-2xl bg-graphite-900/30">
                        <table className="w-full text-left">
                            <thead className="bg-graphite-800/80 text-premium-muted text-[10px] font-black uppercase sticky top-0 backdrop-blur-md">
                                <tr><th className="p-6">Rank</th><th className="p-6">Player</th><th className="p-6">Time</th><th className="p-6 text-center">Abates</th><th className="p-6 text-center">K/D Médio</th><th className="p-6 text-center">Dano Total</th></tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {tournament.teams.flatMap(t => t.players.map(p => ({ ...p, tName: t.name }))).sort((a,b) => b.stats.totalKills - a.stats.totalKills).map((p, idx) => (
                                    <tr key={p.id} className="hover:bg-loud-500/5 transition-colors group">
                                        <td className="p-6">{idx === 0 ? <Crown className="text-loud-500" size={24} fill="currentColor"/> : <span className="font-black text-premium-muted">#{idx + 1}</span>}</td>
                                        <td className="p-6 font-black text-white uppercase italic text-lg tracking-tighter group-hover:text-loud-500 transition-colors">{p.name}</td>
                                        <td className="p-6"><span className="text-[9px] font-black text-premium-muted uppercase bg-graphite-800/50 px-3 py-1.5 rounded-lg border border-white/5">{p.tName}</span></td>
                                        <td className="p-6 text-center font-black text-white text-xl">{p.stats.totalKills}</td>
                                        <td className="p-6 text-center font-black text-loud-500">{(p.stats.totalKills / (p.stats.matchesPlayed || 1)).toFixed(2)}</td>
                                        <td className="p-6 text-center font-mono text-xs text-premium-muted tabular-nums">{p.stats.totalDamage}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Admin Login Modal */}
            {showAdminLoginModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fade-in">
                    <div className="bg-graphite-900 border-2 border-loud-500 rounded-[2rem] w-full max-w-sm p-8 shadow-[0_0_50px_rgba(58,255,0,0.2)]">
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="p-4 bg-loud-500 rounded-2xl text-black mb-4 shadow-lg"><Lock size={32} /></div>
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Área Restrita</h3>
                            <p className="text-xs text-premium-muted font-bold uppercase mt-2">Insira sua Senha Mestra para gerenciar</p>
                        </div>
                        <div className="space-y-4">
                            <input 
                                type="password" 
                                placeholder="SENHA" 
                                className="w-full bg-graphite-800 border border-white/5 rounded-xl p-4 text-center font-bold text-white focus:border-loud-500 outline-none transition-all"
                                value={adminInputPassword}
                                onChange={(e) => setAdminInputPassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button onClick={() => setShowAdminLoginModal(false)} className="flex-1 py-4 bg-graphite-700 hover:bg-graphite-600 text-premium-muted rounded-xl font-black uppercase text-[10px] italic transition-all">Cancelar</button>
                                <button onClick={handleAdminLogin} className="flex-2 py-4 bg-loud-500 hover:bg-loud-600 text-black rounded-xl font-black uppercase text-[10px] italic transition-all shadow-lg">Desbloquear</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Edit Slot Modal */}
            {manualEditMatch && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-graphite-900 border border-loud-500/50 rounded-3xl w-full max-w-md p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-white uppercase italic">Editar Chaveamento</h3>
                            <button onClick={() => setManualEditMatch(null)} className="p-2 hover:bg-graphite-800 rounded-full transition-all"><X size={24}/></button>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-premium-muted uppercase italic tracking-widest block mb-3">Time Slot A</label>
                                <select 
                                    className="w-full bg-graphite-800 border border-white/5 rounded-xl p-4 font-black text-white outline-none focus:border-loud-500 uppercase text-xs italic"
                                    value={tournament.matches.find(m => m.id === manualEditMatch.id)?.teamAId || ''}
                                    onChange={(e) => updateManualSlot(manualEditMatch.id, 'A', e.target.value || null)}
                                >
                                    <option value="">- SELECIONAR TIME -</option>
                                    {tournament.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-premium-muted uppercase italic tracking-widest block mb-3">Time Slot B</label>
                                <select 
                                    className="w-full bg-graphite-800 border border-white/5 rounded-xl p-4 font-black text-white outline-none focus:border-loud-500 uppercase text-xs italic"
                                    value={tournament.matches.find(m => m.id === manualEditMatch.id)?.teamBId || ''}
                                    onChange={(e) => updateManualSlot(manualEditMatch.id, 'B', e.target.value || null)}
                                >
                                    <option value="">- SELECIONAR TIME -</option>
                                    {tournament.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <button onClick={() => setManualEditMatch(null)} className="w-full mt-8 bg-loud-500 hover:bg-loud-600 text-black py-4 rounded-xl font-black uppercase text-xs italic transition-all">Salvar Alterações</button>
                    </div>
                </div>
            )}
        </div>
    );
  }

  return null;
}

export default PicksBans;
