import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Map as MapIcon, Shield, Users, 
  ChevronRight, Play, RefreshCw, LayoutGrid, 
  CheckCircle, History, Download, X, Sword, MonitorPlay, ChevronLeft, Save,
  RotateCcw, GripVertical, CheckSquare, Settings, Crown, AlertTriangle, ArrowRight, Clock
} from 'lucide-react';
import { downloadDivAsImage } from '../utils';

// --- DATA CONSTANTS ---

const CHARACTERS_DB = [
  { name: 'A124', img: 'https://i.ibb.co/fzTd41Lx/A124.png' },
  { name: 'ORION', img: 'https://i.ibb.co/7xr1ys7f/ORION.png' },
  { name: 'SKYLER', img: 'https://i.ibb.co/0RhD9WNz/SKYLER.png' },
  { name: 'STEFFIE', img: 'https://i.ibb.co/1GJv2jqG/STEFFIE.png' },
  { name: 'IRIS', img: 'https://i.ibb.co/x8Fhfsty/IRIS.png' },
  { name: 'CR7', img: 'https://i.ibb.co/TqHmqFrH/CR7.png' },
  { name: 'TATSUYA', img: 'https://i.ibb.co/rK6NSGgF/TATSUYA.png' },
  { name: 'HOMERO', img: 'https://i.ibb.co/qLD3MckR/HOMERO.png' },
  { name: 'DIMITRI', img: 'https://i.ibb.co/YB8WTZpL/DIMITRI.png' },
  { name: 'EVELYN', img: 'https://i.ibb.co/N6HnVHmh/EVELYN.png' },
  { name: 'KAMIR', img: 'https://i.ibb.co/605w44By/KAMIR.png' },
  { name: 'SANTINO', img: 'https://i.ibb.co/sd1Kz8Gj/SANTINO.png' },
  { name: 'KODA', img: 'https://i.ibb.co/849xyhhR/KODA.png' },
  { name: 'RYDEN', img: 'https://i.ibb.co/1YWRw9yF/RYDEN.png' },
  { name: 'OSCAR', img: 'https://i.ibb.co/KzKM9VKT/OSCAR.png' },
  { name: 'KASSIE', img: 'https://i.ibb.co/qYD4KqYj/KASSIE.png' },
  { name: 'KENTA', img: 'https://i.ibb.co/nXycc5H/KENTA.png' },
  { name: 'EXTREMA', img: 'https://i.ibb.co/C3Nv8cYH/EXTREMA.png' },
  { name: 'ALOK', img: 'https://i.ibb.co/JwG3C41h/ALOK.png' },
  { name: 'IGNIS', img: 'https://i.ibb.co/7N2n6qC0/IGNIS.png' },
  { name: 'WUKONG', img: 'https://i.ibb.co/W4JLHZXz/WUKONG.png' },
  { name: 'NERO', img: 'https://i.ibb.co/9HSp4GsC/NERO.png' },
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

type ViewState = 'home' | 'mode' | 'format' | 'maps' | 'draft' | 'history' | 'result';
type DraftMode = 'snake' | 'linear' | 'mirrored';
type MapDrawType = 'no-repeat' | 'repeat' | 'fixed';
type DraftStepType = 'ban' | 'pick';
type Winner = 'A' | 'B' | null;

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
}

// --- PICK ORDERS (Base Templates) ---
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

