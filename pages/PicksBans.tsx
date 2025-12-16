
import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Map as MapIcon, Shield, Users, 
  ChevronRight, Play, RefreshCw, LayoutGrid, 
  CheckCircle, History, Download, X, Sword, MonitorPlay, ChevronLeft, Save,
  RotateCcw, GripVertical, CheckSquare, Settings, Crown, AlertTriangle, ArrowRight, Clock, Pause,
  Search, Zap, Lock, Edit2, CornerDownRight, Timer, HelpCircle, UserPlus, Grid, GitMerge, Upload, List, BarChart2, Target, Heart, Crosshair, Plus
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
  { name: 'ALVARO', img: 'https://i.ibb.co/3ykJ2Kz/ALVARO.png', type: 'Passive' }, 
  { name: 'MOCO', img: 'https://i.ibb.co/JqsP1z0/MOCO.png', type: 'Passive' },   
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

type ViewState = 'home' | 'mode' | 'format' | 'maps' | 'draft' | 'history' | 'result' | 'tournament_setup' | 'tournament_hub' | 'map_veto';
type DraftMode = 'snake' | 'linear' | 'mirrored';
type MapDrawType = 'no-repeat' | 'repeat' | 'fixed';
type DraftStepType = 'ban' | 'pick';
type Winner = 'A' | 'B' | null;

interface PlayerStats {
    kills: number;
    assists: number;
    damage: number;
}

interface DraftStep {
  team: 'A' | 'B';
  type: DraftStepType;
  label: string;
}

interface MatchRecord {
  matchIndex: number;
  map: string;
  mode: string;
  bans: { A: string | null, B: string | null };
  picks: { A: string[], B: string[] };
  rounds: number;
  winner: Winner;
  scoreA: number;
  scoreB: number;
  orderSnapshot: DraftStep[];
  playerStats?: Record<string, PlayerStats>; // Key is player ID (teamId-playerIndex)
}

// --- TOURNAMENT TYPES ---
interface TournamentPlayer {
    id: string;
    name: string;
}

interface TournamentTeam {
    id: string;
    name: string;
    logo: string | null;
    players: TournamentPlayer[];
    stats: { wins: number, losses: number, matchesPlayed: number };
}

interface TournamentMatch {
    id: string;
    round: number;
    teamAId: string;
    teamBId: string;
    format: number; // MD1, MD3, MD5
    winnerId: string | null;
    maps: string[]; // Maps played/to be played
    scores: { mapIndex: number, winner: string }[];
    status: 'scheduled' | 'veto' | 'live' | 'finished';
    seriesStats?: Record<string, PlayerStats>; // Aggregated stats for the series
}

interface TournamentState {
    name: string;
    stage: 'swiss' | 'playoffs';
    currentRound: number;
    teams: TournamentTeam[];
    matches: TournamentMatch[];
    activeMatchId: string | null; // Currently being played
}

const ORDERS: Record<DraftMode, DraftStep[]> = {
  snake: [
    { team: 'A', type: 'ban', label: 'BAN' },
    { team: 'B', type: 'ban', label: 'BAN' },
    { team: 'A', type: 'pick', label: 'PICK 1' },
    { team: 'B', type: 'pick', label: 'PICK 1' },
    { team: 'B', type: 'pick', label: 'PICK 2' },
    { team: 'A', type: 'pick', label: 'PICK 2' },
    { team: 'A', type: 'pick', label: 'PICK 3' },
    { team: 'B', type: 'pick', label: 'PICK 3' },
    { team: 'B', type: 'pick', label: 'PICK 4' },
    { team: 'A', type: 'pick', label: 'PICK 4' },
  ],
  linear: [
    { team: 'A', type: 'ban', label: 'BAN' },
    { team: 'B', type: 'ban', label: 'BAN' },
    { team: 'A', type: 'pick', label: 'PICK 1' },
    { team: 'B', type: 'pick', label: 'PICK 1' },
    { team: 'A', type: 'pick', label: 'PICK 2' },
    { team: 'B', type: 'pick', label: 'PICK 2' },
    { team: 'A', type: 'pick', label: 'PICK 3' },
    { team: 'B', type: 'pick', label: 'PICK 3' },
    { team: 'A', type: 'pick', label: 'PICK 4' },
    { team: 'B', type: 'pick', label: 'PICK 4' },
  ],
  mirrored: [
    { team: 'A', type: 'ban', label: 'BAN' },
    { team: 'B', type: 'ban', label: 'BAN' },
    { team: 'A', type: 'pick', label: 'PICK 1' },
    { team: 'B', type: 'pick', label: 'PICK 1' },
    { team: 'A', type: 'pick', label: 'PICK 2' },
    { team: 'B', type: 'pick', label: 'PICK 2' },
    { team: 'A', type: 'pick', label: 'PICK 3' },
    { team: 'B', type: 'pick', label: 'PICK 3' },
    { team: 'A', type: 'pick', label: 'PICK 4' },
    { team: 'B', type: 'pick', label: 'PICK 4' },
  ]
};

// --- COMPONENTS ---

// Updated: Removed scale-105 and transition to prevent "growing" effect
const BroadcastDraftSlot: React.FC<{ 
    type: 'ban' | 'pick', 
    charName: string | null, 
    team: 'A' | 'B', 
    isActive?: boolean, 
    onClick: () => void,
    onDrop: (e: React.DragEvent) => void,
}> = ({ type, charName, team, isActive, onClick, onDrop }) => {
    const isBan = type === 'ban';
    const charData = charName ? CHARACTERS_DB.find(c => c.name === charName) : null;
    const teamColor = team === 'A' ? 'border-teamA' : 'border-teamB';
    
    return (
        <div className="h-full w-full flex items-center justify-center p-0.5">
            <div 
                onClick={onClick}
                onDragOver={e => e.preventDefault()}
                onDrop={onDrop}
                className={`relative h-full aspect-[3/4] rounded-lg overflow-hidden border-2 cursor-pointer ${
                    isActive 
                    ? 'border-yellow-400 bg-gray-800 ring-2 ring-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.2)]' // No transform/scale
                    : (isBan 
                        ? 'border-gray-600 bg-gray-900 grayscale opacity-80' 
                        : `${teamColor} bg-gray-900`
                      )
                }`}
            >
                <div className="w-full h-full relative">
                    {charData ? (
                        <img 
                            src={charData.img} 
                            className="w-full h-full object-cover object-top" 
                            alt={charName || ''} 
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center opacity-20">
                            {isBan ? <X size={20}/> : <Users size={20}/>}
                        </div>
                    )}
                    
                    {isBan && charData && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <X size={32} className="text-red-500 opacity-80 drop-shadow-lg" strokeWidth={3} />
                        </div>
                    )}
                </div>

                <div className="absolute bottom-0 inset-x-0 bg-black/90 py-0.5 px-1 border-t border-white/10 z-20">
                    <p className={`text-center font-black uppercase text-[8px] md:text-[9px] truncate ${isBan ? 'text-gray-400' : 'text-white'}`}>
                        {charData?.name || type.toUpperCase()}
                    </p>
                </div>
            </div>
        </div>
    );
};

