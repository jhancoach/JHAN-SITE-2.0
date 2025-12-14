
import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Map as MapIcon, Shield, Users, 
  ChevronRight, Play, RefreshCw, LayoutGrid, 
  CheckCircle, History, Download, X, Sword, MonitorPlay, ChevronLeft, Save,
  RotateCcw, GripVertical, CheckSquare, Settings, Crown, AlertTriangle, ArrowRight, Clock, Pause,
  Search, Zap, Lock, Edit2, CornerDownRight, Timer
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
  orderSnapshot: DraftStep[]; 
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

// Updated to match pool card style (Portrait, Rounded, Border)
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
                className={`relative h-full aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all duration-300 cursor-pointer ${
                    isActive 
                    ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)] scale-105 z-10 bg-gray-800' 
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

const CharacterCardSmall: React.FC<{ 
    name: string | null, 
    type?: 'A' | 'B' | 'Ban', 
    size?: 'sm' | 'md' | 'lg', 
    isBan?: boolean,
    label?: string 
}> = ({ name, type, size = 'md', isBan, label }) => {
    const data = CHARACTERS_DB.find(c => c.name === name);
    const sizeCls = size === 'sm' ? 'w-8 h-8 md:w-10 md:h-10' : size === 'md' ? 'w-12 h-12' : 'w-20 h-20';
    
    let borderCls = 'border-gray-800';
    if(type === 'A') borderCls = 'border-teamA shadow-[0_0_5px_rgba(59,130,246,0.3)]';
    if(type === 'B') borderCls = 'border-teamB shadow-[0_0_5px_rgba(249,115,22,0.3)]';
    if(type === 'Ban') borderCls = 'border-red-600 grayscale opacity-80';

    return (
        <div className="flex flex-col items-center gap-0.5">
            <div className={`${sizeCls} rounded border ${borderCls} bg-gray-900 relative overflow-hidden flex-shrink-0 group`}>
                {data ? (
                    <>
                        <img src={data.img} className={`w-full h-full object-cover object-[50%_15%] ${isBan ? 'grayscale opacity-50' : ''}`} />
                        {isBan && <div className="absolute inset-0 flex items-center justify-center text-red-500 font-bold bg-black/40"><X size={size === 'sm' ? 10 : 16} /></div>}
                        
                        <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[6px] text-center text-white font-bold truncate px-0.5 py-px">
                            {data.name}
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700 font-black text-[8px]">?</div>
                )}
            </div>
            {label && <span className="text-[8px] font-bold text-gray-500 uppercase">{label}</span>}
        </div>
    );
};

const DraftTimeline: React.FC<{ record: MatchRecord }> = ({ record }) => {
    const steps = record.orderSnapshot || ORDERS[record.mode as DraftMode] || ORDERS['snake'];
    let pickIndexA = 0;
    let pickIndexB = 0;

    const timelineItems = steps.map((step, idx) => {
        let charName: string | null = null;
        let isBan = step.type === 'ban';
        
        if (isBan) {
            charName = step.team === 'A' ? record.bans.A : record.bans.B;
        } else {
            if (step.team === 'A') {
                charName = record.picks.A[pickIndexA] || null;
                pickIndexA++;
            } else {
                charName = record.picks.B[pickIndexB] || null;
                pickIndexB++;
            }
        }

        return { ...step, charName, isBan, id: idx };
    });

    return (
        <div className="w-full overflow-x-auto custom-scrollbar pb-2">
            <div className="flex items-start gap-2 min-w-max px-2">
                {timelineItems.map((item) => (
                    <div key={item.id} className="relative group">
                        {item.id < timelineItems.length - 1 && (
                            <div className="absolute top-1/2 right-[-10px] w-[10px] h-0.5 bg-gray-800 z-0"></div>
                        )}
                        <CharacterCardSmall 
                            name={item.charName} 
                            type={item.isBan ? 'Ban' : item.team} 
                            isBan={item.isBan}
                            size="sm"
                            label={item.isBan ? 'BAN' : item.type === 'pick' ? 'PICK' : ''}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

const PicksBans: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');
  const [hasSaved, setHasSaved] = useState(false);
  const [mode, setMode] = useState<DraftMode>('snake');
  const [format, setFormat] = useState(3);
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
  const [searchTerm, setSearchTerm] = useState('');
  const [timer, setTimer] = useState(30);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<{ team: 'A' | 'B', type: 'ban' | 'pick', index?: number } | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [editingMatchIndex, setEditingMatchIndex] = useState<number | null>(null);
  const [tempResult, setTempResult] = useState({ 
      winner: 'A' as Winner, scoreA: 0, scoreB: 0, bans: { A: null as string|null, B: null as string|null }, picks: { A: [] as string[], B: [] as string[] }
  });
  const [editCharSelector, setEditCharSelector] = useState<{ team: 'A' | 'B', type: 'ban' | 'pick', index?: number } | null>(null);

  useEffect(() => { const saved = localStorage.getItem('pb_session'); if (saved) setHasSaved(true); }, []);
  
  const getOrder = () => {
      const base = ORDERS[mode];
      if (currentMatch % 2 !== 0) return base.map(s => ({ ...s, team: s.team === 'A' ? 'B' : 'A' }));
      return base;
  };
  const order = getOrder();
  const currentStep = order[stepIndex];
  const isComplete = stepIndex >= order.length;

  useEffect(() => {
      if (view === 'draft' && !isComplete && timer > 0) {
          const interval = setInterval(() => setTimer(t => t - 1), 1000);
          return () => clearInterval(interval);
      }
  }, [view, stepIndex, timer]);

  const saveSession = () => {
      localStorage.setItem('pb_session', JSON.stringify({
          view, mode, format, rounds, drawRule, maps, currentMatch, history, teamA, teamB, stepIndex, bans, picksA, picksB
      }));
      setHasSaved(true);
  };

  const loadSession = () => {
      const saved = localStorage.getItem('pb_session');
      if (saved) {
          const data = JSON.parse(saved);
          setView(data.view); setMode(data.mode); setFormat(data.format); setRounds(data.rounds);
          setDrawRule(data.drawRule); setMaps(data.maps); setCurrentMatch(data.currentMatch);
          setHistory(data.history); setTeamA(data.teamA); setTeamB(data.teamB);
          setStepIndex(data.stepIndex); setBans(data.bans); setPicksA(data.picksA); setPicksB(data.picksB);
      }
  };

  const resetAll = () => {
      if(confirm('Iniciar novo apagará o progresso atual.')) {
          localStorage.removeItem('pb_session');
          setHasSaved(false); setView('home'); setStepIndex(0); setBans({A:null, B:null}); setPicksA([]); setPicksB([]); setHistory([]); setCurrentMatch(0);
      }
  };

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

  const openResultModal = (isEditing = false, index: number | null = null) => {
      if (isEditing && index !== null) {
          const record = history[index];
          setTempResult({ winner: record.winner, scoreA: record.scoreA, scoreB: record.scoreB, bans: record.bans, picks: record.picks });
          setEditingMatchIndex(index);
      } else {
          setTempResult({ winner: null, scoreA: 0, scoreB: 0, bans, picks: { A: picksA, B: picksB } });
          setEditingMatchIndex(null);
      }
      setShowResultModal(true);
  };

  const finalizeMatch = () => {
      if (!tempResult.winner) {
          alert("Por favor, selecione o time vencedor e informe o placar antes de finalizar.");
          return;
      }

      if (editingMatchIndex !== null) {
          const updatedHistory = [...history];
          updatedHistory[editingMatchIndex] = { ...updatedHistory[editingMatchIndex], winner: tempResult.winner, scoreA: tempResult.scoreA, scoreB: tempResult.scoreB, bans: tempResult.bans, picks: tempResult.picks };
          setHistory(updatedHistory); setShowResultModal(false); setEditingMatchIndex(null);
      } else {
          const record: MatchRecord = { matchIndex: currentMatch + 1, map: maps[currentMatch], mode, bans, picks: { A: picksA, B: picksB }, rounds, winner: tempResult.winner, scoreA: tempResult.scoreA, scoreB: tempResult.scoreB, orderSnapshot: order };
          const newHistory = [...history, record]; setHistory(newHistory); setShowResultModal(false);
          const winsA = newHistory.filter(r => r.winner === 'A').length; const winsB = newHistory.filter(r => r.winner === 'B').length; const needed = Math.ceil(format / 2);
          if (winsA >= needed || winsB >= needed || newHistory.length === format) setView('result'); else { setCurrentMatch(prev => prev + 1); setView('history'); }
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                  <button onClick={() => setView('mode')} className="group relative overflow-hidden bg-gray-950 border border-gray-800 rounded-3xl p-8 hover:border-brand-500 transition-all duration-500 hover:shadow-[0_0_30px_rgba(234,179,8,0.1)]">
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black opacity-50"></div>
                      <div className="relative z-10 flex flex-col items-start"><div className="p-3 bg-gray-900 rounded-2xl mb-4 text-brand-500 border border-gray-800 group-hover:scale-110 transition-transform"><Sword size={32} /></div><h2 className="text-2xl font-black text-white mb-1 uppercase">Novo Draft</h2><p className="text-sm text-gray-500">Iniciar nova série MD3, MD5 ou MD7.</p></div>
                  </button>
                  <button onClick={() => { setMode('snake'); setView('format'); }} className="group relative overflow-hidden bg-gray-950 border border-gray-800 rounded-3xl p-8 hover:border-blue-500 transition-all duration-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black opacity-50"></div>
                      <div className="relative z-10 flex flex-col items-start"><div className="p-3 bg-gray-900 rounded-2xl mb-4 text-blue-500 border border-gray-800 group-hover:scale-110 transition-transform"><MapIcon size={32} /></div><h2 className="text-2xl font-black text-white mb-1 uppercase">Sorteio de Mapas</h2><p className="text-sm text-gray-500">Gerar apenas a rotação de mapas.</p></div>
                  </button>
              </div>
          </div>
      );
  }

  if (view === 'mode' || view === 'format') {
      return (
          <div className="max-w-4xl mx-auto py-10 px-4 animate-fade-in">
              <button onClick={() => setView(view === 'mode' ? 'home' : 'mode')} className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors"><ChevronLeft /> Voltar</button>
              <div className="text-center mb-12"><h2 className="text-3xl font-black uppercase text-white mb-2">{view === 'mode' ? 'Modo de Draft' : 'Formato da Série'}</h2><div className="h-1 w-20 bg-brand-500 mx-auto rounded-full"></div></div>
              {view === 'mode' ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[{id:'snake', l:'Snake', d:'1-2-2-1'}, {id:'linear', l:'Linear', d:'1-1-1-1'}, {id:'mirrored', l:'Espelhado', d:'Simultâneo'}].map(m => (
                          <button key={m.id} onClick={() => { setMode(m.id as DraftMode); setView('format'); }} className={`p-6 rounded-2xl border-2 transition-all hover:scale-105 ${mode === m.id ? 'bg-gray-800 border-brand-500 text-white' : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-600'}`}><div className="text-xl font-bold uppercase">{m.l}</div><div className="text-xs opacity-60 mt-1">{m.d}</div></button>
                      ))}
                  </div>
              ) : (
                  <div className="space-y-8">
                      <div className="flex justify-center gap-4">{[1, 3, 5, 7].map(f => (<button key={f} onClick={() => setFormat(f)} className={`w-20 h-20 rounded-2xl border-2 font-black text-2xl transition-all ${format === f ? 'bg-brand-500 text-black border-brand-500 scale-110 shadow-lg' : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-600'}`}>MD{f}</button>))}</div>
                      <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 max-w-md mx-auto"><label className="text-xs font-bold uppercase text-gray-500 mb-3 block">Regra de Mapas</label><div className="grid grid-cols-3 gap-2">{['no-repeat', 'repeat', 'fixed'].map(r => (<button key={r} onClick={() => setDrawRule(r as MapDrawType)} className={`py-2 rounded-lg text-xs font-bold uppercase ${drawRule === r ? 'bg-white text-black' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}>{r === 'no-repeat' ? 'Sem Repetir' : r}</button>))}</div><button onClick={drawMaps} className="w-full mt-6 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all">Sortear Mapas &rarr;</button></div>
                  </div>
              )}
          </div>
      );
  }

  if (view === 'maps') {
      return (
          <div className="max-w-5xl mx-auto py-8 px-4 animate-fade-in">
              <div className="flex justify-between items-center mb-8"><button onClick={() => setView('format')} className="text-gray-500 hover:text-white flex gap-2"><ChevronLeft /> Voltar</button><h2 className="text-2xl font-black uppercase tracking-wider">Mapas da Série</h2><button onClick={startDraft} className="bg-brand-500 hover:bg-brand-400 text-black px-6 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all">Iniciar Draft <Play size={16} fill="currentColor" /></button></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">{maps.map((m, i) => (<div key={i} className="group relative aspect-video bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-brand-500 transition-all shadow-lg hover:shadow-brand-500/10"><img src={MAPS_DB.find(x => x.name === m)?.img} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" /><div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[1px]"><div className="text-xs font-bold bg-brand-500 text-black px-2 py-0.5 rounded mb-2">QUEDA {i+1}</div><div className="text-xl font-black text-white uppercase drop-shadow-lg">{m}</div></div></div>))}</div>
          </div>
      );
  }

  if (view === 'draft') {
      return (
          <div className="h-screen flex flex-col bg-gray-950 text-white animate-fade-in select-none overflow-hidden">
              {/* 1. Header (Match Info) */}
              <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 z-20 shrink-0">
                  <div className="flex items-center gap-2 w-1/3"><button onClick={() => setView('maps')} className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white"><ChevronLeft size={16}/></button><input value={teamA} onChange={e => setTeamA(e.target.value)} className="bg-transparent text-lg font-black text-teamA uppercase border-b border-transparent focus:border-teamA outline-none w-full" /><span className="text-xl font-black text-white">{history.filter(h => h.winner === 'A').length}</span></div>
                  <div className="flex flex-col items-center justify-center w-1/3"><div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden md:block">MAPA {currentMatch + 1}</div><div className="text-base md:text-lg font-black text-white uppercase tracking-wider text-brand-500">{maps[currentMatch]}</div></div>
                  <div className="flex items-center gap-2 w-1/3 justify-end"><span className="text-xl font-black text-white">{history.filter(h => h.winner === 'B').length}</span><input value={teamB} onChange={e => setTeamB(e.target.value)} className="bg-transparent text-lg font-black text-teamB uppercase border-b border-transparent focus:border-teamB outline-none w-full text-right" /><div className="flex gap-1 ml-2"><button onClick={undo} disabled={stepIndex === 0} className="p-1.5 bg-gray-800 rounded hover:bg-gray-700 text-gray-400 disabled:opacity-30"><RotateCcw size={14}/></button>{!isComplete && (<button onClick={() => openResultModal(false)} className="p-1.5 bg-green-900 hover:bg-green-800 text-green-200 rounded font-bold text-[10px]">FIM</button>)}</div></div>
              </div>

              {/* 2. Broadcast Strip (Moved to Top) */}
              <div className="h-[120px] md:h-[140px] bg-black border-b-2 border-gray-800 shrink-0 relative z-30 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
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

              {/* 3. Character Pool (Below Strip) */}
              <div className="flex-1 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-gray-950 p-4 overflow-y-auto custom-scrollbar flex flex-col items-center">
                  <div className="w-full max-w-4xl mb-4 relative"><input type="text" placeholder="BUSCAR..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-full px-6 py-2 text-white focus:border-brand-500 outline-none shadow-lg text-center font-bold tracking-widest uppercase text-sm"/><Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"/></div>
                  <div className="grid grid-cols-10 md:grid-cols-12 lg:grid-cols-14 gap-1 w-full max-w-[1600px] px-2 pb-4">
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

              {modalOpen && activeSlot && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in p-4">
                      <div className="bg-gray-900 border border-gray-700 rounded-3xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                          <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900">
                              <div><h3 className="text-xl font-black uppercase text-white flex items-center gap-2">{activeSlot.type === 'ban' ? <X className="text-red-500"/> : <CheckCircle className="text-green-500"/>} Selecionar {activeSlot.type === 'ban' ? 'Banimento' : 'Pick'} - {activeSlot.team === 'A' ? teamA : teamB}</h3><p className="text-gray-500 text-sm">Escolha um personagem ativo para este slot.</p></div>
                              <div className="flex items-center gap-4"><div className="relative"><input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-gray-800 border border-gray-600 rounded-full px-4 py-2 text-sm text-white focus:border-brand-500 outline-none" autoFocus /><Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"/></div><button onClick={() => setModalOpen(false)} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 hover:text-white transition-colors"><X /></button></div>
                          </div>
                          <div className="flex-1 overflow-y-auto p-6 bg-black/20"><div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">{filteredCharacters.map(char => { const picked = picksA.includes(char.name) || picksB.includes(char.name); const banned = bans.A === char.name || bans.B === char.name; const disabled = picked || banned; return (<div key={char.name} onClick={() => !disabled && handleManualUpdate(char.name, activeSlot.team, activeSlot.type, activeSlot.index)} className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${disabled ? 'border-gray-800 grayscale opacity-40 cursor-not-allowed' : 'border-gray-700 hover:border-brand-500 hover:scale-105'}`}><img src={char.img} className="w-full h-full object-cover object-top" /><div className="absolute bottom-0 inset-x-0 bg-black/80 py-1 px-1 text-center border-t border-white/10"><p className="text-white font-black text-[9px] uppercase truncate">{char.name}</p></div>{disabled && <div className="absolute inset-0 bg-black/50 flex items-center justify-center font-bold text-red-500 uppercase rotate-45 border-2 border-red-500 rounded-lg m-4">Indisponível</div>}</div>) })}</div></div>
                      </div>
                  </div>
              )}

              {showResultModal && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in">
                      <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8 max-w-4xl w-full shadow-2xl overflow-y-auto max-h-[90vh]">
                          <h3 className="text-2xl font-black text-center mb-6 uppercase text-white">{editingMatchIndex !== null ? 'Editar Partida Completa' : `Resultado - ${maps[currentMatch]}`}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                              <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700"><div onClick={() => setTempResult(p => ({...p, winner: 'A'}))} className={`cursor-pointer p-4 rounded-xl border-2 text-center mb-4 transition-all ${tempResult.winner === 'A' ? 'bg-teamA/20 border-teamA' : 'border-transparent'}`}><div className="text-teamA font-black text-xl mb-2">{teamA}</div><input type="number" min="0" value={tempResult.scoreA} onChange={(e) => setTempResult(p => ({...p, scoreA: parseInt(e.target.value)}))} onClick={e => e.stopPropagation()} className="w-20 bg-black border border-gray-600 rounded-lg text-center text-2xl font-bold py-2 outline-none focus:border-teamA" /></div>{editingMatchIndex !== null && (<div className="space-y-4"><div className="flex items-center justify-between bg-black/30 p-2 rounded-lg border border-red-900/30"><span className="text-xs font-bold text-red-500 uppercase">Ban</span><button onClick={() => setEditCharSelector({team: 'A', type: 'ban'})} className="flex items-center gap-2 hover:bg-white/5 px-2 py-1 rounded"><span className="text-sm font-bold">{tempResult.bans.A || 'Selecionar'}</span><Edit2 size={12} className="text-gray-500"/></button></div><div className="grid grid-cols-4 gap-2">{Array.from({length: 4}).map((_, i) => (<button key={i} onClick={() => setEditCharSelector({team: 'A', type: 'pick', index: i})} className="aspect-square bg-black/30 rounded border border-gray-700 hover:border-teamA relative overflow-hidden group">{tempResult.picks.A[i] ? (<img src={CHARACTERS_DB.find(c => c.name === tempResult.picks.A[i])?.img} className="w-full h-full object-cover"/>) : <span className="text-xs text-gray-600">?</span>}<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center"><Edit2 size={12}/></div></button>))}</div></div>)}</div>
                              <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700"><div onClick={() => setTempResult(p => ({...p, winner: 'B'}))} className={`cursor-pointer p-4 rounded-xl border-2 text-center mb-4 transition-all ${tempResult.winner === 'B' ? 'bg-teamB/20 border-teamB' : 'border-transparent'}`}><div className="text-teamB font-black text-xl mb-2">{teamB}</div><input type="number" min="0" value={tempResult.scoreB} onChange={(e) => setTempResult(p => ({...p, scoreB: parseInt(e.target.value)}))} onClick={e => e.stopPropagation()} className="w-20 bg-black border border-gray-600 rounded-lg text-center text-2xl font-bold py-2 outline-none focus:border-teamB" /></div>{editingMatchIndex !== null && (<div className="space-y-4"><div className="flex items-center justify-between bg-black/30 p-2 rounded-lg border border-red-900/30"><span className="text-xs font-bold text-red-500 uppercase">Ban</span><button onClick={() => setEditCharSelector({team: 'B', type: 'ban'})} className="flex items-center gap-2 hover:bg-white/5 px-2 py-1 rounded"><span className="text-sm font-bold">{tempResult.bans.B || 'Selecionar'}</span><Edit2 size={12} className="text-gray-500"/></button></div><div className="grid grid-cols-4 gap-2">{Array.from({length: 4}).map((_, i) => (<button key={i} onClick={() => setEditCharSelector({team: 'B', type: 'pick', index: i})} className="aspect-square bg-black/30 rounded border border-gray-700 hover:border-teamB relative overflow-hidden group">{tempResult.picks.B[i] ? (<img src={CHARACTERS_DB.find(c => c.name === tempResult.picks.B[i])?.img} className="w-full h-full object-cover"/>) : <span className="text-xs text-gray-600">?</span>}<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center"><Edit2 size={12}/></div></button>))}</div></div>)}</div>
                          </div>
                          <div className="flex gap-4"><button onClick={() => setShowResultModal(false)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold text-gray-400">Cancelar</button><button onClick={finalizeMatch} className="flex-1 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-white shadow-lg">Confirmar</button></div>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  if (view === 'history' || view === 'result') {
      const winsA = history.filter(r => r.winner === 'A').length;
      const winsB = history.filter(r => r.winner === 'B').length;
      const finished = view === 'result';

      return (
          <div className="max-w-6xl mx-auto py-10 px-4 animate-fade-in pb-20">
              <div className="flex justify-between items-center mb-8 no-print">
                  <div className="flex items-center gap-4"><button onClick={() => setView('home')} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white"><ChevronLeft/></button><h2 className="text-3xl font-black uppercase">{finished ? 'Resultado Final' : 'Progresso da Série'}</h2></div>
                  <div className="flex gap-2">{!finished && <button onClick={startDraft} className="bg-brand-500 text-black px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-brand-400">Próxima Partida</button>}<button onClick={() => downloadDivAsImage('series-report', 'relatorio-serie')} className="bg-white text-black px-4 py-2 rounded-lg font-bold flex gap-2"><Download size={18}/> Baixar</button></div>
              </div>
              <div id="series-report" className="bg-gray-950 p-8 rounded-3xl border border-gray-800 text-white min-h-[800px]">
                  <div className="flex justify-center items-center gap-10 mb-12"><div className="text-center"><div className="text-4xl font-black text-teamA mb-2">{teamA}</div><div className={`text-6xl font-black ${winsA > winsB ? 'text-white' : 'text-gray-600'}`}>{winsA}</div></div><div className="text-2xl font-thin text-gray-600">VS</div><div className="text-center"><div className="text-4xl font-black text-teamB mb-2">{teamB}</div><div className={`text-6xl font-black ${winsB > winsA ? 'text-white' : 'text-gray-600'}`}>{winsB}</div></div></div>
                  <div className="space-y-6">{history.map((m, i) => (<div key={i} className="bg-gray-900 rounded-2xl border border-gray-800 p-6 flex flex-col gap-4 relative overflow-hidden group"><div className={`absolute left-0 top-0 bottom-0 w-2 ${m.winner === 'A' ? 'bg-teamA' : 'bg-teamB'}`}></div><div className="flex justify-between items-start border-b border-gray-800 pb-4"><div><div className="text-xs font-bold text-gray-500 mb-1">QUEDA {m.matchIndex}</div><div className="text-2xl font-black uppercase text-white">{m.map}</div></div><div className="font-mono text-2xl font-bold text-gray-400">{m.scoreA} - {m.scoreB}</div><button onClick={(e) => { e.stopPropagation(); openResultModal(true, i); }} className="no-print p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-all z-50 cursor-pointer border border-gray-700" title="Editar Resultado Completo"><Edit2 size={16} /></button></div><div className="bg-black/30 p-2 rounded-lg border border-gray-800 overflow-x-auto"><div className="flex items-center gap-2 mb-1"><CornerDownRight size={14} className="text-gray-500"/><span className="text-[10px] uppercase font-bold text-gray-500">Timeline do Draft</span></div><DraftTimeline record={m} /></div><div className="grid grid-cols-2 gap-8 pt-2"><div className="flex items-center gap-4"><div className="flex flex-col items-center"><span className="text-[10px] font-bold text-red-500 uppercase mb-1">Ban</span><CharacterCardSmall name={m.bans.A} type="Ban" size="sm" isBan/></div><div className="flex gap-2">{m.picks.A.map(c => <CharacterCardSmall key={c} name={c} type="A" size="sm" />)}</div></div><div className="flex items-center gap-4 justify-end"><div className="flex gap-2">{m.picks.B.map(c => <CharacterCardSmall key={c} name={c} type="B" size="sm" />)}</div><div className="flex flex-col items-center"><span className="text-[10px] font-bold text-red-500 uppercase mb-1">Ban</span><CharacterCardSmall name={m.bans.B} type="Ban" size="sm" isBan/></div></div></div></div>))}</div>
                  <div className="mt-12 pt-6 border-t border-gray-900 text-center text-xs text-gray-600 font-mono uppercase tracking-widest">Jhan Medeiros Analytics Platform</div>
              </div>
          </div>
      );
  }

  return null;
};

export default PicksBans;