// Component to render a character card with name bar
interface CharacterCardProps {
  name: string | null | undefined;
  type: 'A' | 'B' | 'Ban';
  isBan?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const CharacterCard: React.FC<CharacterCardProps> = ({ name, type, isBan = false, size = 'md' }) => {
    const charData = CHARACTERS_DB.find(c => c.name === name);
    
    let borderColor = 'border-gray-700';
    if (type === 'A') borderColor = 'border-teamA';
    if (type === 'B') borderColor = 'border-teamB';
    if (type === 'Ban') borderColor = 'border-red-600';

    const sizeClasses = size === 'sm' ? 'w-10 h-10' : size === 'md' ? 'w-14 h-14' : 'w-20 h-20';
    const textClasses = size === 'sm' ? 'text-[8px]' : 'text-[10px]';

    return (
        <div className={`${sizeClasses} rounded-lg border-2 ${borderColor} bg-gray-800 relative overflow-hidden flex-shrink-0`}>
            {charData ? (
                <>
                    <img src={charData.img} className={`w-full h-full object-cover object-top ${isBan ? 'grayscale opacity-80' : ''}`} alt={name || ''} />
                    {isBan && <div className="absolute inset-0 flex items-center justify-center bg-black/40"><X className="text-red-500 font-bold w-1/2 h-1/2" /></div>}
                    <div className={`absolute bottom-0 w-full bg-black/80 text-white font-bold text-center truncate px-0.5 ${textClasses}`}>
                        {charData.name}
                    </div>
                </>
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-700 font-bold text-xs">?</div>
            )}
        </div>
    );
};

// Timeline Component
const Timeline = ({ match, teamA, teamB }: { match: MatchRecord, teamA: string, teamB: string }) => {
    // Reconstruct the order used for this match
    const baseOrder = ORDERS[match.mode as DraftMode];
    let order = baseOrder;
    
    // Check if it was a swapped turn match (Even matches: 2, 4, 6...)
    // Note: matchIndex is 1-based in MatchRecord
    const isSwapped = match.matchIndex % 2 === 0;

    if (isSwapped) {
        order = baseOrder.map(step => ({ ...step, team: step.team === 'A' ? 'B' : 'A' }));
    }

    // Counters to track which pick index we are on
    let pickCountA = 0;
    let pickCountB = 0;

    return (
        <div className="w-full overflow-x-auto py-2">
            <div className="flex items-center gap-1 min-w-max">
                <div className="text-[10px] font-bold uppercase text-gray-500 mr-2 flex items-center gap-1">
                    <Clock size={12} /> Timeline:
                </div>
                {order.map((step, idx) => {
                    let charName = '';
                    let isBan = false;

                    if (step.type === 'ban') {
                        isBan = true;
                        charName = step.team === 'A' ? (match.bans.A || '') : (match.bans.B || '');
                    } else {
                        if (step.team === 'A') {
                            charName = match.picks.A[pickCountA] || '';
                            pickCountA++;
                        } else {
                            charName = match.picks.B[pickCountB] || '';
                            pickCountB++;
                        }
                    }

                    // For swapped matches, the labels in `order` are dynamically flipped in logic,
                    // but we need to ensure we attribute the team correctly visually.
                    const teamColor = step.team === 'A' ? 'border-teamA' : 'border-teamB';
                    const teamLabel = step.team === 'A' ? teamA : teamB;

                    return (
                        <div key={idx} className="flex flex-col items-center group relative">
                             <div className={`w-8 h-8 rounded border ${isBan ? 'border-red-500' : teamColor} bg-gray-800 overflow-hidden relative`}>
                                 {charName && <img src={CHARACTERS_DB.find(c => c.name === charName)?.img} className={`w-full h-full object-cover object-top ${isBan ? 'grayscale' : ''}`} />}
                                 {isBan && <div className="absolute inset-0 bg-red-900/40 flex items-center justify-center text-[8px] text-white font-bold">X</div>}
                             </div>
                             <div className={`text-[8px] font-bold mt-0.5 max-w-[40px] truncate ${step.team === 'A' ? 'text-teamA' : 'text-teamB'}`}>
                                 {isBan ? 'BAN' : charName}
                             </div>
                             
                             {/* Arrow Connector */}
                             {idx < order.length - 1 && (
                                 <div className="absolute top-4 -right-1.5 z-10 text-gray-600">
                                     <ArrowRight size={8} />
                                 </div>
                             )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const PicksBans: React.FC = () => {
  // Navigation State
  const [view, setView] = useState<ViewState>('home');
  const [hasSavedData, setHasSavedData] = useState(false);
  
  // Settings State
  const [selectedMode, setSelectedMode] = useState<DraftMode>('snake');
  const [mdFormat, setMdFormat] = useState<number>(3);
  const [roundsPerMatch, setRoundsPerMatch] = useState<number>(13);
  const [mapDrawType, setMapDrawType] = useState<MapDrawType>('no-repeat');
  
  // Game State
  const [seriesMaps, setSeriesMaps] = useState<string[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [matchHistory, setMatchHistory] = useState<MatchRecord[]>([]);
  const [isAnimatingMaps, setIsAnimatingMaps] = useState(false);
  const [displayMaps, setDisplayMaps] = useState<string[]>([]);
  
  // Draft State
  const [teamAName, setTeamAName] = useState('TIME A');
  const [teamBName, setTeamBName] = useState('TIME B');
  const [draftIndex, setDraftIndex] = useState(0);
  const [teamABan, setTeamABan] = useState<string | null>(null);
  const [teamBBan, setTeamBBan] = useState<string | null>(null);
  const [teamAPicks, setTeamAPicks] = useState<string[]>([]);
  const [teamBPicks, setTeamBPicks] = useState<string[]>([]);

  // Finish Match Modal State
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [pendingWinner, setPendingWinner] = useState<Winner>(null);
  const [pendingScoreA, setPendingScoreA] = useState(0);
  const [pendingScoreB, setPendingScoreB] = useState(0);

  // --- PERSISTENCE ---

  useEffect(() => {
    const saved = localStorage.getItem('picksbans_state');
    if (saved) {
        setHasSavedData(true);
    }
  }, []);

  useEffect(() => {
      if (seriesMaps.length > 0 || teamAName !== 'TIME A') {
          const stateToSave = {
              view, selectedMode, mdFormat, roundsPerMatch, mapDrawType,
              seriesMaps, currentMatchIndex, matchHistory,
              teamAName, teamBName,
              draftIndex, teamABan, teamBBan, teamAPicks, teamBPicks
          };
          localStorage.setItem('picksbans_state', JSON.stringify(stateToSave));
          setHasSavedData(true);
      }
  }, [
      view, selectedMode, mdFormat, roundsPerMatch, mapDrawType,
      seriesMaps, currentMatchIndex, matchHistory,
      teamAName, teamBName, draftIndex, teamABan, teamBBan, teamAPicks, teamBPicks
  ]);

  const loadSession = () => {
      const saved = localStorage.getItem('picksbans_state');
      if (saved) {
          const parsed = JSON.parse(saved);
          setView(parsed.view);
          setSelectedMode(parsed.selectedMode);
          setMdFormat(parsed.mdFormat);
          setRoundsPerMatch(parsed.roundsPerMatch || 13);
          setMapDrawType(parsed.mapDrawType);
          setSeriesMaps(parsed.seriesMaps);
          setCurrentMatchIndex(parsed.currentMatchIndex);
          setMatchHistory(parsed.matchHistory);
          setTeamAName(parsed.teamAName);
          setTeamBName(parsed.teamBName);
          setDraftIndex(parsed.draftIndex);
          setTeamABan(parsed.teamABan);
          setTeamBBan(parsed.teamBBan);
          setTeamAPicks(parsed.teamAPicks);
          setTeamBPicks(parsed.teamBPicks);
      }
  };

  const resetSession = () => {
      if(confirm('Tem certeza? Todo o progresso atual será perdido.')) {
          localStorage.removeItem('picksbans_state');
          setHasSavedData(false);
          setView('home');
          setSelectedMode('snake');
          setMdFormat(3);
          setRoundsPerMatch(13);
          setMapDrawType('no-repeat');
          setSeriesMaps([]);
          setCurrentMatchIndex(0);
          setMatchHistory([]);
          setTeamAName('TIME A');
          setTeamBName('TIME B');
          setDraftIndex(0);
          setTeamABan(null);
          setTeamBBan(null);
          setTeamAPicks([]);
          setTeamBPicks([]);
      }
  };

  // --- DYNAMIC ORDER LOGIC ---

  const getCurrentOrder = () => {
      const baseOrder = ORDERS[selectedMode];
      if (currentMatchIndex % 2 === 0) {
          return baseOrder;
      } else {
          return baseOrder.map(step => ({
              ...step,
              team: step.team === 'A' ? 'B' : 'A'
          }));
      }
  };

  const currentOrder = getCurrentOrder();

  // --- ACTIONS ---

  const handleStartDraft = () => {
    setDraftIndex(0);
    setTeamABan(null);
    setTeamBBan(null);
    setTeamAPicks([]);
    setTeamBPicks([]);
    setView('draft');
  };

  const drawMaps = () => {
    setIsAnimatingMaps(true);
    let pool = [...MAPS_DB];
    let finalDrawn: string[] = [];

    // Logic to select final maps
    if (mapDrawType === 'fixed') {
        finalDrawn = Array(mdFormat).fill(pool[0].name);
    } else {
        for (let i = 0; i < mdFormat; i++) {
            if (pool.length === 0) pool = [...MAPS_DB];
            const rand = Math.floor(Math.random() * pool.length);
            finalDrawn.push(pool[rand].name);
            if (mapDrawType === 'no-repeat') {
                pool.splice(rand, 1);
            }
        }
    }

    // Animation Loop
    let iterations = 0;
    const interval = setInterval(() => {
        const randomMaps = Array(mdFormat).fill(0).map(() => 
            MAPS_DB[Math.floor(Math.random() * MAPS_DB.length)].name
        );
        setDisplayMaps(randomMaps);
        iterations++;

        if (iterations > 20) {
            clearInterval(interval);
            setIsAnimatingMaps(false);
            setSeriesMaps(finalDrawn);
            setDisplayMaps(finalDrawn);
            setMatchHistory([]);
            setCurrentMatchIndex(0);
            setView('maps');
        }
    }, 100);
  };

  const handleCharacterSelect = (charName: string) => {
    if (draftIndex >= currentOrder.length) return;

    const step = currentOrder[draftIndex];

    // Check if character is already picked or banned
    if (
        teamABan === charName || 
        teamBBan === charName || 
        teamAPicks.includes(charName) || 
        teamBPicks.includes(charName)
    ) {
        return;
    }

    // Apply logic
    if (step.type === 'ban') {
        if (step.team === 'A') setTeamABan(charName);
        else setTeamBBan(charName);
    } else {
        if (step.team === 'A') setTeamAPicks([...teamAPicks, charName]);
        else setTeamBPicks([...teamBPicks, charName]);
    }

    setDraftIndex(draftIndex + 1);
  };

  const handleUndo = () => {
    if (draftIndex <= 0) return;
    const prevIndex = draftIndex - 1;
    const step = currentOrder[prevIndex];

    if (step.type === 'ban') {
        if (step.team === 'A') setTeamABan(null);
        else setTeamBBan(null);
    } else {
        if (step.team === 'A') {
            const newPicks = [...teamAPicks];
            newPicks.pop();
            setTeamAPicks(newPicks);
        } else {
            const newPicks = [...teamBPicks];
            newPicks.pop();
            setTeamBPicks(newPicks);
        }
    }
    setDraftIndex(prevIndex);
  };

  // Open the modal instead of instantly creating record
  const initiateFinishMatch = () => {
      setPendingWinner(null);
      setPendingScoreA(0);
      setPendingScoreB(0);
      setShowFinishModal(true);
  };

  const confirmFinishMatch = () => {
    if (!pendingWinner) {
        alert("Selecione um vencedor!");
        return;
    }

    // Logic for winning score based on Rounds
    // 11 Rounds -> 6 wins
    // 13 Rounds -> 7 wins
    // 15 Rounds -> 8 wins
    const pointsToWin = Math.ceil(roundsPerMatch / 2);

    if (pendingScoreA < pointsToWin && pendingScoreB < pointsToWin) {
        alert(`Para finalizar, um dos times deve atingir ${pointsToWin} rounds (vitória).`);
        return;
    }

    if (pendingScoreA > pointsToWin || pendingScoreB > pointsToWin) {
        alert(`O placar máximo não pode exceder ${pointsToWin} vitórias.`);
        return;
    }

    // Ensure winner matches score
    if (pendingWinner === 'A' && pendingScoreA < pendingScoreB) {
        alert("O vencedor selecionado (A) tem menos rounds que o perdedor.");
        return;
    }
    if (pendingWinner === 'B' && pendingScoreB < pendingScoreA) {
        alert("O vencedor selecionado (B) tem menos rounds que o perdedor.");
        return;
    }

    const record: MatchRecord = {
        matchIndex: currentMatchIndex + 1,
        map: seriesMaps[currentMatchIndex] || 'Desconhecido',
        mode: selectedMode,
        bans: { A: teamABan, B: teamBBan },
        picks: { A: [...teamAPicks], B: [...teamBPicks] },
        rounds: roundsPerMatch,
        winner: pendingWinner,
        scoreA: pendingScoreA,
        scoreB: pendingScoreB
    };
    
    const newHistory = [...matchHistory, record];
    setMatchHistory(newHistory);
    setShowFinishModal(false);

    // Calculate Series End Logic
    const winsA = newHistory.filter(m => m.winner === 'A').length;
    const winsB = newHistory.filter(m => m.winner === 'B').length;
    const requiredWins = Math.ceil(mdFormat / 2);

    // If matches played equals format limit OR someone reached winning threshold
    const isSeriesDone = (newHistory.length >= mdFormat) || (winsA >= requiredWins || winsB >= requiredWins);

    if (isSeriesDone) {
        setView('result');
    } else {
        // Prepare next match
        setCurrentMatchIndex(currentMatchIndex + 1);
        setView('history');
    }
  };

  // Drag and Drop Handlers
  const onDragStart = (e: React.DragEvent, charName: string) => {
      e.dataTransfer.setData("charName", charName);
  };

  const onDrop = (e: React.DragEvent) => {
      const charName = e.dataTransfer.getData("charName");
      if (charName) handleCharacterSelect(charName);
  };

  const onDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };

  // Scores
  const scoreA = matchHistory.filter(m => m.winner === 'A').length;
  const scoreB = matchHistory.filter(m => m.winner === 'B').length;

  // --- VIEWS COMPONENTS ---

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-fade-in text-center">
        <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-brand-500 to-yellow-600 bg-clip-text text-transparent uppercase tracking-tight">
            Gerenciador de Partidas
        </h1>
        
        {hasSavedData && (
             <div className="w-full max-w-2xl bg-gray-800/50 border border-gray-700 p-4 rounded-xl mb-4 flex items-center justify-between">
                 <div className="text-left">
                     <p className="text-white font-bold">Sessão encontrada</p>
                     <p className="text-sm text-gray-500">Você tem um draft em andamento salvo.</p>
                 </div>
                 <div className="flex gap-2">
                     <button onClick={resetSession} className="px-4 py-2 text-sm text-red-400 hover:text-red-300 font-bold">
                         Descartar
                     </button>
                     <button onClick={loadSession} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center gap-2">
                         <Play size={16} fill="currentColor" /> Continuar
                     </button>
                 </div>
             </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
            <button onClick={() => setView('mode')} className="p-6 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-brand-500 rounded-2xl flex items-center justify-between group transition-all">
                <div className="text-left">
                    <div className="text-brand-500 mb-1"><Sword size={24} /></div>
                    <div className="font-bold text-xl text-white">Novo Draft</div>
                    <div className="text-xs text-gray-500">Configurar Modo & MD</div>
                </div>
                <ChevronRight className="text-gray-600 group-hover:text-brand-500" />
            </button>

            <button onClick={() => setView('format')} className="p-6 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-brand-500 rounded-2xl flex items-center justify-between group transition-all">
                <div className="text-left">
                    <div className="text-blue-500 mb-1"><MapIcon size={24} /></div>
                    <div className="font-bold text-xl text-white">Sorteio de Mapas</div>
                    <div className="text-xs text-gray-500">Gerar Rotação MD3/5/7</div>
                </div>
                <ChevronRight className="text-gray-600 group-hover:text-blue-500" />
            </button>
        </div>
    </div>
  );

  const renderMode = () => (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div className="flex items-center gap-4">
             <button onClick={() => setView('home')} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700"><ChevronLeft /></button>
             <h2 className="text-3xl font-bold">Selecione o Modo de Draft</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
                { id: 'snake', label: 'Modo Snake', desc: 'Picks alternados (1-2-2-2-1)' },
                { id: 'linear', label: 'Modo Linear', desc: 'Picks alternados simples (1-1-1-1)' },
                { id: 'mirrored', label: 'Modo Mirrored', desc: 'Picks simultâneos (Pares)' }
            ].map((m) => (
                <button 
                    key={m.id}
                    onClick={() => { setSelectedMode(m.id as DraftMode); setView('format'); }}
                    className={`p-6 rounded-2xl border-2 transition-all hover:scale-105 ${selectedMode === m.id ? 'bg-brand-500/10 border-brand-500' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}
                >
                    <div className="text-xl font-black text-white mb-2">{m.label}</div>
                    <p className="text-sm text-gray-400">{m.desc}</p>
                    <div className="mt-4 text-xs font-mono bg-black/30 p-2 rounded text-left space-y-1 text-gray-500">
                        {ORDERS[m.id as DraftMode].slice(0, 5).map(o => <div key={o.label}>{o.label}</div>)}
                        <div>...</div>
                    </div>
                </button>
            ))}
        </div>
    </div>
  );

  const renderFormat = () => (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in text-center">
        <div className="flex items-center justify-start gap-4">
             <button onClick={() => setView('mode')} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700"><ChevronLeft /></button>
        </div>
        
        <h2 className="text-3xl font-bold mb-8">Formato da Série (MD)</h2>
        <div className="flex justify-center gap-4 mb-8">
            {[1, 3, 5, 7].map(num => (
                <button
                    key={num}
                    onClick={() => { setMdFormat(num); }}
                    className={`w-24 h-24 rounded-full border-4 font-black text-3xl transition-all shadow-lg flex items-center justify-center ${mdFormat === num ? 'bg-brand-500 text-gray-900 border-white scale-110' : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-brand-500'}`}
                >
                    MD{num}
                </button>
            ))}
        </div>

        <h2 className="text-xl font-bold mb-4 text-gray-400">Rounds por Partida</h2>
        <div className="flex justify-center gap-4 mb-8">
            {[11, 13, 15].map(num => (
                <button
                    key={num}
                    onClick={() => setRoundsPerMatch(num)}
                    className={`px-6 py-3 rounded-xl font-bold text-lg transition-all ${roundsPerMatch === num ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400'}`}
                >
                    {num} Rounds
                </button>
            ))}
        </div>
        
        <div className="mt-8 p-6 bg-gray-800 rounded-xl inline-block text-left border border-gray-700">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Regra de Sorteio de Mapas</label>
            <div className="flex gap-2">
                <button onClick={() => setMapDrawType('no-repeat')} className={`px-4 py-2 text-sm rounded-lg font-bold ${mapDrawType === 'no-repeat' ? 'bg-green-600 text-white' : 'bg-gray-700'}`}>Sem Repetir</button>
                <button onClick={() => setMapDrawType('repeat')} className={`px-4 py-2 text-sm rounded-lg font-bold ${mapDrawType === 'repeat' ? 'bg-green-600 text-white' : 'bg-gray-700'}`}>Repetir</button>
                <button onClick={() => setMapDrawType('fixed')} className={`px-4 py-2 text-sm rounded-lg font-bold ${mapDrawType === 'fixed' ? 'bg-green-600 text-white' : 'bg-gray-700'}`}>Fixo</button>
            </div>
            
            <button onClick={drawMaps} className="mt-6 w-full bg-brand-500 hover:bg-brand-600 text-gray-900 py-3 rounded-lg font-bold shadow-lg transition-transform hover:scale-105">
                Sortear Mapas &rarr;
            </button>
        </div>
    </div>
  );

  const renderMaps = () => {
    const mapsToShow = isAnimatingMaps ? displayMaps : seriesMaps;
    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('format')} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700"><ChevronLeft /></button>
                    <h2 className="text-3xl font-bold">Mapas da Série</h2>
                </div>
                {!isAnimatingMaps && (
                    <div className="flex gap-2">
                        <button onClick={drawMaps} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-full font-bold flex items-center gap-2">
                            <RefreshCw size={18} /> Ressortear
                        </button>
                        <button onClick={handleStartDraft} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg hover:shadow-green-500/20 transition-all">
                            Iniciar Draft <Play fill="currentColor" />
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {mapsToShow.map((mapName, idx) => {
                    const mapData = MAPS_DB.find(m => m.name === mapName);
                    return (
                        <div key={idx} className={`relative group rounded-xl overflow-hidden border-2 shadow-xl ${isAnimatingMaps ? 'border-brand-500 scale-105' : 'border-gray-700'}`}>
                            <div className="absolute top-0 left-0 bg-brand-500 text-gray-900 font-bold px-3 py-1 z-10 text-xs">
                                Queda {idx + 1}
                            </div>
                            <div className="aspect-video relative">
                                {isAnimatingMaps && <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] z-10 animate-pulse"></div>}
                                <img src={mapData?.img} alt={mapName} className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-black/80 p-3 backdrop-blur-sm">
                                <p className="font-black text-white text-center uppercase tracking-widest">{mapName}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
  };

  const renderDraft = () => {
    const isComplete = draftIndex >= currentOrder.length;
    const currentStep = !isComplete ? currentOrder[draftIndex] : null;

    return (
        <div className="max-w-[1400px] mx-auto space-y-4 animate-fade-in pb-10"
             onDragOver={onDragOver}
             onDrop={onDrop}
        >
            {/* Header / Info Bar */}
            <div className="bg-gray-900 border-b border-gray-800 p-4 sticky top-16 z-30 shadow-2xl">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button onClick={() => setView('maps')} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white" title="Voltar para Mapas"><ChevronLeft /></button>
                        
                        <div className="flex items-center gap-2">
                             {/* Series Scoreboard */}
                             <div className="flex items-center bg-black/50 rounded-lg px-3 py-1 border border-gray-700">
                                 <span className="text-teamA font-bold text-xl">{scoreA}</span>
                                 <span className="mx-2 text-gray-500">-</span>
                                 <span className="text-teamB font-bold text-xl">{scoreB}</span>
                             </div>
                             
                             <div className="text-left">
                                 <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest leading-none mb-0.5">Mapa Atual</div>
                                 <div className="text-brand-500 font-black uppercase text-lg leading-none">{seriesMaps[currentMatchIndex]}</div>
                             </div>
                        </div>
                    </div>
                    
                    {/* Timeline */}
                    <div className="flex-1 overflow-x-auto mx-4 hidden lg:flex gap-1 justify-center py-2 items-center">
                        {currentOrder.map((step, idx) => {
                            const isActive = idx === draftIndex;
                            const isPast = idx < draftIndex;
                            return (
                                <div key={idx} className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                                    isActive ? `border-white ${step.team === 'A' ? 'bg-teamA text-white scale-125' : 'bg-teamB text-white scale-125'}` :
                                    isPast ? `border-gray-700 bg-gray-800 text-gray-500` :
                                    `border-gray-800 bg-gray-900 text-gray-700`
                                }`}>
                                    {step.type === 'ban' ? 'X' : 'P'}
                                </div>
                            )
                        })}
                    </div>

                    <div className="flex items-center gap-2">
                         <button 
                            onClick={handleUndo} 
                            disabled={draftIndex === 0}
                            className="p-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg disabled:opacity-30" title="Desfazer Último"
                         >
                            <RotateCcw size={18} />
                         </button>

                         {!isComplete ? (
                             <div className={`px-6 py-2 rounded-lg font-bold text-sm shadow-lg border animate-pulse flex items-center gap-2 ${currentStep?.team === 'A' ? 'bg-teamA text-white border-blue-400' : 'bg-teamB text-white border-orange-400'}`}>
                                 <div className="w-2 h-2 rounded-full bg-white animate-ping"></div>
                                 VEZ DO {currentStep?.team === 'A' ? teamAName : teamBName}: {currentStep?.type.toUpperCase()}
                             </div>
                         ) : (
                             <button onClick={initiateFinishMatch} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:scale-105 transition-transform shadow-lg shadow-green-500/20">
                                 Finalizar Partida
                             </button>
                         )}
                         
                         <button onClick={() => setView('home')} className="text-gray-500 hover:text-white p-2" title="Voltar ao Menu">
                             <X />
                         </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-6 px-4">
                
                {/* TEAM A SIDE */}
                <div className="space-y-4">
                    <input 
                        value={teamAName} 
                        onChange={(e) => setTeamAName(e.target.value)}
                        className="w-full bg-transparent text-3xl font-black text-teamA uppercase outline-none text-center border-b border-transparent focus:border-teamA"
                    />
                    
                    {/* Ban Card */}
                    <div className="relative aspect-video bg-gray-900 border-2 border-red-900/50 rounded-xl overflow-hidden flex items-center justify-center grayscale opacity-90 group transition-all hover:border-red-600">
                         {teamABan ? (
                             <img src={CHARACTERS_DB.find(c => c.name === teamABan)?.img} className="w-full h-full object-cover object-top" />
                         ) : (
                             <span className="text-red-900 font-black text-4xl">BAN</span>
                         )}
                         <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-bold shadow">BANIDO</div>
                    </div>

                    {/* Pick Cards */}
                    <div className="space-y-2">
                         {Array.from({length: 4}).map((_, i) => {
                             const charName = teamAPicks[i];
                             const charData = CHARACTERS_DB.find(c => c.name === charName);
                             // Highlight active pick slot
                             const isActiveSlot = !isComplete && currentOrder[draftIndex].team === 'A' && currentOrder[draftIndex].type === 'pick' && teamAPicks.length === i;
                             
                             return (
                                 <div key={i} className={`relative h-20 rounded-lg border-l-4 flex items-center overflow-hidden transition-all ${
                                     charData ? 'border-teamA bg-gray-800' : 
                                     isActiveSlot ? 'border-yellow-400 bg-gray-800 ring-2 ring-yellow-400/50' : 
                                     'border-gray-700 bg-gray-900'
                                 }`}>
                                     {charData ? (
                                         <>
                                            <div className="w-20 h-full bg-gray-950">
                                                <img src={charData.img} className="w-full h-full object-cover object-top" />
                                            </div>
                                            <div className="pl-4 font-bold text-white text-lg">{charData.name}</div>
                                         </>
                                     ) : (
                                         <div className="pl-4 text-gray-600 font-mono text-sm flex items-center gap-2">
                                             {isActiveSlot && <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>}
                                             PICK {i+1}
                                         </div>
                                     )}
                                 </div>
                             )
                         })}
                    </div>
                </div>

                {/* CENTRAL POOL */}
                <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50 backdrop-blur-sm">
                    <div className="text-center text-gray-400 text-xs mb-4 flex items-center justify-center gap-2">
                        <GripVertical size={14} />
                        Arraste os personagens para selecionar ou clique neles
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                        {CHARACTERS_DB.map(char => {
                            const isSelected = teamAPicks.includes(char.name) || teamBPicks.includes(char.name);
                            const isBanned = teamABan === char.name || teamBBan === char.name;
                            const isDisabled = isSelected || isBanned;

                            return (
                                <button
                                    key={char.name}
                                    draggable={!isDisabled && !isComplete}
                                    onDragStart={(e) => onDragStart(e, char.name)}
                                    disabled={isDisabled || isComplete}
                                    onClick={() => handleCharacterSelect(char.name)}
                                    className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all group ${
                                        isBanned ? 'border-red-900 grayscale opacity-40' :
                                        isSelected ? 'border-yellow-500/50 opacity-40 grayscale' :
                                        'border-gray-700 hover:border-brand-500 hover:scale-110 hover:z-10 cursor-grab active:cursor-grabbing bg-gray-900'
                                    }`}
                                >
                                    <img src={char.img} alt={char.name} className="w-full h-full object-cover object-top pointer-events-none" loading="lazy" />
                                    
                                    <div className="absolute bottom-0 w-full bg-black/80 py-1 text-[10px] font-bold text-center text-white truncate">
                                        {char.name}
                                    </div>

                                    {/* Overlay Status */}
                                    {isBanned && <div className="absolute inset-0 flex items-center justify-center"><X className="text-red-600 w-10 h-10" /></div>}
                                    {isSelected && <div className="absolute inset-0 flex items-center justify-center"><CheckCircle className="text-yellow-500 w-10 h-10" /></div>}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* TEAM B SIDE */}
                <div className="space-y-4 text-right">
                    <input 
                        value={teamBName} 
                        onChange={(e) => setTeamBName(e.target.value)}
                        className="w-full bg-transparent text-3xl font-black text-teamB uppercase outline-none text-center border-b border-transparent focus:border-teamB"
                    />
                    
                     {/* Ban Card */}
                     <div className="relative aspect-video bg-gray-900 border-2 border-red-900/50 rounded-xl overflow-hidden flex items-center justify-center grayscale opacity-90 ml-auto group transition-all hover:border-red-600">
                         {teamBBan ? (
                             <img src={CHARACTERS_DB.find(c => c.name === teamBBan)?.img} className="w-full h-full object-cover object-top" />
                         ) : (
                             <span className="text-red-900 font-black text-4xl">BAN</span>
                         )}
                         <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-bold shadow">BANIDO</div>
                    </div>

                    {/* Pick Cards */}
                    <div className="space-y-2">
                         {Array.from({length: 4}).map((_, i) => {
                             const charName = teamBPicks[i];
                             const charData = CHARACTERS_DB.find(c => c.name === charName);
                             // Highlight active pick slot
                             const isActiveSlot = !isComplete && currentOrder[draftIndex].team === 'B' && currentOrder[draftIndex].type === 'pick' && teamBPicks.length === i;

                             return (
                                 <div key={i} className={`relative h-20 rounded-lg border-r-4 flex flex-row-reverse items-center overflow-hidden transition-all ${
                                     charData ? 'border-teamB bg-gray-800' : 
                                     isActiveSlot ? 'border-yellow-400 bg-gray-800 ring-2 ring-yellow-400/50' :
                                     'border-gray-700 bg-gray-900'
                                 }`}>
                                     {charData ? (
                                         <>
                                            <div className="w-20 h-full bg-gray-950">
                                                <img src={charData.img} className="w-full h-full object-cover object-top" />
                                            </div>
                                            <div className="pr-4 font-bold text-white text-lg">{charData.name}</div>
                                         </>
                                     ) : (
                                         <div className="pr-4 text-gray-600 font-mono text-sm flex items-center gap-2">
                                             {isActiveSlot && <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>}
                                             PICK {i+1}
                                         </div>
                                     )}
                                 </div>
                             )
                         })}
                    </div>
                </div>

            </div>

             {/* Finish Match Modal */}
             {showFinishModal && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                     <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-lg w-full shadow-2xl">
                         <h3 className="text-2xl font-black text-center mb-2 uppercase">Resultado da Queda {currentMatchIndex + 1}</h3>
                         <p className="text-center text-brand-500 font-bold mb-6 text-xl">{seriesMaps[currentMatchIndex]}</p>
                         
                         <div className="grid grid-cols-2 gap-8 mb-8">
                             <div 
                                onClick={() => setPendingWinner('A')}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${pendingWinner === 'A' ? 'border-teamA bg-teamA/20' : 'border-gray-700 bg-gray-800 hover:border-teamA'}`}
                             >
                                 <div className="text-teamA font-black text-xl mb-2">{teamAName}</div>
                                 <div className="text-xs text-gray-400 mb-2">Placar</div>
                                 <input 
                                    type="number" 
                                    min="0" max={roundsPerMatch}
                                    value={pendingScoreA}
                                    onChange={(e) => setPendingScoreA(parseInt(e.target.value))}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-16 h-12 text-center text-2xl font-black bg-black rounded border border-gray-600 focus:border-teamA outline-none"
                                 />
                             </div>

                             <div 
                                onClick={() => setPendingWinner('B')}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${pendingWinner === 'B' ? 'border-teamB bg-teamB/20' : 'border-gray-700 bg-gray-800 hover:border-teamB'}`}
                             >
                                 <div className="text-teamB font-black text-xl mb-2">{teamBName}</div>
                                 <div className="text-xs text-gray-400 mb-2">Placar</div>
                                 <input 
                                    type="number" 
                                    min="0" max={roundsPerMatch}
                                    value={pendingScoreB}
                                    onChange={(e) => setPendingScoreB(parseInt(e.target.value))}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-16 h-12 text-center text-2xl font-black bg-black rounded border border-gray-600 focus:border-teamB outline-none"
                                 />
                             </div>
                         </div>
                         
                         <div className="text-center text-xs text-gray-500 mb-6">
                            Para vencer a partida, é necessário atingir <strong>{Math.ceil(roundsPerMatch / 2)} rounds</strong>.
                         </div>

                         <div className="flex gap-4">
                             <button onClick={() => setShowFinishModal(false)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-400 font-bold rounded-xl">
                                 Cancelar
                             </button>
                             <button onClick={confirmFinishMatch} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg">
                                 Confirmar Resultado
                             </button>
                         </div>
                     </div>
                 </div>
             )}
        </div>
    );
  };

  const renderHistory = () => {
    // Logic to determine if series is over
    const requiredWins = Math.ceil(mdFormat / 2);
    const winsA = matchHistory.filter(m => m.winner === 'A').length;
    const winsB = matchHistory.filter(m => m.winner === 'B').length;
    const isSeriesFinished = winsA >= requiredWins || winsB >= requiredWins || matchHistory.length >= mdFormat;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
            <div className="flex justify-between items-center no-print">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('home')} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700"><ChevronLeft /></button>
                    <div>
                        <h2 className="text-3xl font-bold">Histórico da Série</h2>
                        <p className="text-gray-500">
                            {teamAName} <strong className="text-brand-500 text-lg mx-1">{scoreA}</strong> 
                            vs 
                            <strong className="text-brand-500 text-lg mx-1">{scoreB}</strong> {teamBName}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {!isSeriesFinished ? (
                        <button onClick={handleStartDraft} className="bg-brand-500 hover:bg-brand-600 text-gray-900 px-6 py-2 rounded-lg font-bold flex items-center gap-2">
                            Próxima Partida <Play size={16} />
                        </button>
                    ) : (
                        <button onClick={() => setView('result')} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 animate-pulse">
                            Ver Resultado Geral <Crown size={16} />
                        </button>
                    )}
                    <button onClick={() => downloadDivAsImage('series-history', 'historico-serie')} className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                        <Download size={16} /> Baixar
                    </button>
                </div>
            </div>

            <div id="series-history" className="space-y-8 bg-gray-950 p-6 min-h-screen">
                {matchHistory.map((match, idx) => (
                    <div key={idx} className="bg-gray-900 rounded-2xl border border-gray-800 p-6 shadow-xl relative overflow-hidden">
                        {/* Winner Overlay Strip */}
                        {match.winner && (
                            <div className={`absolute left-0 top-0 bottom-0 w-2 ${match.winner === 'A' ? 'bg-teamA' : 'bg-teamB'}`}></div>
                        )}

                        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-brand-500 text-gray-900 font-black px-3 py-1 rounded text-sm">QUEDA {match.matchIndex}</div>
                                <span className="text-2xl font-black text-white uppercase">{match.map}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-xs font-mono text-gray-500 uppercase">{match.mode}</div>
                                <div className={`text-xl font-black px-4 py-1 rounded bg-black/40 border border-gray-700`}>
                                    <span className="text-teamA">{match.scoreA}</span>
                                    <span className="text-gray-500 mx-2">x</span>
                                    <span className="text-teamB">{match.scoreB}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-[1fr_auto_1fr] gap-8 mb-6">
                            {/* Team A Result */}
                            <div>
                                <h4 className={`font-bold mb-2 uppercase text-sm ${match.winner === 'A' ? 'text-teamA' : 'text-gray-400'}`}>
                                    {teamAName} {match.winner === 'A' && <Trophy size={14} className="inline ml-1" />}
                                </h4>
                                <div className="flex flex-col gap-2">
                                     <div className="flex items-center gap-2 mb-2 bg-red-900/10 p-2 rounded-lg border border-red-900/30">
                                         <span className="text-xs font-bold text-red-500">BAN</span>
                                         <CharacterCard name={match.bans.A} type="Ban" size="sm" isBan={true} />
                                     </div>
                                     <div className="flex gap-2">
                                        {match.picks.A.map(p => (
                                            <CharacterCard key={p} name={p} type="A" size="md" />
                                        ))}
                                     </div>
                                </div>
                            </div>

                            {/* VS Divider */}
                            <div className="flex flex-col items-center justify-center">
                                <div className="h-full w-px bg-gray-800"></div>
                            </div>

                            {/* Team B Result */}
                            <div className="text-right flex flex-col items-end">
                                <h4 className={`font-bold mb-2 uppercase text-sm ${match.winner === 'B' ? 'text-teamB' : 'text-gray-400'}`}>
                                    {teamBName} {match.winner === 'B' && <Trophy size={14} className="inline ml-1" />}
                                </h4>
                                <div className="flex flex-col gap-2 items-end">
                                     <div className="flex items-center gap-2 mb-2 bg-red-900/10 p-2 rounded-lg border border-red-900/30">
                                         <CharacterCard name={match.bans.B} type="Ban" size="sm" isBan={true} />
                                         <span className="text-xs font-bold text-red-500">BAN</span>
                                     </div>
                                     <div className="flex gap-2 justify-end">
                                        {match.picks.B.map(p => (
                                            <CharacterCard key={p} name={p} type="B" size="md" />
                                        ))}
                                     </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Timeline Visual */}
                        <div className="mt-4 pt-4 border-t border-gray-800">
                             <Timeline match={match} teamA={teamAName} teamB={teamBName} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  const renderSeriesResult = () => {
      const winner = scoreA > scoreB ? 'A' : 'B';
      const winnerName = winner === 'A' ? teamAName : teamBName;
      const winnerColor = winner === 'A' ? 'text-teamA' : 'text-teamB';
      const winnerBg = winner === 'A' ? 'bg-teamA/10 border-teamA' : 'bg-teamB/10 border-teamB';

      return (
          <div className="max-w-6xl mx-auto animate-fade-in pb-20">
               <div className="flex justify-between items-center no-print mb-6">
                  <button onClick={() => setView('home')} className="text-gray-500 hover:text-white flex items-center gap-2">
                      <ChevronLeft /> Voltar ao Início
                  </button>
                  <button onClick={() => downloadDivAsImage('full-series-report', 'resultado-serie')} className="bg-brand-500 text-gray-900 px-6 py-2 rounded-lg font-bold shadow-lg hover:scale-105 transition-transform">
                      <Download className="inline mr-2" size={18} /> Baixar Relatório
                  </button>
               </div>

               <div id="full-series-report" className="bg-gray-950 p-8 min-h-screen text-white">
                   {/* Header Banner */}
                   <div className={`rounded-3xl p-10 text-center border-2 mb-10 relative overflow-hidden ${winnerBg}`}>
                        <div className="relative z-10">
                            <h4 className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-4">Vencedor da Série MD{mdFormat}</h4>
                            <h1 className={`text-6xl md:text-8xl font-black uppercase mb-4 ${winnerColor} drop-shadow-lg`}>{winnerName}</h1>
                            <div className="inline-flex items-center bg-black/50 rounded-xl px-8 py-4 border border-gray-700 gap-6">
                                <div className="text-center">
                                    <div className="text-teamA font-bold text-lg">{teamAName}</div>
                                    <div className="text-4xl font-black">{scoreA}</div>
                                </div>
                                <div className="text-gray-500 font-thin text-4xl">X</div>
                                <div className="text-center">
                                    <div className="text-teamB font-bold text-lg">{teamBName}</div>
                                    <div className="text-4xl font-black">{scoreB}</div>
                                </div>
                            </div>
                        </div>
                   </div>

                   {/* Matches Grid */}
                   <div className="grid grid-cols-1 gap-6">
                       {matchHistory.map((match) => (
                           <div key={match.matchIndex} className="bg-gray-900 rounded-xl border border-gray-800 p-6 flex flex-col xl:flex-row gap-6 items-center">
                               {/* Map & Score Info */}
                               <div className="w-full xl:w-48 text-center xl:text-left border-b xl:border-b-0 xl:border-r border-gray-800 pb-4 xl:pb-0 xl:pr-6">
                                   <div className="bg-gray-800 text-xs font-bold px-2 py-1 rounded inline-block mb-2">QUEDA {match.matchIndex}</div>
                                   <div className="text-2xl font-black uppercase text-brand-500 mb-2">{match.map}</div>
                                   <div className="text-xl font-bold">
                                       <span className={match.winner === 'A' ? 'text-teamA' : 'text-gray-500'}>{match.scoreA}</span>
                                       <span className="mx-2 text-gray-600">x</span>
                                       <span className={match.winner === 'B' ? 'text-teamB' : 'text-gray-500'}>{match.scoreB}</span>
                                   </div>
                               </div>

                               {/* Timeline Visualization */}
                               <div className="flex-1 w-full overflow-hidden">
                                   <div className="flex justify-between text-xs text-gray-500 font-bold uppercase mb-2">
                                       <span>{teamAName}</span>
                                       <span>{teamBName}</span>
                                   </div>
                                   
                                   {/* Bans Row */}
                                   <div className="flex justify-between items-center bg-red-900/10 p-2 rounded-lg mb-4 border border-red-900/20">
                                       <div className="flex items-center gap-2">
                                           <span className="text-xs text-red-500 font-bold mr-2">BAN</span>
                                           <CharacterCard name={match.bans.A} type="Ban" size="sm" isBan={true} />
                                           <span className="text-xs font-bold text-red-300 uppercase">{match.bans.A}</span>
                                       </div>
                                       
                                       <div className="text-xs text-red-900 font-mono">X</div>

                                       <div className="flex items-center gap-2">
                                           <span className="text-xs font-bold text-red-300 uppercase">{match.bans.B}</span>
                                           <CharacterCard name={match.bans.B} type="Ban" size="sm" isBan={true} />
                                           <span className="text-xs text-red-500 font-bold ml-2">BAN</span>
                                       </div>
                                   </div>

                                   {/* Picks Row */}
                                   <div className="grid grid-cols-2 gap-8">
                                       <div className="flex gap-2 justify-start">
                                            {match.picks.A.map((char) => (
                                                <CharacterCard key={char} name={char} type="A" size="md" />
                                            ))}
                                       </div>
                                       
                                       <div className="flex gap-2 justify-end">
                                            {match.picks.B.map((char) => (
                                                <CharacterCard key={char} name={char} type="B" size="md" />
                                            ))}
                                       </div>
                                   </div>
                                   
                                   {/* Timeline Component Embedded in Summary */}
                                   <div className="mt-4 pt-4 border-t border-gray-800">
                                        <Timeline match={match} teamA={teamAName} teamB={teamBName} />
                                   </div>

                               </div>
                           </div>
                       ))}
                   </div>
                   
                   <div className="mt-10 text-center text-gray-600 text-xs font-mono uppercase border-t border-gray-900 pt-6">
                       Gerado por Jhan Medeiros Analytics Platform
                   </div>
               </div>
          </div>
      );
  };

  return (
    <div className="min-h-screen">
       {/* Breadcrumb-ish nav for non-draft pages */}
       {view !== 'home' && view !== 'draft' && view !== 'result' && (
           <div className="max-w-6xl mx-auto py-4 px-4 flex gap-2 text-sm font-bold text-gray-500">
               <button onClick={() => setView('home')} className="hover:text-white">Início</button>
               <span>/</span>
               <span className="text-brand-500 uppercase">{view}</span>
           </div>
       )}

       <div className="container mx-auto px-4 py-4">
          {view === 'home' && renderHome()}
          {view === 'mode' && renderMode()}
          {view === 'format' && renderFormat()}
          {view === 'maps' && renderMaps()}
          {view === 'draft' && renderDraft()}
          {view === 'history' && renderHistory()}
          {view === 'result' && renderSeriesResult()}
       </div>
    </div>
  );
};

export default PicksBans;