// Specialized Result Card for History List
const ResultHistoryCard: React.FC<{ 
    charName: string | null, 
    type: 'ban' | 'pick', 
    team: 'A' | 'B'
}> = ({ charName, type, team }) => {
    const data = CHARACTERS_DB.find(c => c.name === charName);
    const borderColor = type === 'ban' ? 'border-gray-600' : (team === 'A' ? 'border-teamA' : 'border-teamB');
    const labelColor = type === 'ban' ? 'text-gray-500' : (team === 'A' ? 'text-teamA' : 'text-teamB');
    const bgClass = type === 'ban' ? 'bg-gray-900' : 'bg-gray-800';
    
    return (
        <div className="flex flex-col items-center justify-end w-[42px] md:w-[48px] shrink-0 h-full">
            <div className={`w-full aspect-[3/4] rounded-md overflow-hidden border-2 ${borderColor} ${bgClass} relative mb-1`}>
                {data ? (
                    <>
                        <img src={data.img} className={`w-full h-full object-cover object-top ${type === 'ban' ? 'grayscale opacity-60' : ''}`} />
                        {type === 'ban' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <X size={16} className="text-red-500"/>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                        <span className="text-gray-700 text-[8px]">-</span>
                    </div>
                )}
            </div>
            <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-wider ${labelColor}`}>
                {type}
            </span>
        </div>
    );
}

// --- VISUAL BRACKET COMPONENTS ---

const MatchCardSmall: React.FC<{ 
    match: TournamentMatch, 
    teamA?: TournamentTeam, 
    teamB?: TournamentTeam,
    onStart: (id: string) => void 
}> = ({ match, teamA, teamB, onStart }) => {
    const isFinished = match.status === 'finished';
    const isLive = match.status === 'live' || match.status === 'veto';
    
    return (
        <div 
            onClick={() => !isFinished && onStart(match.id)}
            className={`
                relative h-[60px] flex items-center justify-between px-3 
                bg-gray-950 border border-gray-800 rounded-md
                ${!isFinished ? 'hover:border-brand-500 cursor-pointer' : 'opacity-80'}
                transition-all group overflow-hidden
            `}
        >
            {/* Status Line */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${isFinished ? 'bg-gray-700' : isLive ? 'bg-red-500 animate-pulse' : 'bg-brand-500'}`}></div>

            {/* Team A */}
            <div className="flex items-center gap-2 w-[40%]">
                <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center shrink-0 border border-gray-800 overflow-hidden">
                    {teamA?.logo ? <img src={teamA.logo} className="w-full h-full object-cover"/> : <span className="text-[8px] font-bold">{teamA?.name[0]}</span>}
                </div>
                <span className={`text-[10px] font-bold truncate ${match.winnerId === teamA?.id ? 'text-brand-500' : 'text-gray-300'}`}>{teamA?.name}</span>
            </div>

            {/* VS/Score */}
            <div className="flex items-center justify-center gap-1 w-[20%]">
                {isFinished ? (
                    <>
                        <span className={`text-xs font-black ${match.winnerId === teamA?.id ? 'text-brand-500' : 'text-gray-500'}`}>{match.winnerId === teamA?.id ? '1' : '0'}</span>
                        <span className="text-[8px] text-gray-700">-</span>
                        <span className={`text-xs font-black ${match.winnerId === teamB?.id ? 'text-brand-500' : 'text-gray-500'}`}>{match.winnerId === teamB?.id ? '1' : '0'}</span>
                    </>
                ) : (
                    <span className="text-[8px] font-bold text-gray-600 bg-gray-900 px-1 rounded">VS</span>
                )}
            </div>

            {/* Team B */}
            <div className="flex items-center justify-end gap-2 w-[40%]">
                <span className={`text-[10px] font-bold truncate text-right ${match.winnerId === teamB?.id ? 'text-brand-500' : 'text-gray-300'}`}>{teamB?.name}</span>
                <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center shrink-0 border border-gray-800 overflow-hidden">
                    {teamB?.logo ? <img src={teamB.logo} className="w-full h-full object-cover"/> : <span className="text-[8px] font-bold">{teamB?.name[0]}</span>}
                </div>
            </div>
        </div>
    );
}

