
import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Map as MapIcon, Shield, Users, 
  ChevronRight, Play, RefreshCw, LayoutGrid, 
  CheckCircle, History, Download, X, Sword, MonitorPlay, ChevronLeft, Save,
  RotateCcw, GripVertical, CheckSquare, Settings, Crown, AlertTriangle, ArrowRight, Clock, Pause,
  Search
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
  { name: 'ALVARO', img: 'https://i.ibb.co/3ykJ2Kz/ALVARO.png' }, // Exemplo placeholder se não houver link
  { name: 'MOCO', img: 'https://i.ibb.co/JqsP1z0/MOCO.png' }, // Exemplo placeholder
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

// --- PICK ORDERS ---
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

// Small card for history view
const CharacterCardSmall: React.FC<{ name: string | null, type?: 'A' | 'B' | 'Ban', size?: 'sm' | 'md' | 'lg', isBan?: boolean }> = ({ name, type, size = 'md', isBan }) => {
    const data = CHARACTERS_DB.find(c => c.name === name);
    const sizeCls = size === 'sm' ? 'w-10 h-10' : size === 'md' ? 'w-14 h-14' : 'w-24 h-24';
    
    let borderCls = 'border-gray-800';
    if(type === 'A') borderCls = 'border-teamA shadow-[0_0_10px_rgba(59,130,246,0.3)]';
    if(type === 'B') borderCls = 'border-teamB shadow-[0_0_10px_rgba(249,115,22,0.3)]';
    if(type === 'Ban') borderCls = 'border-red-600 grayscale opacity-80';

    return (
        <div className={`${sizeCls} rounded-lg border ${borderCls} bg-gray-900 relative overflow-hidden flex-shrink-0 group`}>
            {data ? (
                <>
                    <img src={data.img} className={`w-full h-full object-cover object-top ${isBan ? 'grayscale opacity-50' : ''}`} />
                    {isBan && <div className="absolute inset-0 flex items-center justify-center text-red-500 font-bold bg-black/40"><X size={size === 'sm' ? 12 : 24} /></div>}
                </>
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-700 font-black text-lg">?</div>
            )}
        </div>
    );
};

// --- MAIN PAGE ---