const PicksBans: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');
  const [hasSaved, setHasSaved] = useState(false);
  
  // Single Match State
  const [mode, setMode] = useState<DraftMode>('snake');
  const [format, setFormat] = useState(3); // MD3 by default
  const [rounds, setRounds] = useState(13);
  const [drawRule, setDrawRule] = useState<MapDrawType>('no-repeat');
  const [maps, setMaps] = useState<string[]>([]);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [history, setHistory] = useState<MatchRecord[]>([]);
  const [teamA, setTeamA] = useState('TIME A');
  const [teamB, setTeamB] = useState('TIME B');
  const [stepIndex, setStepIndex] = useState(0);
  const [bans, setBans] = useState<{A: string|null, B: string|null}>({A: null, B: null});
  const [picksA, setPicksA] = useState<string[]>([]);
  const [picksB, setPicksB] = useState<string[]>([]);
  const [timer, setTimer] = useState(30);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<{ team: 'A' | 'B', type: 'ban' | 'pick', index?: number } | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultTab, setResultTab] = useState<'score' | 'stats'>('score');
  const [editingMatchIndex, setEditingMatchIndex] = useState<number | null>(null);
  const [tempResult, setTempResult] = useState<{
      winner: Winner,
      scoreA: number,
      scoreB: number,
      bans: { A: string | null, B: string | null },
      picks: { A: string[], B: string[] },
      playerStats: Record<string, PlayerStats>
  }>({ 
      winner: 'A' as Winner, scoreA: 0, scoreB: 0, 
      bans: { A: null, B: null }, 
      picks: { A: [], B: [] },
      playerStats: {} 
  });
  const [editCharSelector, setEditCharSelector] = useState<{ team: 'A' | 'B', type: 'ban' | 'pick', index?: number } | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // --- TOURNAMENT STATE ---
  const [tournament, setTournament] = useState<TournamentState>({
      name: '', stage: 'swiss', currentRound: 1, teams: [], matches: [], activeMatchId: null
  });
  const [newTeamInput, setNewTeamInput] = useState<{name: string, logo: string, players: string[]}>({ name: '', logo: '', players: Array(6).fill('') });
  const [hubTab, setHubTab] = useState<'bracket' | 'list' | 'mvp'>('bracket'); 
  const [mapVetoState, setMapVetoState] = useState<{
      phase: 'ban' | 'pick', 
      turn: 'A' | 'B', 
      bannedMaps: string[], 
      pickedMaps: string[], // In order of play
      steps: { type: 'ban'|'pick', team: 'A'|'B' }[] 
  } | null>(null);

  useEffect(() => { const saved = localStorage.getItem('pb_session'); if (saved) setHasSaved(true); }, []);
  
  // --- HELPERS ---
  const getOrder = () => {
      const base = ORDERS[mode] || ORDERS['snake']; // Fallback
      if (currentMatch % 2 !== 0) return base.map(s => ({ ...s, team: s.team === 'A' ? 'B' : 'A' }));
      return base;
  };
  const order = getOrder();
  const currentStep = order[stepIndex] || order[order.length-1]; // Fallback
  const isComplete = stepIndex >= order.length;

  useEffect(() => {
      if (view === 'draft' && !isComplete && timer > 0) {
          const interval = setInterval(() => setTimer(t => t - 1), 1000);
          return () => clearInterval(interval);
      }
  }, [view, stepIndex, timer]);

  // --- ACTIONS ---

  const saveSession = () => {
      // Save logic mostly for quick match, tournament saves separately
      if (!tournament.name) {
        localStorage.setItem('pb_session', JSON.stringify({
            view, mode, format, rounds, drawRule, maps, currentMatch, history, teamA, teamB, stepIndex, bans, picksA, picksB
        }));
        setHasSaved(true);
      }
  };

  const loadSession = () => {
      const saved = localStorage.getItem('pb_session');
      if (saved) {
          try {
              const data = JSON.parse(saved);
              setView(data.view || 'home'); 
              setMode(data.mode || 'snake'); 
              setFormat(data.format || 3); 
              setRounds(data.rounds || 13);
              setDrawRule(data.drawRule || 'no-repeat'); 
              setMaps(data.maps || []); 
              setCurrentMatch(data.currentMatch || 0);
              setHistory(data.history || []); 
              setTeamA(data.teamA || 'TIME A'); 
              setTeamB(data.teamB || 'TIME B');
              setStepIndex(data.stepIndex || 0); 
              setBans(data.bans || {A:null, B:null}); 
              setPicksA(data.picksA || []); 
              setPicksB(data.picksB || []);
          } catch (e) {
              console.error("Failed to load session", e);
              localStorage.removeItem('pb_session');
          }
      }
  };

  const resetAll = () => {
      if(confirm('Iniciar novo apagará o progresso atual.')) {
          localStorage.removeItem('pb_session');
          setHasSaved(false); setView('home'); setStepIndex(0); setBans({A:null, B:null}); setPicksA([]); setPicksB([]); setHistory([]); setCurrentMatch(0);
          setTournament({ name: '', stage: 'swiss', currentRound: 1, teams: [], matches: [], activeMatchId: null });
      }
  };

  // --- DRAFT LOGIC ---

  const handlePick = (char: string) => {
      if (isComplete) return;
      if (bans.A === char || bans.B === char || picksA.includes(char) || picksB.includes(char)) { alert("Personagem já selecionado ou banido."); return; }
      const step = order[stepIndex];
      if (step.type === 'ban') setBans(prev => ({ ...prev, [step.team]: char }));
      else { if (step.team === 'A') setPicksA(prev => [...prev, char]); else setPicksB(prev => [...prev, char]); }
      setStepIndex(prev => prev + 1); setSearchTerm(''); setTimer(30); saveSession();
  };

  const handleManualUpdate = (char: string, team: 'A' | 'B', type: 'ban' | 'pick', index?: number) => {
    if (showResultModal && editingMatchIndex !== null) {
        setTempResult(prev => {
            const newBans = { ...prev.bans }; const newPicksA = [...prev.picks.A]; const newPicksB = [...prev.picks.B];
            if (type === 'ban') newBans[team] = char;
            else if (type === 'pick' && typeof index === 'number') { if (team === 'A') newPicksA[index] = char; else newPicksB[index] = char; }
            return { ...prev, bans: newBans, picks: { A: newPicksA, B: newPicksB } };
        });
        setEditCharSelector(null); return;
    }
    if (bans.A === char || bans.B === char || picksA.includes(char) || picksB.includes(char)) { alert("Personagem já selecionado ou banido."); return; }
    if (type === 'ban') setBans(prev => ({ ...prev, [team]: char }));
    else if (type === 'pick' && typeof index === 'number') {
        if (team === 'A') { const newPicks = [...picksA]; newPicks[index] = char; setPicksA(newPicks); }
        else { const newPicks = [...picksB]; newPicks[index] = char; setPicksB(newPicks); }
    }
    if (!isComplete) {
        const step = order[stepIndex]; let isCurrentStep = false;
        if (step.team === team && step.type === type) {
            if (type === 'pick') { const currentCount = team === 'A' ? picksA.length : picksB.length; if (index === currentCount) isCurrentStep = true; } 
            else isCurrentStep = true;
        }
        if (isCurrentStep) { setStepIndex(prev => prev + 1); setTimer(30); }
    }
    saveSession(); setModalOpen(false);
  };

  const undo = () => {
      if (stepIndex === 0) return;
      const prevStep = order[stepIndex - 1];
      if (prevStep.type === 'ban') setBans(prev => ({ ...prev, [prevStep.team]: null }));
      else { if (prevStep.team === 'A') setPicksA(prev => prev.slice(0, -1)); else setPicksB(prev => prev.slice(0, -1)); }
      setStepIndex(prev => prev - 1); setTimer(30);
  };

  const startDraft = () => { setStepIndex(0); setBans({A: null, B: null}); setPicksA([]); setPicksB([]); setTimer(30); setView('draft'); };
  
  const drawMaps = () => {
      let pool = [...MAPS_DB]; let selected: string[] = [];
      for (let i = 0; i < format; i++) {
          if (pool.length === 0) pool = [...MAPS_DB];
          const rand = Math.floor(Math.random() * pool.length); selected.push(pool[rand].name);
          if (drawRule === 'no-repeat') pool.splice(rand, 1);
      }
      setMaps(selected); setView('maps');
  };

  // --- TOURNAMENT LOGIC ---

  const addTournamentTeam = () => {
      if (!newTeamInput.name) return;
      // Filter out empty player names
      const validPlayers = newTeamInput.players.filter(p => p.trim() !== '').map(p => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          name: p.trim()
      }));

      const newTeam: TournamentTeam = {
          id: Date.now().toString(),
          name: newTeamInput.name,
          logo: newTeamInput.logo || null,
          players: validPlayers,
          stats: { wins: 0, losses: 0, matchesPlayed: 0 }
      };
      setTournament(prev => ({ ...prev, teams: [...prev.teams, newTeam] }));
      setNewTeamInput({ name: '', logo: '', players: Array(6).fill('') });
  };

  const updateNewTeamPlayer = (index: number, val: string) => {
      const newPlayers = [...newTeamInput.players];
      newPlayers[index] = val;
      setNewTeamInput(prev => ({ ...prev, players: newPlayers }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (ev) => setNewTeamInput(prev => ({ ...prev, logo: ev.target?.result as string }));
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  const generateSwissPairings = () => {
      const teams = [...tournament.teams];
      if (tournament.currentRound === 1) {
          teams.sort(() => Math.random() - 0.5);
      } else {
          teams.sort((a,b) => b.stats.wins - a.stats.wins);
      }

      const newMatches: TournamentMatch[] = [];
      for (let i = 0; i < teams.length; i += 2) {
          if (i + 1 < teams.length) {
              newMatches.push({
                  id: `R${tournament.currentRound}-M${i/2}`,
                  round: tournament.currentRound,
                  teamAId: teams[i].id,
                  teamBId: teams[i+1].id,
                  format: 1, // MD1 for Group
                  winnerId: null,
                  maps: [],
                  scores: [],
                  status: 'scheduled'
              });
          }
      }
      setTournament(prev => ({ ...prev, matches: [...prev.matches, ...newMatches] }));
  };

  const startTournamentMatch = (matchId: string) => {
      const match = tournament.matches.find(m => m.id === matchId);
      if (!match) return;
      
      const teamAObj = tournament.teams.find(t => t.id === match.teamAId);
      const teamBObj = tournament.teams.find(t => t.id === match.teamBId);
      
      setTeamA(teamAObj?.name || 'TIME A');
      setTeamB(teamBObj?.name || 'TIME B');
      setFormat(match.format);
      setTournament(prev => ({ ...prev, activeMatchId: matchId }));
      
      let vetoSteps: { type: 'ban'|'pick', team: 'A'|'B' }[] = [];
      if (match.format === 1) {
          vetoSteps = [
              {type: 'ban', team: 'A'}, {type: 'ban', team: 'B'},
              {type: 'ban', team: 'A'}, {type: 'ban', team: 'B'},
              {type: 'ban', team: 'A'}, {type: 'pick', team: 'B'} 
          ];
      } else if (match.format === 3) {
          vetoSteps = [
              {type: 'ban', team: 'A'}, {type: 'ban', team: 'B'},
              {type: 'pick', team: 'A'}, {type: 'pick', team: 'B'},
              {type: 'ban', team: 'A'}, {type: 'ban', team: 'B'},
              {type: 'pick', team: 'A'} 
          ];
      }

      setMapVetoState({
          phase: 'ban',
          turn: 'A',
          bannedMaps: [],
          pickedMaps: [],
          steps: vetoSteps
      });
      
      setView('map_veto');
  };

  const handleMapAction = (mapName: string) => {
      if (!mapVetoState) return;
      
      const step = mapVetoState.steps[0];
      let newBans = [...mapVetoState.bannedMaps];
      let newPicks = [...mapVetoState.pickedMaps];
      
      if (step.type === 'ban') {
          newBans.push(mapName);
      } else {
          newPicks.push(mapName);
      }

      const nextSteps = mapVetoState.steps.slice(1);
      
      if (nextSteps.length === 0) {
          if (format === 1 && newPicks.length === 0) {
              const remaining = MAPS_DB.map(m => m.name).find(m => !newBans.includes(m));
              if (remaining) newPicks.push(remaining);
          }
          if (format === 3 && newPicks.length < 3) {
               const remaining = MAPS_DB.map(m => m.name).find(m => !newBans.includes(m) && !newPicks.includes(m));
               if (remaining) newPicks.push(remaining);
          }

          setMaps(newPicks);
          
          setTournament(prev => ({
              ...prev,
              matches: prev.matches.map(m => m.id === prev.activeMatchId ? { ...m, maps: newPicks, status: 'live' } : m)
          }));
          
          setHistory([]);
          setCurrentMatch(0);
          startDraft(); 
      } else {
          setMapVetoState({
              ...mapVetoState,
              bannedMaps: newBans,
              pickedMaps: newPicks,
              steps: nextSteps,
              turn: nextSteps[0].team
          });
      }
  };

  // --- RESULT LOGIC ---

  const openResultModal = (isEditing = false, index: number | null = null) => {
      setResultTab('score'); // Reset tab
      if (isEditing && index !== null) {
          const record = history[index];
          setTempResult({ 
              winner: record.winner, 
              scoreA: record.scoreA, 
              scoreB: record.scoreB, 
              bans: record.bans, 
              picks: record.picks,
              playerStats: record.playerStats || {}
          });
          setEditingMatchIndex(index);
      } else {
          setTempResult({ 
              winner: null, 
              scoreA: 0, 
              scoreB: 0, 
              bans, 
              picks: { A: picksA, B: picksB },
              playerStats: {}
          });
          setEditingMatchIndex(null);
      }
      setShowResultModal(true);
  };

  const updatePlayerStat = (playerId: string, field: keyof PlayerStats, val: number) => {
      setTempResult(prev => ({
          ...prev,
          playerStats: {
              ...prev.playerStats,
              [playerId]: {
                  ...(prev.playerStats[playerId] || { kills: 0, assists: 0, damage: 0 }),
                  [field]: val
              }
          }
      }));
  };

  const finalizeMatch = () => {
      if (!tempResult.winner) {
          alert("Por favor, selecione o time vencedor.");
          return;
      }

      const record: MatchRecord = { 
          matchIndex: currentMatch + 1, 
          map: maps[currentMatch], 
          mode, 
          bans: tempResult.bans, 
          picks: tempResult.picks, 
          rounds, 
          winner: tempResult.winner, 
          scoreA: tempResult.scoreA, 
          scoreB: tempResult.scoreB, 
          orderSnapshot: order,
          playerStats: tempResult.playerStats 
      };

      let newHistory = [...history];
      if (editingMatchIndex !== null) {
          newHistory[editingMatchIndex] = record;
          setEditingMatchIndex(null);
      } else {
          newHistory.push(record);
      }
      setHistory(newHistory);
      setShowResultModal(false);
          
      // Check if Series is Over
      const winsA = newHistory.filter(r => r.winner === 'A').length; 
      const winsB = newHistory.filter(r => r.winner === 'B').length; 
      const needed = Math.ceil(format / 2);
          
      if (winsA >= needed || winsB >= needed || newHistory.length === format) {
          if (tournament.activeMatchId) {
              // Finalize Tournament Match and Save Stats
              const matchWinnerId = winsA > winsB ? 
                  tournament.matches.find(m => m.id === tournament.activeMatchId)?.teamAId : 
                  tournament.matches.find(m => m.id === tournament.activeMatchId)?.teamBId;

              // Aggregate stats from history into the match object
              const aggregatedSeriesStats: Record<string, PlayerStats> = {};
              newHistory.forEach(h => {
                  if (h.playerStats) {
                      Object.entries(h.playerStats).forEach(([pid, val]) => {
                          if (!val) return; // Add check to prevent crashes if val is null
                          const stats = val as PlayerStats;
                          if (!aggregatedSeriesStats[pid]) aggregatedSeriesStats[pid] = { kills: 0, assists: 0, damage: 0 };
                          aggregatedSeriesStats[pid].kills += stats.kills;
                          aggregatedSeriesStats[pid].assists += stats.assists;
                          aggregatedSeriesStats[pid].damage += stats.damage;
                      });
                  }
              });

              setTournament(prev => {
                  const updatedMatches = prev.matches.map(m => m.id === prev.activeMatchId ? { 
                      ...m, 
                      status: 'finished', 
                      winnerId: matchWinnerId || null,
                      seriesStats: aggregatedSeriesStats // Save aggregated stats
                  } : m);
                  
                  const updatedTeams = prev.teams.map(t => {
                      if (t.id === matchWinnerId) return { ...t, stats: { ...t.stats, wins: t.stats.wins + 1, matchesPlayed: t.stats.matchesPlayed + 1 } };
                      const match = prev.matches.find(m => m.id === prev.activeMatchId);
                      const loserId = match?.teamAId === matchWinnerId ? match?.teamBId : match?.teamAId;
                      if (t.id === loserId) return { ...t, stats: { ...t.stats, losses: t.stats.losses + 1, matchesPlayed: t.stats.matchesPlayed + 1 } };
                      return t;
                  });
                  
                  return { ...prev, matches: updatedMatches as TournamentMatch[], teams: updatedTeams, activeMatchId: null };
              });
              setView('tournament_hub');
          } else {
              setView('result'); 
          }
      } else { 
          setCurrentMatch(prev => prev + 1); 
          setStepIndex(0); setBans({A:null, B:null}); setPicksA([]); setPicksB([]); setTimer(30); 
          setView('draft'); 
      }
      
      saveSession();
  };

  const onDragStart = (e: React.DragEvent, charName: string) => e.dataTransfer.setData("char", charName);
  const onDropSlot = (e: React.DragEvent, team: 'A'|'B', type: 'ban'|'pick', index?: number) => { e.preventDefault(); const char = e.dataTransfer.getData("char"); if (char) handleManualUpdate(char, team, type, index); };
  const onSlotClick = (team: 'A'|'B', type: 'ban'|'pick', index?: number) => { setActiveSlot({ team, type, index }); setSearchTerm(''); setModalOpen(true); };
  const activeCharacters = CHARACTERS_DB.filter(c => c.type === 'Active');
  const filteredCharacters = activeCharacters.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // --- RENDERERS ---
  if (view === 'home') {
      return (
          <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-fade-in px-4">
              <div className="text-center space-y-2">
                  <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-600 uppercase tracking-tighter">Picks & Bans</h1>
                  <p className="text-gray-500 text-lg uppercase tracking-widest font-medium">Simulador Competitivo Premium</p>
              </div>
              {hasSaved && (
                  <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl flex items-center gap-4 shadow-2xl">
                      <div className="h-10 w-10 bg-brand-500 rounded-full flex items-center justify-center text-black font-bold">!</div>
                      <div className="text-left"><p className="text-white font-bold text-sm">Sessão Encontrada</p><p className="text-xs text-gray-500">Deseja continuar o draft anterior?</p></div>
                      <div className="flex gap-2"><button onClick={resetAll} className="px-3 py-2 text-xs font-bold text-red-500 hover:text-red-400">Descartar</button><button onClick={loadSession} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-bold text-white transition-colors">Continuar</button></div>
                  </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                  <button onClick={() => setView('mode')} className="group relative overflow-hidden bg-gray-950 border border-gray-800 rounded-3xl p-8 hover:border-brand-500 transition-all duration-500 hover:shadow-[0_0_30px_rgba(234,179,8,0.1)]">
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black opacity-50"></div>
                      <div className="relative z-10 flex flex-col items-start"><div className="p-3 bg-gray-900 rounded-2xl mb-4 text-brand-500 border border-gray-800 group-hover:scale-110 transition-transform"><Sword size={32} /></div><h2 className="text-2xl font-black text-white mb-1 uppercase">Partida Rápida</h2><p className="text-sm text-gray-500">Draft avulso MD3, MD5 ou MD7.</p></div>
                  </button>
                  <button onClick={() => setView('tournament_setup')} className="group relative overflow-hidden bg-gray-950 border border-gray-800 rounded-3xl p-8 hover:border-blue-500 transition-all duration-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black opacity-50"></div>
                      <div className="relative z-10 flex flex-col items-start"><div className="p-3 bg-gray-900 rounded-2xl mb-4 text-blue-500 border border-gray-800 group-hover:scale-110 transition-transform"><Trophy size={32} /></div><h2 className="text-2xl font-black text-white mb-1 uppercase">Criar Campeonato</h2><p className="text-sm text-gray-500">Qualificatórias, Fase de Grupos e Playoffs.</p></div>
                  </button>
              </div>
          </div>
      );
  }

  // --- RESTORED MODE VIEW ---
  if (view === 'mode') {
      return (
          <div className="max-w-4xl mx-auto py-10 px-4 animate-fade-in space-y-8 text-center">
              <button onClick={() => setView('home')} className="absolute top-24 left-4 md:left-20 p-2 text-gray-500 hover:text-white flex items-center gap-2">
                  <ChevronLeft /> Voltar
              </button>
              
              <h2 className="text-3xl font-black uppercase mb-8">Configuração da Partida</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {/* Draft Mode Selection */}
                  <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                      <h3 className="text-brand-500 font-bold uppercase mb-4 text-sm">Modo de Draft</h3>
                      <div className="flex flex-col gap-2">
                          {['snake', 'linear', 'mirrored'].map((m) => (
                              <button 
                                key={m}
                                onClick={() => setMode(m as DraftMode)}
                                className={`py-3 rounded-lg font-bold uppercase text-xs border-2 transition-all ${mode === m ? 'border-brand-500 bg-brand-500/10 text-brand-500' : 'border-gray-800 bg-gray-950 text-gray-500 hover:border-gray-600'}`}
                              >
                                  {m}
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Format Selection */}
                  <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                      <h3 className="text-brand-500 font-bold uppercase mb-4 text-sm">Formato (Mapas)</h3>
                      <div className="grid grid-cols-2 gap-2">
                          {[1, 3, 5, 7].map((f) => (
                              <button 
                                key={f}
                                onClick={() => setFormat(f)}
                                className={`py-3 rounded-lg font-bold uppercase text-xs border-2 transition-all ${format === f ? 'border-blue-500 bg-blue-500/10 text-blue-500' : 'border-gray-800 bg-gray-950 text-gray-500 hover:border-gray-600'}`}
                              >
                                  MD{f}
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Map Rules */}
                  <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                      <h3 className="text-brand-500 font-bold uppercase mb-4 text-sm">Sorteio de Mapas</h3>
                      <div className="flex flex-col gap-2">
                          <button onClick={() => setDrawRule('no-repeat')} className={`py-3 rounded-lg font-bold uppercase text-xs border-2 transition-all ${drawRule === 'no-repeat' ? 'border-green-500 bg-green-500/10 text-green-500' : 'border-gray-800 bg-gray-950 text-gray-500'}`}>Sem Repetição</button>
                          <button onClick={() => setDrawRule('repeat')} className={`py-3 rounded-lg font-bold uppercase text-xs border-2 transition-all ${drawRule === 'repeat' ? 'border-green-500 bg-green-500/10 text-green-500' : 'border-gray-800 bg-gray-950 text-gray-500'}`}>Permitir Repetição</button>
                      </div>
                  </div>
              </div>

              <button onClick={drawMaps} className="bg-brand-500 hover:bg-brand-600 text-gray-900 px-10 py-4 rounded-xl font-black text-xl shadow-lg hover:shadow-brand-500/20 transition-all uppercase">
                  Sortear Mapas & Avançar
              </button>
          </div>
      );
  }

  // --- RESTORED MAPS VIEW ---
  if (view === 'maps') {
      return (
          <div className="max-w-5xl mx-auto py-10 px-4 animate-fade-in text-center">
              <button onClick={() => setView('mode')} className="absolute top-24 left-4 md:left-20 p-2 text-gray-500 hover:text-white flex items-center gap-2">
                  <ChevronLeft /> Voltar
              </button>

              <h2 className="text-3xl font-black uppercase mb-2">Mapas Definidos</h2>
              <p className="text-gray-500 mb-8 font-bold">Ordem dos mapas para a série MD{format}</p>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
                  {maps.map((mapName, idx) => {
                      const mapData = MAPS_DB.find(m => m.name === mapName);
                      return (
                          <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border-2 border-gray-800 group hover:border-brand-500 transition-colors">
                              <img src={mapData?.img} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                                  <span className="text-xs text-gray-400 font-bold uppercase mb-1">Mapa {idx + 1}</span>
                                  <span className="text-xl font-black text-white uppercase drop-shadow-lg">{mapName}</span>
                              </div>
                          </div>
                      )
                  })}
              </div>

              <div className="flex gap-4 justify-center">
                  <button onClick={drawMaps} className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2">
                      <RefreshCw size={18} /> Rodar Novamente
                  </button>
                  <button onClick={startDraft} className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg animate-pulse">
                      <Play size={18} fill="currentColor" /> Iniciar Draft
                  </button>
              </div>
          </div>
      );
  }

  // --- MAP VETO VIEW (Relative container instead of Fixed Overlay) ---
  if (view === 'map_veto') {
      const activeStep = mapVetoState?.steps[0];
      if (!mapVetoState || !activeStep) return null;

      const activeTeamName = activeStep.team === 'A' ? teamA : teamB;
      const isPick = activeStep.type === 'pick';

      return (
          <div className="w-full min-h-[80vh] bg-gray-950 flex flex-col items-center justify-center animate-fade-in overflow-hidden relative rounded-xl border border-gray-800 shadow-2xl">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
              
              <div className="z-10 text-center mb-10 pt-10">
                  <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Fase de Mapas</h2>
                  <div className={`inline-block px-6 py-2 rounded-full font-bold text-xl uppercase animate-pulse border-2 ${activeStep.team === 'A' ? 'bg-teamA/20 border-teamA text-teamA' : 'bg-teamB/20 border-teamB text-teamB'}`}>
                      Vez de {activeTeamName}: {isPick ? 'ESCOLHER' : 'BANIR'}
                  </div>
              </div>

              <div className="z-10 grid grid-cols-3 gap-6 max-w-6xl w-full px-10">
                  {MAPS_DB.map(map => {
                      const isBanned = mapVetoState.bannedMaps.includes(map.name);
                      const isPicked = mapVetoState.pickedMaps.includes(map.name);
                      
                      return (
                          <button 
                            key={map.name}
                            disabled={isBanned || isPicked}
                            onClick={() => handleMapAction(map.name)}
                            className={`relative aspect-video rounded-xl overflow-hidden border-4 transition-all group ${
                                isBanned ? 'border-red-900 grayscale opacity-40 cursor-not-allowed' :
                                isPicked ? 'border-green-500 opacity-100 ring-4 ring-green-500/30' :
                                'border-gray-800 hover:scale-105 cursor-pointer hover:border-white'
                            }`}
                          >
                              <img src={map.img} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <span className="text-2xl font-black text-white uppercase drop-shadow-lg">{map.name}</span>
                              </div>
                              {isBanned && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><X size={64} className="text-red-500"/></div>}
                              {isPicked && <div className="absolute inset-0 flex items-center justify-center bg-green-500/20"><CheckCircle size={64} className="text-green-500"/></div>}
                          </button>
                      );
                  })}
              </div>

              {/* Status Footer */}
              <div className="flex justify-center gap-10 z-10 w-full mt-10 pb-10">
                  <div className="bg-gray-900 border border-gray-800 px-6 py-3 rounded-xl">
                      <span className="text-red-500 font-bold uppercase text-xs block mb-1">Banidos</span>
                      <div className="flex gap-2">
                          {mapVetoState.bannedMaps.map(m => <span key={m} className="bg-gray-800 px-2 rounded text-xs text-gray-400">{m}</span>)}
                          {mapVetoState.bannedMaps.length === 0 && <span className="text-gray-600 text-xs">-</span>}
                      </div>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 px-6 py-3 rounded-xl">
                      <span className="text-green-500 font-bold uppercase text-xs block mb-1">Escolhidos</span>
                      <div className="flex gap-2">
                          {mapVetoState.pickedMaps.map(m => <span key={m} className="bg-gray-800 px-2 rounded text-xs text-white font-bold">{m}</span>)}
                          {mapVetoState.pickedMaps.length === 0 && <span className="text-gray-600 text-xs">-</span>}
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // --- DRAFT/MATCH VIEW (Relative container instead of Fixed Overlay) ---
  if (view === 'draft') {
      return (
          <div className="flex flex-col w-full min-h-[85vh] bg-gray-950 text-white animate-fade-in select-none overflow-hidden relative rounded-xl border border-gray-800 shadow-2xl">
              {/* Header */}
              <div className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 z-20 shrink-0">
                  <div className="flex items-center gap-3 w-1/3">
                      <button onClick={() => setView(tournament.name ? 'tournament_hub' : 'maps')} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                          <ChevronLeft size={18}/> <span className="hidden md:inline text-xs font-bold">VOLTAR</span>
                      </button>
                      <button 
                        onClick={() => setShowHelp(true)} 
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg text-xs font-bold transition-colors border border-gray-700 hover:border-gray-500"
                      >
                          <HelpCircle size={14}/>
                          INSTRUÇÕES
                      </button>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center w-1/3">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden md:block">MAPA {currentMatch + 1}</div>
                      <div className="text-base md:text-lg font-black text-white uppercase tracking-wider text-brand-500">{maps[currentMatch]}</div>
                  </div>
                  
                  <div className="flex items-center gap-4 w-1/3 justify-end">
                      <div className="flex items-center gap-4 bg-black/30 px-3 py-1 rounded-lg border border-gray-800">
                          <span className="text-teamA font-bold">{teamA}: <span className="text-white">{history.filter(h => h.winner === 'A').length}</span></span>
                          <span className="text-gray-600">|</span>
                          <span className="text-teamB font-bold">{teamB}: <span className="text-white">{history.filter(h => h.winner === 'B').length}</span></span>
                      </div>
                      
                      <div className="flex gap-1 ml-2">
                          <button onClick={undo} disabled={stepIndex === 0} className="p-2 bg-gray-800 rounded hover:bg-gray-700 text-gray-400 disabled:opacity-30 transition-colors" title="Desfazer">
                              <RotateCcw size={16}/>
                          </button>
                          {!isComplete && (
                              <button onClick={() => openResultModal(false)} className="px-3 py-1.5 bg-green-900/50 hover:bg-green-800 border border-green-800 hover:border-green-600 text-green-200 rounded font-bold text-[10px] transition-all">
                                  FINALIZAR
                              </button>
                          )}
                      </div>
                  </div>
              </div>

              {/* ... Broadcast Strip and Char Pool (Same as before) ... */}
              <div className="h-[120px] md:h-[140px] bg-black border-b-2 border-gray-800 shrink-0 relative z-40 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
                  <div className="h-full w-full max-w-[1800px] mx-auto grid grid-cols-[1fr_160px_1fr] gap-2 px-2 items-center pb-2 pt-2">
                      <div className="flex gap-1 h-[90%] w-full">
                          <div className="w-[18%]"><BroadcastDraftSlot type="ban" team="A" charName={bans.A} isActive={!isComplete && currentStep.team === 'A' && currentStep.type === 'ban'} onClick={() => onSlotClick('A', 'ban')} onDrop={e => onDropSlot(e, 'A', 'ban')} /></div>
                          {Array.from({length: 4}).map((_, i) => (<div key={i} className="flex-1"><BroadcastDraftSlot type="pick" team="A" charName={picksA[i] || null} isActive={!isComplete && currentStep.team === 'A' && currentStep.type === 'pick' && picksA.length === i} onClick={() => onSlotClick('A', 'pick', i)} onDrop={e => onDropSlot(e, 'A', 'pick', i)} /></div>))}
                      </div>
                      <div className="h-full flex flex-col justify-center items-center">
                          {!isComplete ? (
                              <div className="text-center"><div className="flex items-center justify-center gap-2 mb-1">{currentStep.team === 'A' && <ArrowRight className="rotate-180 text-teamA animate-pulse" size={20} strokeWidth={4} />}<span className={`text-3xl font-black tabular-nums tracking-tighter ${timer < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timer}</span>{currentStep.team === 'B' && <ArrowRight className="text-teamB animate-pulse" size={20} strokeWidth={4} />}</div><div className={`px-3 py-0.5 rounded font-black text-sm uppercase tracking-widest ${currentStep.type === 'ban' ? 'bg-red-600 text-white' : 'bg-brand-500 text-black'}`}>{currentStep.type}</div></div>
                          ) : (<button onClick={() => openResultModal(false)} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-black text-sm shadow-lg animate-pulse uppercase">FINALIZAR</button>)}
                      </div>
                      <div className="flex gap-1 h-[90%] w-full">
                          {Array.from({length: 4}).map((_, i) => (<div key={i} className="flex-1"><BroadcastDraftSlot type="pick" team="B" charName={picksB[i] || null} isActive={!isComplete && currentStep.team === 'B' && currentStep.type === 'pick' && picksB.length === i} onClick={() => onSlotClick('B', 'pick', i)} onDrop={e => onDropSlot(e, 'B', 'pick', i)} /></div>))}
                          <div className="w-[18%]"><BroadcastDraftSlot type="ban" team="B" charName={bans.B} isActive={!isComplete && currentStep.team === 'B' && currentStep.type === 'ban'} onClick={() => onSlotClick('B', 'ban')} onDrop={e => onDropSlot(e, 'B', 'ban')} /></div>
                      </div>
                  </div>
              </div>

              {/* Character Pool */}
              <div className="flex-1 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-gray-950 flex flex-col items-center overflow-hidden">
                  
                  {/* Search Bar */}
                  <div className="w-full max-w-md mx-auto px-6 py-4 shrink-0 z-30">
                      <div className="relative flex items-center bg-gray-900 rounded-full border border-gray-700 shadow-lg group focus-within:border-brand-500 transition-all">
                          <Search size={16} className="ml-4 text-gray-500 group-focus-within:text-brand-500" />
                          <input 
                              type="text" 
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              placeholder="BUSCAR PERSONAGEM..." 
                              className="w-full bg-transparent border-none text-white text-xs font-bold py-2.5 px-3 focus:ring-0 outline-none placeholder-gray-600 uppercase tracking-widest"
                          />
                          {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="mr-3 p-1 rounded-full hover:bg-gray-800 text-gray-500 hover:text-white transition-colors">
                                <X size={14} />
                            </button>
                          )}
                      </div>
                  </div>

                  {/* Scrollable Grid */}
                  <div className="w-full overflow-y-auto custom-scrollbar flex-1 p-4 pt-0 pb-20">
                      <div className="grid grid-cols-10 md:grid-cols-12 lg:grid-cols-14 gap-1 w-full max-w-[1600px] mx-auto">
                          {filteredCharacters.map(char => {
                              const picked = picksA.includes(char.name) || picksB.includes(char.name); const banned = bans.A === char.name || bans.B === char.name; const disabled = picked || banned;
                              return (
                                  <div key={char.name} draggable={!disabled && !isComplete} onDragStart={(e) => onDragStart(e, char.name)} onClick={() => !disabled && handlePick(char.name)} className={`relative aspect-[3/4] rounded overflow-hidden border transition-all cursor-pointer group ${disabled ? (banned ? 'border-red-900/50 grayscale' : 'border-green-500/50') : 'border-gray-800 bg-gray-900 hover:border-brand-500 hover:scale-110 hover:z-20 shadow-lg'}`}>
                                      <img src={char.img} className={`w-full h-full object-cover object-top transition-opacity ${picked ? 'opacity-70' : ''}`} loading="lazy" draggable={false}/>
                                      <div className="absolute bottom-0 inset-x-0 bg-black/90 py-0.5 px-0.5 border-t border-white/10 z-30"><p className="text-white font-black text-[7px] md:text-[8px] text-center uppercase truncate">{char.name}</p></div>
                                      {banned && (<div className="absolute inset-0 bg-red-900/20 z-20 flex items-center justify-center"><X className="text-red-500 w-6 h-6 opacity-80"/></div>)}
                                      {picked && (<div className="absolute top-0.5 right-0.5 bg-green-500/80 rounded-full p-0.5 z-20 shadow-sm"><CheckCircle className="text-white w-2 h-2"/></div>)}
                                  </div>
                              )
                          })}
                      </div>
                  </div>
              </div>

              {/* Modals remain mostly the same, ensuring z-index is correct */}
              {modalOpen && activeSlot && (
                  <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in p-4">
                      <div className="bg-gray-900 border border-gray-700 rounded-3xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                          <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900">
                              <div><h3 className="text-xl font-black uppercase text-white flex items-center gap-2">{activeSlot.type === 'ban' ? <X className="text-red-500"/> : <CheckCircle className="text-green-500"/>} Selecionar {activeSlot.type === 'ban' ? 'Banimento' : 'Pick'} - {activeSlot.team === 'A' ? teamA : teamB}</h3><p className="text-gray-500 text-sm">Escolha um personagem ativo para este slot.</p></div>
                              <div className="flex items-center gap-4"><div className="relative"><input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-gray-800 border border-gray-600 rounded-full px-4 py-2 text-sm text-white focus:border-brand-500 outline-none" autoFocus /><Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"/></div><button onClick={() => setModalOpen(false)} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 hover:text-white transition-colors"><X /></button></div>
                          </div>
                          <div className="flex-1 overflow-y-auto p-6 bg-black/20"><div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">{filteredCharacters.map(char => { const picked = picksA.includes(char.name) || picksB.includes(char.name); const banned = bans.A === char.name || bans.B === char.name; const disabled = picked || banned; return (<div key={char.name} onClick={() => !disabled && handleManualUpdate(char.name, activeSlot.team, activeSlot.type, activeSlot.index)} className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${disabled ? 'border-gray-800 grayscale opacity-40 cursor-not-allowed' : 'border-gray-700 hover:border-brand-500 hover:scale-105'}`}><img src={char.img} className="w-full h-full object-cover object-top" /><div className="absolute bottom-0 inset-x-0 bg-black/80 py-1 px-1 text-center border-t border-white/10"><p className="text-white font-black text-[9px] uppercase truncate">{char.name}</p></div>{disabled && <div className="absolute inset-0 bg-black/50 flex items-center justify-center font-bold text-red-500 uppercase rotate-45 border-2 border-red-500 rounded-lg m-4">Indisponível</div>}</div>) })}</div></div>
                      </div>
                  </div>
              )}

              {/* RESULT & STATS MODAL */}
              {showResultModal && (
                  <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in">
                      <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8 max-w-5xl w-full shadow-2xl overflow-y-auto max-h-[90vh]">
                          <div className="flex justify-between items-center mb-6">
                              <h3 className="text-2xl font-black uppercase text-white">{editingMatchIndex !== null ? 'Editar Partida Completa' : `Resultado - ${maps[currentMatch]}`}</h3>
                              
                              {/* Tab Switcher */}
                              {tournament.name && (
                                  <div className="flex bg-gray-800 rounded-lg p-1">
                                      <button onClick={() => setResultTab('score')} className={`px-4 py-2 rounded font-bold text-sm ${resultTab === 'score' ? 'bg-brand-500 text-black' : 'text-gray-400'}`}>Placar</button>
                                      <button onClick={() => setResultTab('stats')} className={`px-4 py-2 rounded font-bold text-sm ${resultTab === 'stats' ? 'bg-brand-500 text-black' : 'text-gray-400'}`}>Estatísticas</button>
                                  </div>
                              )}
                          </div>

                          {/* TAB: SCORE */}
                          {resultTab === 'score' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                  <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700"><div onClick={() => setTempResult(p => ({...p, winner: 'A'}))} className={`cursor-pointer p-4 rounded-xl border-2 text-center mb-4 transition-all ${tempResult.winner === 'A' ? 'bg-teamA/20 border-teamA' : 'border-transparent'}`}><div className="text-teamA font-black text-xl mb-2">{teamA}</div><input type="number" min="0" value={tempResult.scoreA} onChange={(e) => setTempResult(p => ({...p, scoreA: parseInt(e.target.value)}))} onClick={e => e.stopPropagation()} className="w-20 bg-black border border-gray-600 rounded-lg text-center text-2xl font-bold py-2 outline-none focus:border-teamA" /></div>{editingMatchIndex !== null && (<div className="space-y-4"><div className="flex items-center justify-between bg-black/30 p-2 rounded-lg border border-red-900/30"><span className="text-xs font-bold text-red-500 uppercase">Ban</span><button onClick={() => setEditCharSelector({team: 'A', type: 'ban'})} className="flex items-center gap-2 hover:bg-white/5 px-2 py-1 rounded"><span className="text-sm font-bold">{tempResult.bans.A || 'Selecionar'}</span><Edit2 size={12} className="text-gray-500"/></button></div><div className="grid grid-cols-4 gap-2">{Array.from({length: 4}).map((_, i) => (<button key={i} onClick={() => setEditCharSelector({team: 'A', type: 'pick', index: i})} className="aspect-square bg-black/30 rounded border border-gray-700 hover:border-teamA relative overflow-hidden group">{tempResult.picks.A[i] ? (<img src={CHARACTERS_DB.find(c => c.name === tempResult.picks.A[i])?.img} className="w-full h-full object-cover"/>) : <span className="text-xs text-gray-600">?</span>}<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center"><Edit2 size={12}/></div></button>))}</div></div>)}</div>
                                  <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700"><div onClick={() => setTempResult(p => ({...p, winner: 'B'}))} className={`cursor-pointer p-4 rounded-xl border-2 text-center mb-4 transition-all ${tempResult.winner === 'B' ? 'bg-teamB/20 border-teamB' : 'border-transparent'}`}><div className="text-teamB font-black text-xl mb-2">{teamB}</div><input type="number" min="0" value={tempResult.scoreB} onChange={(e) => setTempResult(p => ({...p, scoreB: parseInt(e.target.value)}))} onClick={e => e.stopPropagation()} className="w-20 bg-black border border-gray-600 rounded-lg text-center text-2xl font-bold py-2 outline-none focus:border-teamB" /></div>{editingMatchIndex !== null && (<div className="space-y-4"><div className="flex items-center justify-between bg-black/30 p-2 rounded-lg border border-red-900/30"><span className="text-xs font-bold text-red-500 uppercase">Ban</span><button onClick={() => setEditCharSelector({team: 'B', type: 'ban'})} className="flex items-center gap-2 hover:bg-white/5 px-2 py-1 rounded"><span className="text-sm font-bold">{tempResult.bans.B || 'Selecionar'}</span><Edit2 size={12} className="text-gray-500"/></button></div><div className="grid grid-cols-4 gap-2">{Array.from({length: 4}).map((_, i) => (<button key={i} onClick={() => setEditCharSelector({team: 'B', type: 'pick', index: i})} className="aspect-square bg-black/30 rounded border border-gray-700 hover:border-teamB relative overflow-hidden group">{tempResult.picks.B[i] ? (<img src={CHARACTERS_DB.find(c => c.name === tempResult.picks.B[i])?.img} className="w-full h-full object-cover"/>) : <span className="text-xs text-gray-600">?</span>}<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center"><Edit2 size={12}/></div></button>))}</div></div>)}</div>
                              </div>
                          )}

                          {/* TAB: STATS */}
                          {resultTab === 'stats' && tournament.name && (
                              <div className="space-y-6 mb-8">
                                  {/* Team A Stats */}
                                  <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700">
                                      <h4 className="font-bold text-teamA mb-3">{teamA}</h4>
                                      <div className="grid grid-cols-4 gap-2 text-xs font-bold text-gray-500 uppercase mb-2">
                                          <div>Jogador</div>
                                          <div className="text-center">Kills</div>
                                          <div className="text-center">Assist</div>
                                          <div className="text-center">Dano</div>
                                      </div>
                                      {tournament.teams.find(t => t.name === teamA)?.players.map(player => (
                                          <div key={player.id} className="grid grid-cols-4 gap-2 items-center mb-2">
                                              <span className="truncate">{player.name}</span>
                                              <input type="number" placeholder="0" className="bg-black/50 border border-gray-700 rounded p-1 text-center" value={tempResult.playerStats[player.id]?.kills || ''} onChange={e => updatePlayerStat(player.id, 'kills', parseInt(e.target.value) || 0)} />
                                              <input type="number" placeholder="0" className="bg-black/50 border border-gray-700 rounded p-1 text-center" value={tempResult.playerStats[player.id]?.assists || ''} onChange={e => updatePlayerStat(player.id, 'assists', parseInt(e.target.value) || 0)} />
                                              <input type="number" placeholder="0" className="bg-black/50 border border-gray-700 rounded p-1 text-center" value={tempResult.playerStats[player.id]?.damage || ''} onChange={e => updatePlayerStat(player.id, 'damage', parseInt(e.target.value) || 0)} />
                                          </div>
                                      ))}
                                  </div>

                                  {/* Team B Stats */}
                                  <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700">
                                      <h4 className="font-bold text-teamB mb-3">{teamB}</h4>
                                      <div className="grid grid-cols-4 gap-2 text-xs font-bold text-gray-500 uppercase mb-2">
                                          <div>Jogador</div>
                                          <div className="text-center">Kills</div>
                                          <div className="text-center">Assist</div>
                                          <div className="text-center">Dano</div>
                                      </div>
                                      {tournament.teams.find(t => t.name === teamB)?.players.map(player => (
                                          <div key={player.id} className="grid grid-cols-4 gap-2 items-center mb-2">
                                              <span className="truncate">{player.name}</span>
                                              <input type="number" placeholder="0" className="bg-black/50 border border-gray-700 rounded p-1 text-center" value={tempResult.playerStats[player.id]?.kills || ''} onChange={e => updatePlayerStat(player.id, 'kills', parseInt(e.target.value) || 0)} />
                                              <input type="number" placeholder="0" className="bg-black/50 border border-gray-700 rounded p-1 text-center" value={tempResult.playerStats[player.id]?.assists || ''} onChange={e => updatePlayerStat(player.id, 'assists', parseInt(e.target.value) || 0)} />
                                              <input type="number" placeholder="0" className="bg-black/50 border border-gray-700 rounded p-1 text-center" value={tempResult.playerStats[player.id]?.damage || ''} onChange={e => updatePlayerStat(player.id, 'damage', parseInt(e.target.value) || 0)} />
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          )}

                          <div className="flex gap-4">
                              <button onClick={() => setShowResultModal(false)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold text-gray-400">Cancelar</button>
                              <button onClick={finalizeMatch} className="flex-1 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-white shadow-lg">Confirmar</button>
                          </div>
                      </div>
                  </div>
              )}

              {/* HELP MODAL */}
              {showHelp && (
                  <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 animate-fade-in">
                      <div className="bg-white dark:bg-gray-900 max-w-lg w-full p-6 rounded-2xl shadow-2xl border border-gray-700 relative">
                          <button onClick={() => setShowHelp(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X /></button>
                          <h3 className="text-2xl font-bold mb-4 text-brand-500 flex items-center gap-2"><HelpCircle /> Como usar</h3>
                          
                          <div className="space-y-4 text-sm text-gray-300">
                              <div>
                                  <h4 className="font-bold text-white mb-1">1. Banimentos e Picks</h4>
                                  <p>Clique nos slots vazios (quadrados) na barra superior para abrir a seleção de personagens. Os turnos alternam entre os times conforme o modo (Snake, Linear, etc).</p>
                              </div>
                              <div>
                                  <h4 className="font-bold text-white mb-1">2. Arrastar e Soltar</h4>
                                  <p>Você também pode arrastar personagens da lista abaixo diretamente para os slots de banimento ou pick.</p>
                              </div>
                              <div>
                                  <h4 className="font-bold text-white mb-1">3. Finalizar Partida & Estatísticas</h4>
                                  <p>Ao finalizar, insira o placar na aba "Placar". Use a aba "Estatísticas" para inserir Abates, Assistências e Dano de cada jogador para alimentar o ranking de MVP.</p>
                              </div>
                              <div>
                                  <h4 className="font-bold text-white mb-1">4. Editar Histórico</h4>
                                  <p>Na tela de resultados, clique no ícone de lápis em uma partida anterior para corrigir picks, bans, placar ou estatísticas.</p>
                              </div>
                          </div>
                          
                          <button onClick={() => setShowHelp(false)} className="mt-6 w-full bg-gray-800 hover:bg-gray-700 py-3 rounded-lg font-bold">Entendi</button>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  // --- RESULT VIEW (QUICK MATCH) ---
  if (view === 'result') {
      const winsA = history.filter(h => h.winner === 'A').length;
      const winsB = history.filter(h => h.winner === 'B').length;
      const winner = winsA > winsB ? teamA : teamB;
      const winnerColor = winsA > winsB ? 'text-teamA' : 'text-teamB';

      return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 p-4 animate-fade-in">
              <div id="result-summary" className="bg-gray-950 border border-gray-800 rounded-3xl p-8 max-w-6xl w-full shadow-2xl relative overflow-hidden text-center">
                  
                  {/* Winner Header */}
                  <div className="relative z-10 mb-10">
                      <Trophy size={64} className="text-yellow-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                      <h2 className="text-lg font-bold text-gray-500 uppercase tracking-widest mb-2">Vencedor da Série</h2>
                      <h1 className={`text-6xl md:text-8xl font-black uppercase ${winnerColor} mb-6 drop-shadow-lg`}>{winner}</h1>
                      
                      <div className="flex items-center justify-center gap-10">
                          <div className="text-center">
                              <p className="text-xl md:text-2xl font-bold text-teamA mb-1 uppercase">{teamA}</p>
                              <p className="text-5xl md:text-7xl font-black text-white">{winsA}</p>
                          </div>
                          <div className="text-3xl font-black text-gray-700 mt-8">VS</div>
                          <div className="text-center">
                              <p className="text-xl md:text-2xl font-bold text-teamB mb-1 uppercase">{teamB}</p>
                              <p className="text-5xl md:text-7xl font-black text-white">{winsB}</p>
                          </div>
                      </div>
                  </div>

                  {/* Match History Table */}
                  <div className="bg-black/40 rounded-2xl border border-gray-800 overflow-hidden">
                      <div className="p-4 bg-gray-900 border-b border-gray-800 text-left text-xs font-bold text-gray-500 uppercase">
                          Histórico de Partidas
                      </div>
                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2 space-y-2">
                          {history.map((h, i) => (
                              <div key={i} className="flex items-center bg-gray-900/50 border border-gray-800 p-3 rounded-xl hover:border-gray-700 transition-colors">
                                  {/* Match Info */}
                                  <div className="w-32 md:w-40 text-left pl-2">
                                      <span className="text-xs font-bold text-gray-500 block mb-0.5">#{i + 1}</span>
                                      <span className="text-lg font-black text-white uppercase">{h.map}</span>
                                  </div>

                                  {/* Timeline / Cards */}
                                  <div className="flex-1 flex gap-2 overflow-x-auto px-4 custom-scrollbar pb-2 pt-1 h-[60px] items-center">
                                      {/* Bans First */}
                                      {h.bans.A && <ResultHistoryCard charName={h.bans.A} type="ban" team="A" />}
                                      {h.bans.B && <ResultHistoryCard charName={h.bans.B} type="ban" team="B" />}
                                      
                                      {/* Separator */}
                                      {(h.bans.A || h.bans.B) && <div className="w-px h-8 bg-gray-700 mx-2"></div>}

                                      {/* Render Picks Team A */}
                                      {h.picks.A.map((p, idx) => (
                                          <ResultHistoryCard key={`a-${idx}`} charName={p} type="pick" team="A" />
                                      ))}
                                      
                                      {/* Render Picks Team B */}
                                      {h.picks.B.map((p, idx) => (
                                          <ResultHistoryCard key={`b-${idx}`} charName={p} type="pick" team="B" />
                                      ))}
                                  </div>

                                  {/* Score */}
                                  <div className="w-24 text-right pr-4">
                                      <span className={`text-2xl font-black font-mono ${h.winner === 'A' ? 'text-teamA' : 'text-teamB'}`}>
                                          {h.scoreA} - {h.scoreB}
                                      </span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  <div className="flex gap-4 justify-center mt-8">
                      <button onClick={() => setView('home')} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold text-gray-300 transition-colors">
                          Voltar ao Início
                      </button>
                      <button onClick={() => downloadDivAsImage('result-summary', 'resultado-serie')} className="px-8 py-3 bg-brand-500 hover:bg-brand-600 text-gray-900 rounded-xl font-bold shadow-lg transition-colors flex items-center gap-2">
                          <Download size={20} /> Salvar Imagem
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // --- TOURNAMENT SETUP & HUB VIEWS ---
  // (Simple placeholders to prevent breakage if user navigates there)
  if (view === 'tournament_setup') {
      return (
          <div className="max-w-4xl mx-auto py-10 px-4 animate-fade-in text-center">
              <button onClick={() => setView('home')} className="mb-6 text-gray-500 hover:text-white flex items-center gap-2 mx-auto"><ChevronLeft /> Voltar</button>
              <h1 className="text-3xl font-bold mb-4">Configurar Campeonato</h1>
              <div className="bg-gray-900 p-8 rounded-xl border border-gray-800">
                  <p className="text-gray-400 mb-6">Configure os times para iniciar o torneio.</p>
                  
                  <div className="max-w-md mx-auto space-y-4 text-left">
                      <input 
                        type="text" 
                        placeholder="Nome do Torneio" 
                        className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white outline-none focus:border-brand-500"
                        value={tournament.name}
                        onChange={e => setTournament(prev => ({...prev, name: e.target.value}))}
                      />
                      
                      <div className="border-t border-gray-800 pt-4">
                          <h4 className="font-bold text-sm text-gray-500 uppercase mb-2">Adicionar Time</h4>
                          <div className="flex gap-2">
                              <input 
                                type="text" 
                                placeholder="Nome do Time" 
                                className="flex-1 bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white"
                                value={newTeamInput.name}
                                onChange={e => setNewTeamInput(prev => ({...prev, name: e.target.value}))}
                              />
                              <button onClick={addTournamentTeam} className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded text-sm font-bold"><Plus/></button>
                          </div>
                      </div>

                      <div className="space-y-2 mt-4 max-h-40 overflow-y-auto custom-scrollbar">
                          {tournament.teams.map(t => (
                              <div key={t.id} className="bg-gray-800 p-2 rounded flex justify-between items-center">
                                  <span className="text-sm font-bold">{t.name}</span>
                                  <span className="text-xs text-gray-500">{t.players.length} players</span>
                              </div>
                          ))}
                      </div>

                      <button 
                        onClick={() => {
                            if (tournament.teams.length < 2) { alert('Adicione pelo menos 2 times'); return; }
                            generateSwissPairings();
                            setView('tournament_hub');
                        }}
                        className="w-full bg-brand-500 hover:bg-brand-600 text-gray-900 font-bold py-3 rounded-xl mt-4"
                      >
                          Iniciar Torneio
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  if (view === 'tournament_hub') {
      return (
          <div className="max-w-6xl mx-auto py-8 px-4 animate-fade-in">
              <div className="flex justify-between items-center mb-8">
                  <div>
                      <h1 className="text-3xl font-black uppercase italic">{tournament.name}</h1>
                      <p className="text-gray-500 font-bold">Rodada {tournament.currentRound}</p>
                  </div>
                  <button onClick={() => setView('home')} className="text-gray-500 hover:text-white">Sair</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tournament.matches.filter(m => m.round === tournament.currentRound).map(match => {
                      const tA = tournament.teams.find(t => t.id === match.teamAId);
                      const tB = tournament.teams.find(t => t.id === match.teamBId);
                      return (
                          <MatchCardSmall 
                            key={match.id} 
                            match={match} 
                            teamA={tA} 
                            teamB={tB} 
                            onStart={startTournamentMatch}
                          />
                      );
                  })}
              </div>
          </div>
      );
  }

  return null;
}

export default PicksBans;