const PicksBans: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');
  const [hasSaved, setHasSaved] = useState(false);
  
  // Configuration
  const [mode, setMode] = useState<DraftMode>('snake');
  const [format, setFormat] = useState(3); // MD3
  const [rounds, setRounds] = useState(13);
  const [drawRule, setDrawRule] = useState<MapDrawType>('no-repeat');
  
  // Game State
  const [maps, setMaps] = useState<string[]>([]);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [history, setHistory] = useState<MatchRecord[]>([]);
  
  // Draft State
  const [teamA, setTeamA] = useState('TIME A');
  const [teamB, setTeamB] = useState('TIME B');
  const [stepIndex, setStepIndex] = useState(0);
  const [bans, setBans] = useState<{A: string|null, B: string|null}>({A: null, B: null});
  const [picksA, setPicksA] = useState<string[]>([]);
  const [picksB, setPicksB] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Helpers for Result
  const [showResultModal, setShowResultModal] = useState(false);
  const [tempResult, setTempResult] = useState({ winner: 'A' as Winner, scoreA: 0, scoreB: 0 });

  // Persistence
  useEffect(() => {
      const saved = localStorage.getItem('pb_session');
      if (saved) setHasSaved(true);
  }, []);

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
          setHasSaved(false);
          setView('home'); setStepIndex(0); setBans({A:null, B:null}); setPicksA([]); setPicksB([]);
          setHistory([]); setCurrentMatch(0);
      }
  };

  // Logic
  const getOrder = () => {
      const base = ORDERS[mode];
      // Swap sides for even matches (0-indexed, so match 1 (index 1) is swapped)
      if (currentMatch % 2 !== 0) {
          return base.map(s => ({ ...s, team: s.team === 'A' ? 'B' : 'A' }));
      }
      return base;
  };
  const order = getOrder();
  const currentStep = order[stepIndex];
  const isComplete = stepIndex >= order.length;

  const handlePick = (char: string) => {
      if (isComplete) return;
      // Validation
      if (bans.A === char || bans.B === char || picksA.includes(char) || picksB.includes(char)) return;

      const step = order[stepIndex];
      if (step.type === 'ban') {
          setBans(prev => ({ ...prev, [step.team]: char }));
      } else {
          if (step.team === 'A') setPicksA(prev => [...prev, char]);
          else setPicksB(prev => [...prev, char]);
      }
      setStepIndex(prev => prev + 1);
      setSearchTerm('');
      saveSession();
  };

  const undo = () => {
      if (stepIndex === 0) return;
      const prevStep = order[stepIndex - 1];
      if (prevStep.type === 'ban') {
          setBans(prev => ({ ...prev, [prevStep.team]: null }));
      } else {
          if (prevStep.team === 'A') setPicksA(prev => prev.slice(0, -1));
          else setPicksB(prev => prev.slice(0, -1));
      }
      setStepIndex(prev => prev - 1);
  };

  const startDraft = () => {
      setStepIndex(0);
      setBans({A: null, B: null});
      setPicksA([]);
      setPicksB([]);
      setView('draft');
  };

  const drawMaps = () => {
      let pool = [...MAPS_DB];
      let selected: string[] = [];
      for (let i = 0; i < format; i++) {
          if (pool.length === 0) pool = [...MAPS_DB];
          const rand = Math.floor(Math.random() * pool.length);
          selected.push(pool[rand].name);
          if (drawRule === 'no-repeat') pool.splice(rand, 1);
      }
      setMaps(selected);
      setView('maps');
  };

  const finalizeMatch = () => {
      const record: MatchRecord = {
          matchIndex: currentMatch + 1,
          map: maps[currentMatch],
          mode,
          bans,
          picks: { A: picksA, B: picksB },
          rounds,
          winner: tempResult.winner,
          scoreA: tempResult.scoreA,
          scoreB: tempResult.scoreB
      };
      const newHistory = [...history, record];
      setHistory(newHistory);
      setShowResultModal(false);

      const winsA = newHistory.filter(r => r.winner === 'A').length;
      const winsB = newHistory.filter(r => r.winner === 'B').length;
      const needed = Math.ceil(format / 2);

      if (winsA >= needed || winsB >= needed || newHistory.length === format) {
          setView('result');
      } else {
          setCurrentMatch(prev => prev + 1);
          setView('history');
      }
      saveSession();
  };

  const filteredCharacters = CHARACTERS_DB.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // --- RENDERERS ---

  if (view === 'home') {
      return (
          <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-fade-in px-4">
              <div className="text-center space-y-2">
                  <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-600 uppercase tracking-tighter">
                      Picks & Bans
                  </h1>
                  <p className="text-gray-500 text-lg uppercase tracking-widest font-medium">Simulador Competitivo Premium</p>
              </div>

              {hasSaved && (
                  <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl flex items-center gap-4 shadow-2xl">
                      <div className="h-10 w-10 bg-brand-500 rounded-full flex items-center justify-center text-black font-bold">!</div>
                      <div className="text-left">
                          <p className="text-white font-bold text-sm">Sessão Encontrada</p>
                          <p className="text-xs text-gray-500">Deseja continuar o draft anterior?</p>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={resetAll} className="px-3 py-2 text-xs font-bold text-red-500 hover:text-red-400">Descartar</button>
                          <button onClick={loadSession} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-bold text-white transition-colors">Continuar</button>
                      </div>
                  </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                  <button onClick={() => setView('mode')} className="group relative overflow-hidden bg-gray-950 border border-gray-800 rounded-3xl p-8 hover:border-brand-500 transition-all duration-500 hover:shadow-[0_0_30px_rgba(234,179,8,0.1)]">
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black opacity-50"></div>
                      <div className="relative z-10 flex flex-col items-start">
                          <div className="p-3 bg-gray-900 rounded-2xl mb-4 text-brand-500 border border-gray-800 group-hover:scale-110 transition-transform">
                              <Sword size={32} />
                          </div>
                          <h2 className="text-2xl font-black text-white mb-1 uppercase">Novo Draft</h2>
                          <p className="text-sm text-gray-500">Iniciar nova série MD3, MD5 ou MD7.</p>
                      </div>
                  </button>
                  <button onClick={() => { setMode('snake'); setView('format'); }} className="group relative overflow-hidden bg-gray-950 border border-gray-800 rounded-3xl p-8 hover:border-blue-500 transition-all duration-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black opacity-50"></div>
                      <div className="relative z-10 flex flex-col items-start">
                          <div className="p-3 bg-gray-900 rounded-2xl mb-4 text-blue-500 border border-gray-800 group-hover:scale-110 transition-transform">
                              <MapIcon size={32} />
                          </div>
                          <h2 className="text-2xl font-black text-white mb-1 uppercase">Sorteio de Mapas</h2>
                          <p className="text-sm text-gray-500">Gerar apenas a rotação de mapas.</p>
                      </div>
                  </button>
              </div>
          </div>
      );
  }

  if (view === 'mode' || view === 'format') {
      return (
          <div className="max-w-4xl mx-auto py-10 px-4 animate-fade-in">
              <button onClick={() => setView(view === 'mode' ? 'home' : 'mode')} className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors">
                  <ChevronLeft /> Voltar
              </button>
              
              <div className="text-center mb-12">
                  <h2 className="text-3xl font-black uppercase text-white mb-2">{view === 'mode' ? 'Modo de Draft' : 'Formato da Série'}</h2>
                  <div className="h-1 w-20 bg-brand-500 mx-auto rounded-full"></div>
              </div>

              {view === 'mode' ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[{id:'snake', l:'Snake', d:'1-2-2-1'}, {id:'linear', l:'Linear', d:'1-1-1-1'}, {id:'mirrored', l:'Espelhado', d:'Simultâneo'}].map(m => (
                          <button key={m.id} onClick={() => { setMode(m.id as DraftMode); setView('format'); }}
                              className={`p-6 rounded-2xl border-2 transition-all hover:scale-105 ${mode === m.id ? 'bg-gray-800 border-brand-500 text-white' : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-600'}`}
                          >
                              <div className="text-xl font-bold uppercase">{m.l}</div>
                              <div className="text-xs opacity-60 mt-1">{m.d}</div>
                          </button>
                      ))}
                  </div>
              ) : (
                  <div className="space-y-8">
                      <div className="flex justify-center gap-4">
                          {[1, 3, 5, 7].map(f => (
                              <button key={f} onClick={() => setFormat(f)} className={`w-20 h-20 rounded-2xl border-2 font-black text-2xl transition-all ${format === f ? 'bg-brand-500 text-black border-brand-500 scale-110 shadow-lg' : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-600'}`}>
                                  MD{f}
                              </button>
                          ))}
                      </div>
                      <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 max-w-md mx-auto">
                          <label className="text-xs font-bold uppercase text-gray-500 mb-3 block">Regra de Mapas</label>
                          <div className="grid grid-cols-3 gap-2">
                              {['no-repeat', 'repeat', 'fixed'].map(r => (
                                  <button key={r} onClick={() => setDrawRule(r as MapDrawType)} className={`py-2 rounded-lg text-xs font-bold uppercase ${drawRule === r ? 'bg-white text-black' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}>
                                      {r === 'no-repeat' ? 'Sem Repetir' : r}
                                  </button>
                              ))}
                          </div>
                          <button onClick={drawMaps} className="w-full mt-6 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all">
                              Sortear Mapas &rarr;
                          </button>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  if (view === 'maps') {
      return (
          <div className="max-w-5xl mx-auto py-8 px-4 animate-fade-in">
              <div className="flex justify-between items-center mb-8">
                  <button onClick={() => setView('format')} className="text-gray-500 hover:text-white flex gap-2"><ChevronLeft /> Voltar</button>
                  <h2 className="text-2xl font-black uppercase tracking-wider">Mapas da Série</h2>
                  <button onClick={startDraft} className="bg-brand-500 hover:bg-brand-400 text-black px-6 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all">
                      Iniciar Draft <Play size={16} fill="currentColor" />
                  </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {maps.map((m, i) => (
                      <div key={i} className="group relative aspect-video bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-brand-500 transition-all shadow-lg hover:shadow-brand-500/10">
                          <img src={MAPS_DB.find(x => x.name === m)?.img} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[1px]">
                              <div className="text-xs font-bold bg-brand-500 text-black px-2 py-0.5 rounded mb-2">QUEDA {i+1}</div>
                              <div className="text-xl font-black text-white uppercase drop-shadow-lg">{m}</div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      );
  }

  if (view === 'draft') {
      return (
          <div className="min-h-screen flex flex-col bg-gray-950 text-white animate-fade-in select-none">
              {/* Header Info */}
              <div className="sticky top-0 z-50 bg-gray-900/90 backdrop-blur-md border-b border-white/5 p-4 shadow-xl">
                  <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-6">
                          <button onClick={() => setView('maps')} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white"><ChevronLeft size={20}/></button>
                          <div>
                              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Mapa Atual</div>
                              <div className="text-xl font-black text-brand-500 uppercase">{maps[currentMatch]}</div>
                          </div>
                          <div className="h-8 w-px bg-gray-800"></div>
                          <div className="flex items-center gap-3 font-mono text-xl font-bold">
                              <span className="text-teamA">{history.filter(h => h.winner === 'A').length}</span>
                              <span className="text-gray-600">-</span>
                              <span className="text-teamB">{history.filter(h => h.winner === 'B').length}</span>
                          </div>
                      </div>

                      {/* Timeline */}
                      <div className="flex-1 flex justify-center overflow-x-auto px-4">
                          <div className="flex gap-1.5 items-center">
                              {order.map((s, i) => (
                                  <div key={i} className={`w-2 h-8 rounded-full transition-all ${
                                      i === stepIndex ? `bg-white scale-125 shadow-[0_0_10px_rgba(255,255,255,0.5)]` :
                                      i < stepIndex ? (s.team === 'A' ? 'bg-teamA opacity-50' : 'bg-teamB opacity-50') :
                                      'bg-gray-800'
                                  }`} title={`${s.team} ${s.type}`}></div>
                              ))}
                          </div>
                      </div>

                      <div className="flex items-center gap-2">
                          {!isComplete ? (
                              <div className={`px-4 py-2 rounded-lg font-bold text-sm border flex items-center gap-2 ${currentStep.team === 'A' ? 'bg-teamA/10 border-teamA text-teamA' : 'bg-teamB/10 border-teamB text-teamB'}`}>
                                  <span className="animate-pulse">●</span> VEZ DO {currentStep.team === 'A' ? teamA : teamB} ({currentStep.type})
                              </div>
                          ) : (
                              <button onClick={() => setShowResultModal(true)} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-green-500/20 animate-pulse">
                                  Finalizar Partida
                              </button>
                          )}
                          <button onClick={undo} disabled={stepIndex === 0} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-gray-400 disabled:opacity-30"><RotateCcw size={18}/></button>
                      </div>
                  </div>
              </div>

              {/* Main Draft Area */}
              <div className="flex-1 max-w-[1800px] mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6">
                  
                  {/* TEAM A */}
                  <div className="flex flex-col gap-6 order-2 lg:order-1">
                      <div className="flex items-center justify-between">
                         <input value={teamA} onChange={e => setTeamA(e.target.value)} className="bg-transparent text-3xl font-black text-teamA uppercase border-b border-transparent focus:border-teamA outline-none w-full" />
                         <div className="flex items-center justify-between bg-red-900/10 border border-red-900/30 px-3 py-2 rounded-xl min-w-[120px]">
                            <span className="font-bold text-red-500 text-xs mr-2">BAN</span>
                            {bans.A ? <span className="font-black text-white text-sm">{bans.A}</span> : <div className="w-3 h-3 rounded-full border-2 border-red-500/30"></div>}
                        </div>
                      </div>
                      
                      <div className="bg-gray-900/50 rounded-2xl p-4 border border-white/5 flex flex-col gap-4">
                          <div className="grid grid-cols-2 gap-4">
                              {Array.from({length: 4}).map((_, i) => (
                                  <div key={i} className="aspect-[3/4] bg-gray-900 rounded-xl border border-gray-800 relative overflow-hidden group">
                                      {picksA[i] ? (
                                        <>
                                            <img src={CHARACTERS_DB.find(c => c.name === picksA[i])?.img} className="w-full h-full object-cover object-top" />
                                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-teamA/90 to-transparent pt-8 pb-2 px-2">
                                                <p className="text-white font-black text-center uppercase tracking-wider text-sm">{picksA[i]}</p>
                                            </div>
                                        </>
                                      ) : (
                                          <div className="w-full h-full flex items-center justify-center text-gray-800">
                                              <Users size={32} />
                                          </div>
                                      )}
                                      {/* Highlight if current turn */}
                                      {!isComplete && currentStep.team === 'A' && currentStep.type === 'pick' && picksA.length === i && (
                                          <div className="absolute inset-0 border-4 border-yellow-500/50 animate-pulse rounded-xl shadow-[inset_0_0_20px_rgba(234,179,8,0.2)]"></div>
                                      )}
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>

                  {/* POOL */}
                  <div className="flex flex-col gap-4 order-1 lg:order-2 bg-gray-950 rounded-3xl border border-gray-800 p-4 shadow-2xl h-[calc(100vh-140px)] sticky top-24 w-full lg:w-[600px] xl:w-[700px]">
                      <div className="flex justify-between items-center mb-2 px-2">
                          <div className="text-xs text-gray-500 font-bold uppercase">Personagens Disponíveis</div>
                          <div className="relative">
                              <input 
                                type="text" 
                                placeholder="Buscar..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-gray-900 border border-gray-700 rounded-full px-3 py-1 text-xs text-white focus:border-brand-500 outline-none w-32"
                              />
                              <Search size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"/>
                          </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                            {filteredCharacters.map(char => {
                                const picked = picksA.includes(char.name) || picksB.includes(char.name);
                                const banned = bans.A === char.name || bans.B === char.name;
                                const disabled = picked || banned;
                                return (
                                    <button 
                                        key={char.name}
                                        disabled={disabled || isComplete}
                                        onClick={() => handlePick(char.name)}
                                        className={`relative flex flex-col rounded-xl overflow-hidden border transition-all h-32 ${
                                            disabled ? 'grayscale opacity-30 border-gray-800' : 'border-gray-800 bg-gray-900 hover:border-brand-500 hover:scale-105 hover:z-10 cursor-pointer shadow-md'
                                        }`}
                                    >
                                        <div className="flex-1 w-full relative">
                                            <img src={char.img} className="w-full h-full object-cover object-top" loading="lazy"/>
                                        </div>
                                        <div className="bg-black/90 text-gray-200 text-[10px] font-bold py-1.5 text-center uppercase tracking-wide w-full border-t border-gray-800">
                                            {char.name}
                                        </div>

                                        {banned && <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20"><X className="text-red-500 w-8 h-8"/></div>}
                                        {picked && <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20"><CheckCircle className="text-gray-400 w-8 h-8"/></div>}
                                    </button>
                                )
                            })}
                        </div>
                      </div>
                  </div>

                  {/* TEAM B */}
                  <div className="flex flex-col gap-6 order-3">
                      <div className="flex items-center justify-between flex-row-reverse">
                         <input value={teamB} onChange={e => setTeamB(e.target.value)} className="bg-transparent text-3xl font-black text-teamB uppercase text-right border-b border-transparent focus:border-teamB outline-none w-full" />
                         <div className="flex items-center justify-between bg-red-900/10 border border-red-900/30 px-3 py-2 rounded-xl min-w-[120px]">
                            <span className="font-bold text-red-500 text-xs mr-2">BAN</span>
                            {bans.B ? <span className="font-black text-white text-sm">{bans.B}</span> : <div className="w-3 h-3 rounded-full border-2 border-red-500/30"></div>}
                        </div>
                      </div>
                      
                      <div className="bg-gray-900/50 rounded-2xl p-4 border border-white/5 flex flex-col gap-4">
                          <div className="grid grid-cols-2 gap-4">
                              {Array.from({length: 4}).map((_, i) => (
                                  <div key={i} className="aspect-[3/4] bg-gray-900 rounded-xl border border-gray-800 relative overflow-hidden">
                                      {picksB[i] ? (
                                        <>
                                            <img src={CHARACTERS_DB.find(c => c.name === picksB[i])?.img} className="w-full h-full object-cover object-top" />
                                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-teamB/90 to-transparent pt-8 pb-2 px-2">
                                                <p className="text-white font-black text-center uppercase tracking-wider text-sm">{picksB[i]}</p>
                                            </div>
                                        </>
                                      ) : (
                                          <div className="w-full h-full flex items-center justify-center text-gray-800">
                                              <Users size={32} />
                                          </div>
                                      )}
                                       {/* Highlight if current turn */}
                                       {!isComplete && currentStep.team === 'B' && currentStep.type === 'pick' && picksB.length === i && (
                                          <div className="absolute inset-0 border-4 border-yellow-500/50 animate-pulse rounded-xl shadow-[inset_0_0_20px_rgba(234,179,8,0.2)]"></div>
                                      )}
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>

              {/* Result Modal */}
              {showResultModal && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in">
                      <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8 max-w-lg w-full shadow-2xl">
                          <h3 className="text-2xl font-black text-center mb-6 uppercase text-white">Resultado - {maps[currentMatch]}</h3>
                          
                          <div className="grid grid-cols-2 gap-6 mb-8">
                              <div onClick={() => setTempResult({...tempResult, winner: 'A'})} className={`cursor-pointer p-4 rounded-2xl border-2 transition-all text-center ${tempResult.winner === 'A' ? 'bg-teamA/20 border-teamA' : 'bg-gray-800 border-gray-700 opacity-50'}`}>
                                  <div className="text-teamA font-black text-xl mb-2">{teamA}</div>
                                  <input type="number" min="0" value={tempResult.scoreA} onChange={(e) => setTempResult({...tempResult, scoreA: parseInt(e.target.value)})} onClick={e => e.stopPropagation()} className="w-20 bg-black border border-gray-600 rounded-lg text-center text-2xl font-bold py-2 outline-none focus:border-teamA" />
                              </div>
                              <div onClick={() => setTempResult({...tempResult, winner: 'B'})} className={`cursor-pointer p-4 rounded-2xl border-2 transition-all text-center ${tempResult.winner === 'B' ? 'bg-teamB/20 border-teamB' : 'bg-gray-800 border-gray-700 opacity-50'}`}>
                                  <div className="text-teamB font-black text-xl mb-2">{teamB}</div>
                                  <input type="number" min="0" value={tempResult.scoreB} onChange={(e) => setTempResult({...tempResult, scoreB: parseInt(e.target.value)})} onClick={e => e.stopPropagation()} className="w-20 bg-black border border-gray-600 rounded-lg text-center text-2xl font-bold py-2 outline-none focus:border-teamB" />
                              </div>
                          </div>

                          <div className="flex gap-4">
                              <button onClick={() => setShowResultModal(false)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold text-gray-400">Cancelar</button>
                              <button onClick={finalizeMatch} className="flex-1 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-white shadow-lg">Confirmar</button>
                          </div>
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
                  <div className="flex items-center gap-4">
                      <button onClick={() => setView('home')} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white"><ChevronLeft/></button>
                      <h2 className="text-3xl font-black uppercase">{finished ? 'Resultado Final' : 'Progresso da Série'}</h2>
                  </div>
                  <div className="flex gap-2">
                      {!finished && <button onClick={startDraft} className="bg-brand-500 text-black px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-brand-400">Próxima Partida</button>}
                      <button onClick={() => downloadDivAsImage('series-report', 'relatorio-serie')} className="bg-white text-black px-4 py-2 rounded-lg font-bold flex gap-2"><Download size={18}/> Baixar</button>
                  </div>
              </div>

              <div id="series-report" className="bg-gray-950 p-8 rounded-3xl border border-gray-800 text-white min-h-[800px]">
                  {/* Scoreboard */}
                  <div className="flex justify-center items-center gap-10 mb-12">
                      <div className="text-center">
                          <div className="text-4xl font-black text-teamA mb-2">{teamA}</div>
                          <div className={`text-6xl font-black ${winsA > winsB ? 'text-white' : 'text-gray-600'}`}>{winsA}</div>
                      </div>
                      <div className="text-2xl font-thin text-gray-600">VS</div>
                      <div className="text-center">
                          <div className="text-4xl font-black text-teamB mb-2">{teamB}</div>
                          <div className={`text-6xl font-black ${winsB > winsA ? 'text-white' : 'text-gray-600'}`}>{winsB}</div>
                      </div>
                  </div>

                  {/* Matches List */}
                  <div className="space-y-6">
                      {history.map((m, i) => (
                          <div key={i} className="bg-gray-900 rounded-2xl border border-gray-800 p-6 flex flex-col md:flex-row gap-6 relative overflow-hidden">
                              <div className={`absolute left-0 top-0 bottom-0 w-2 ${m.winner === 'A' ? 'bg-teamA' : 'bg-teamB'}`}></div>
                              
                              <div className="md:w-48 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-800 pb-4 md:pb-0 md:pr-6">
                                  <div className="text-xs font-bold text-gray-500 mb-1">QUEDA {m.matchIndex}</div>
                                  <div className="text-2xl font-black uppercase text-white mb-2">{m.map}</div>
                                  <div className="font-mono text-lg text-gray-400">{m.scoreA} - {m.scoreB}</div>
                              </div>

                              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="flex flex-col gap-2">
                                      <div className="flex items-center gap-2 mb-2">
                                          <div className="text-xs font-bold text-red-500 border border-red-900/50 px-2 rounded bg-red-900/10">BAN</div>
                                          <span className="text-sm font-bold text-gray-400">{m.bans.A || '-'}</span>
                                      </div>
                                      <div className="flex gap-2">
                                          {m.picks.A.map(c => <CharacterCardSmall key={c} name={c} type="A" size="sm" />)}
                                      </div>
                                  </div>
                                  <div className="flex flex-col gap-2 items-end">
                                      <div className="flex items-center gap-2 mb-2">
                                          <span className="text-sm font-bold text-gray-400">{m.bans.B || '-'}</span>
                                          <div className="text-xs font-bold text-red-500 border border-red-900/50 px-2 rounded bg-red-900/10">BAN</div>
                                      </div>
                                      <div className="flex gap-2 justify-end">
                                          {m.picks.B.map(c => <CharacterCardSmall key={c} name={c} type="B" size="sm" />)}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
                  
                  <div className="mt-12 pt-6 border-t border-gray-900 text-center text-xs text-gray-600 font-mono uppercase tracking-widest">
                      Jhan Medeiros Analytics Platform
                  </div>
              </div>
          </div>
      );
  }

  return null;
};

export default PicksBans;
