
import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, Map as MapIcon, RotateCw, AlertTriangle, 
  Download, ChevronRight, Play, Trophy, Crosshair, 
  Crown, Save, Move, Trash2, LayoutList, Image as ImageIcon, ChevronLeft, RefreshCw
} from 'lucide-react';
import { MAP_LOCATIONS, TRAINING_RULES, TRAINING_MAP_IMAGES } from '../constants';
import { downloadDivAsImage } from '../utils';

// --- Types ---
type Step = 'intro' | 'mode' | 'teams' | 'setup' | 'scoring' | 'leaderboard';
type TrainingMode = 'basic' | 'premium';

interface Team {
  id: number;
  name: string;
}

interface MatchScore {
  rank: string; // 1-15
  kills: string;
}

interface TeamPos {
    x: number;
    y: number;
}

// Points Logic (LBFF Standard)
const getPlacementPoints = (rank: number): number => {
  const points = [12, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0, 0, 0, 0];
  return points[rank - 1] || 0;
};

// --- Main Component ---
const TrainingPlatform: React.FC = () => {
  const [step, setStep] = useState<Step>('intro');
  const [mode, setMode] = useState<TrainingMode>('basic');
  
  // Teams State
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState('');

  // Setup State
  const [mapOrder, setMapOrder] = useState<string[]>(['Bermuda', 'Purgatório', 'Alpine', 'Nova Terra', 'Kalahari', 'Solara']);
  const [selectedLocations, setSelectedLocations] = useState<Record<string, Record<string, string>>>({}); // { MapName: { TeamName: Location } }
  const [selectedRule, setSelectedRule] = useState(TRAINING_RULES[0]);
  const [setupTab, setSetupTab] = useState<'table' | 'visual'>('table');
  
  // Premium Visual State
  const [visualMap, setVisualMap] = useState<string>('Bermuda');
  const [teamPositions, setTeamPositions] = useState<Record<string, Record<string, TeamPos>>>({}); // { Map: { TeamName: {x, y} } }

  // Scoring State
  // { MatchIndex (0-5): { TeamId: { rank, kills } } }
  const [scores, setScores] = useState<Record<number, Record<number, MatchScore>>>({});
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // --- Persistence ---

  useEffect(() => {
    // Load from local storage on mount
    const saved = localStorage.getItem('training_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Only auto-restore if not in intro or if user explicitly clicks continue (handled in intro render)
      // For now, we just load into state but keep step as is, unless we add a "Continue" button
      if (parsed.teams && parsed.teams.length > 0) {
          setTeams(parsed.teams);
          setMode(parsed.mode);
          setMapOrder(parsed.mapOrder);
          setSelectedLocations(parsed.selectedLocations);
          setTeamPositions(parsed.teamPositions);
          setScores(parsed.scores);
          // Don't auto-set step, let Intro handle "Continue"
      }
    }
  }, []);

  useEffect(() => {
    // Save to local storage on change
    if (teams.length > 0) {
        const stateToSave = {
            step, mode, teams, mapOrder, selectedLocations, 
            teamPositions, scores
        };
        localStorage.setItem('training_state', JSON.stringify(stateToSave));
    }
  }, [step, mode, teams, mapOrder, selectedLocations, teamPositions, scores]);

  const resetTraining = () => {
      if(confirm('Tem certeza? Todo o treino atual será apagado.')) {
          localStorage.removeItem('training_state');
          setStep('intro');
          setTeams([]);
          setScores({});
          setSelectedLocations({});
          setTeamPositions({});
      }
  };

  // --- Actions ---

  const addTeam = () => {
    if (newTeamName.trim() && teams.length < 15) {
      setTeams([...teams, { id: Date.now(), name: newTeamName.trim() }]);
      setNewTeamName('');
    }
  };

  const removeTeam = (id: number) => {
    setTeams(teams.filter(t => t.id !== id));
  };

  const spinRoulette = () => {
    const shuffled = [...mapOrder].sort(() => Math.random() - 0.5);
    setMapOrder(shuffled);
  };

  const handleLocationSelect = (mapName: string, teamName: string, location: string) => {
    setSelectedLocations(prev => ({
      ...prev,
      [mapName]: {
        ...(prev[mapName] || {}),
        [teamName]: location
      }
    }));
  };

  const checkConflict = (mapName: string, location: string): boolean => {
    if (!location) return false;
    const mapLocs = selectedLocations[mapName];
    if (!mapLocs) return false;
    // Check if more than one team has this location
    let count = 0;
    Object.values(mapLocs).forEach(loc => {
      if (loc === location) count++;
    });
    return count > 1;
  };

  // Drag & Drop Logic for Premium
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const handleDragEnd = (map: string, teamName: string, e: React.MouseEvent) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setTeamPositions(prev => ({
        ...prev,
        [map]: {
            ...(prev[map] || {}),
            [teamName]: { x, y }
        }
    }));
  };

  // Leaderboard Calculation
  const calculateLeaderboard = () => {
    return teams.map(team => {
        let totalPts = 0;
        let placementPts = 0;
        let killPts = 0;
        let booyahs = 0;
        let played = 0;
        let lastRank = 16;

        for (let i = 0; i < 6; i++) {
            const s = scores[i]?.[team.id];
            if (s && s.rank) {
                played++;
                const r = parseInt(s.rank);
                const k = parseInt(s.kills || '0');
                
                if (r === 1) booyahs++;
                
                const pPts = getPlacementPoints(r);
                placementPts += pPts;
                killPts += k;
                
                if (i === 5) lastRank = r;
            }
        }
        totalPts = placementPts + killPts;

        return {
            ...team,
            totalPts,
            placementPts,
            killPts,
            booyahs,
            played,
            lastRank,
            killPercent: totalPts > 0 ? ((killPts / totalPts) * 100).toFixed(1) : '0',
            placePercent: totalPts > 0 ? ((placementPts / totalPts) * 100).toFixed(1) : '0'
        };
    }).sort((a, b) => {
        if (b.totalPts !== a.totalPts) return b.totalPts - a.totalPts;
        if (b.booyahs !== a.booyahs) return b.booyahs - a.booyahs;
        if (b.killPts !== a.killPts) return b.killPts - a.killPts;
        return a.lastRank - b.lastRank; // Lower rank is better
    });
  };

  // --- Views ---

  if (step === 'intro') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-fade-in">
        <h1 className="text-4xl md:text-6xl font-black text-center bg-gradient-to-r from-brand-500 to-yellow-600 bg-clip-text text-transparent">
          PLATAFORMA DE TREINOS
        </h1>
        <p className="text-gray-500 max-w-lg text-center">
          Gerencie seus treinos, crie tabelas de calls, visualize rotações e gere relatórios automáticos.
        </p>
        
        {teams.length > 0 && (
             <div className="w-full max-w-md bg-gray-800 p-4 rounded-xl flex justify-between items-center border border-brand-500/30">
                 <div className="text-left">
                     <p className="text-white font-bold">Treino em andamento</p>
                     <p className="text-xs text-gray-500">{teams.length} times registrados</p>
                 </div>
                 <div className="flex gap-2">
                     <button onClick={resetTraining} className="text-red-400 text-xs font-bold hover:text-red-300 px-2">Apagar</button>
                     <button onClick={() => setStep('setup')} className="bg-brand-500 text-gray-900 px-4 py-2 rounded-lg font-bold flex items-center gap-1">
                         Continuar <Play size={14} fill="currentColor" />
                     </button>
                 </div>
             </div>
        )}

        <button 
          onClick={() => {
              if (teams.length > 0) {
                  if(confirm("Iniciar novo vai apagar o treino anterior. Continuar?")) {
                      setTeams([]);
                      setScores({});
                      setStep('mode');
                  }
              } else {
                  setStep('mode');
              }
          }}
          className="group relative px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xl rounded-full border border-gray-600 transition-all"
        >
          <span className="relative flex items-center gap-2">
            INICIAR NOVO TREINO
          </span>
        </button>
      </div>
    );
  }

  if (step === 'mode') {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <button onClick={() => setStep('intro')} className="mb-4 text-gray-500 hover:text-white flex items-center gap-1"><ChevronLeft /> Voltar</button>
        <h2 className="text-3xl font-bold text-center mb-10">Escolha o Tipo de Treino</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic */}
          <div 
            onClick={() => { setMode('basic'); setStep('teams'); }}
            className="bg-white dark:bg-gray-800 p-8 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-brand-500 cursor-pointer transition-all hover:-translate-y-2 group"
          >
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6 group-hover:bg-brand-500 group-hover:text-gray-900 transition-colors">
              <LayoutList size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-2">Treino Básico</h3>
            <ul className="space-y-2 text-gray-500 dark:text-gray-400">
              <li>✔ Até 15 Times</li>
              <li>✔ Tabela de Calls Automática</li>
              <li>✔ Detecção de Conflitos</li>
              <li>✔ Roleta de Mapas</li>
            </ul>
          </div>

          {/* Premium */}
          <div 
             onClick={() => { setMode('premium'); setStep('teams'); }}
             className="bg-gray-900 p-8 rounded-2xl border-2 border-brand-500/50 hover:border-brand-500 cursor-pointer transition-all hover:-translate-y-2 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-brand-500 text-gray-900 text-xs font-bold px-3 py-1 rounded-bl-lg">PREMIUM</div>
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-6 group-hover:bg-brand-500 group-hover:text-gray-900 transition-colors">
              <Crown size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-white">Treino Premium</h3>
            <ul className="space-y-2 text-gray-400">
              <li>✔ Tudo do Treino Básico</li>
              <li>✔ <span className="text-brand-500 font-bold">Mapas Interativos</span> (Drag & Drop)</li>
              <li>✔ Salvar Imagem das Calls</li>
              <li>✔ Relatório Visual Completo</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'teams') {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in space-y-6">
        <button onClick={() => setStep('mode')} className="text-gray-500 hover:text-white flex items-center gap-1"><ChevronLeft /> Voltar</button>
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">Cadastro de Times</h2>
          <p className="text-gray-500">{teams.length}/15 Times Cadastrados</p>
        </div>

        <div className="flex gap-2">
          <input 
            type="text" 
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTeam()}
            placeholder="Nome do Time (Ex: Team Solid)"
            className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 outline-none focus:border-brand-500"
            autoFocus
          />
          <button 
            onClick={addTeam}
            disabled={teams.length >= 15}
            className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 px-6 py-3 rounded-lg font-bold transition-colors"
          >
            Adicionar
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {teams.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Nenhum time cadastrado ainda.</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {teams.map((team, index) => (
                <div key={team.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <span className="font-medium text-lg">
                    <span className="text-brand-500 font-bold mr-3">#{index + 1}</span>
                    {team.name}
                  </span>
                  <button onClick={() => removeTeam(team.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
           <button 
            onClick={() => setStep('setup')}
            disabled={teams.length < 2} // Require at least 2 teams
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold text-lg disabled:opacity-50 disabled:grayscale transition-all shadow-lg"
           >
             Gerar Tabela do Treino <ChevronRight />
           </button>
        </div>
      </div>
    );
  }

  if (step === 'setup') {
    return (
      <div className="animate-fade-in space-y-6 max-w-[1400px] mx-auto">
        <button onClick={() => setStep('teams')} className="text-gray-500 hover:text-white flex items-center gap-1"><ChevronLeft /> Voltar para Times</button>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <MapIcon className="text-brand-500" /> Definição de Calls
              </h2>
              <p className="text-sm text-gray-500">Defina as cidades de cada time e organize a rotação.</p>
            </div>
            
            <div className="flex items-center gap-3">
               {mode === 'premium' && (
                 <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg mr-4">
                    <button 
                      onClick={() => setSetupTab('table')}
                      className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${setupTab === 'table' ? 'bg-white dark:bg-gray-700 shadow text-brand-500' : 'text-gray-500'}`}
                    >
                      <LayoutList size={18} className="inline mr-1"/> Tabela
                    </button>
                    <button 
                      onClick={() => setSetupTab('visual')}
                      className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${setupTab === 'visual' ? 'bg-white dark:bg-gray-700 shadow text-brand-500' : 'text-gray-500'}`}
                    >
                      <ImageIcon size={18} className="inline mr-1"/> Mapa Visual
                    </button>
                 </div>
               )}
               
               <button onClick={spinRoulette} className="flex items-center gap-2 bg-brand-500 text-gray-900 px-4 py-2 rounded-lg font-bold hover:bg-brand-600">
                  <RotateCw size={18} /> Sortear Mapas
               </button>
               
               <button 
                 onClick={() => setStep('scoring')}
                 className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 shadow-md"
               >
                  <Play size={18} /> Iniciar Treino
               </button>
            </div>
        </div>
        
        {/* Rules Selector */}
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 p-4 rounded-xl">
           <label className="text-xs font-bold text-yellow-600 dark:text-yellow-500 uppercase mb-2 block">Regra do Treino (Aparecerá no Relatório)</label>
           <select 
             value={selectedRule}
             onChange={(e) => setSelectedRule(e.target.value)}
             className="w-full bg-transparent font-bold text-yellow-800 dark:text-yellow-200 outline-none cursor-pointer"
           >
             {TRAINING_RULES.map((r, i) => <option key={i} value={r} className="text-gray-900">{r}</option>)}
           </select>
        </div>

        {setupTab === 'table' ? (
            <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
              <div id="calls-table" className="p-4 min-w-[1000px]">
                {/* Header */}
                <div className="grid grid-cols-[200px_repeat(6,1fr)] gap-2 mb-4 font-bold text-center uppercase text-sm tracking-wider text-gray-500 dark:text-gray-400">
                   <div className="text-left pl-4">Time</div>
                   {mapOrder.map(m => <div key={m}>{m}</div>)}
                </div>
                
                {/* Body */}
                <div className="space-y-2">
                   {teams.map((team) => (
                     <div key={team.id} className="grid grid-cols-[200px_repeat(6,1fr)] gap-2 items-center bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <div className="font-bold pl-2 truncate" title={team.name}>{team.name}</div>
                        {mapOrder.map(mapName => {
                           const currentLoc = selectedLocations[mapName]?.[team.name] || '';
                           const isConflict = checkConflict(mapName, currentLoc);
                           
                           return (
                             <div key={mapName} className="relative">
                               <select 
                                 value={currentLoc}
                                 onChange={(e) => handleLocationSelect(mapName, team.name, e.target.value)}
                                 className={`w-full text-xs font-semibold py-2 px-1 rounded border outline-none transition-all cursor-pointer appearance-none text-center ${
                                   isConflict 
                                    ? 'bg-red-500 text-white border-red-700 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse' 
                                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-brand-500'
                                 }`}
                               >
                                 <option value="">- Call -</option>
                                 {MAP_LOCATIONS[mapName]?.map(loc => (
                                   <option key={loc} value={loc} className="text-gray-900">{loc}</option>
                                 ))}
                               </select>
                               {isConflict && <AlertTriangle size={12} className="absolute top-1/2 right-2 -translate-y-1/2 text-white pointer-events-none" />}
                             </div>
                           )
                        })}
                     </div>
                   ))}
                </div>
                <div className="mt-4 text-center">
                    <button 
                        onClick={() => downloadDivAsImage('calls-table', 'tabela-calls')}
                        className="text-xs font-bold text-gray-400 hover:text-brand-500 flex items-center justify-center gap-1 mx-auto"
                    >
                        <Download size={12} /> Baixar Tabela como Imagem
                    </button>
                </div>
              </div>
            </div>
        ) : (
            // Premium Map Visual
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Map Selector & Teams */}
                <div className="lg:w-1/4 space-y-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h3 className="font-bold mb-3 text-sm uppercase text-gray-500">Selecionar Mapa</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {mapOrder.map(m => (
                                <button 
                                  key={m}
                                  onClick={() => setVisualMap(m)}
                                  className={`p-2 rounded-lg text-xs font-bold transition-colors ${visualMap === m ? 'bg-brand-500 text-gray-900' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                         <h3 className="font-bold mb-3 text-sm uppercase text-gray-500">Times (Arraste para o mapa)</h3>
                         <div className="flex flex-wrap gap-2">
                             {teams.map(team => (
                                 <div 
                                    key={team.id}
                                    draggable
                                    onDragEnd={(e) => handleDragEnd(visualMap, team.name, e)}
                                    className="bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded cursor-move hover:bg-brand-500 hover:text-gray-900 transition-colors shadow-sm select-none"
                                 >
                                     {team.name}
                                 </div>
                             ))}
                         </div>
                         <p className="text-[10px] text-gray-400 mt-2">Dica: Arraste os nomes acima para a imagem do mapa. Clique no nome no mapa para remover.</p>
                    </div>
                    
                     <button 
                        onClick={() => downloadDivAsImage('map-canvas', `mapa-${visualMap}`)}
                        className="w-full bg-brand-500 hover:bg-brand-600 text-gray-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                    >
                        <Save size={18} /> Salvar Imagem
                    </button>
                </div>

                {/* Canvas Area */}
                <div className="lg:w-3/4">
                    <div 
                        id="map-canvas"
                        ref={mapContainerRef}
                        className="relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-2xl border-4 border-gray-800"
                        onDragOver={(e) => e.preventDefault()} // Allow drop
                    >
                        <img src={TRAINING_MAP_IMAGES[visualMap]} alt={visualMap} className="w-full h-full object-cover pointer-events-none" />
                        
                        {/* Title Overlay */}
                        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-4 py-2 rounded-lg border-l-4 border-brand-500">
                            <h2 className="text-2xl font-black text-white uppercase italic">{visualMap}</h2>
                        </div>

                        {/* Placed Teams */}
                        {(Object.entries(teamPositions[visualMap] || {}) as [string, TeamPos][]).map(([tName, pos]) => (
                            <div
                                key={tName}
                                style={{ top: `${pos.y}%`, left: `${pos.x}%` }}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-gray-900/90 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded border border-brand-500 shadow-lg cursor-pointer hover:bg-red-500 transition-colors z-10"
                                onClick={() => {
                                    // Remove on click
                                    const newPos = { ...teamPositions };
                                    if (newPos[visualMap]) {
                                        delete newPos[visualMap][tName];
                                        setTeamPositions(newPos);
                                    }
                                }}
                            >
                                {tName}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  if (step === 'scoring') {
     return (
        <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
            <div className="flex justify-between items-center">
                 <div className="flex items-center gap-4">
                     <button onClick={() => setStep('setup')} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700"><ChevronLeft /></button>
                     <h2 className="text-3xl font-bold">Lançar Resultados</h2>
                 </div>
                 <button onClick={() => setStep('leaderboard')} className="bg-brand-500 hover:bg-brand-600 text-gray-900 px-6 py-2 rounded-lg font-bold">
                    <Trophy className="inline mr-2" size={18} /> Ver Classificação
                 </button>
            </div>

            {/* Match Tabs */}
            <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl overflow-x-auto">
                {mapOrder.map((map, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentMatchIndex(idx)}
                        className={`flex-1 min-w-[100px] py-3 rounded-lg text-sm font-bold transition-all ${
                            currentMatchIndex === idx 
                            ? 'bg-brand-500 text-gray-900 shadow-md' 
                            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        <span className="block text-[10px] uppercase opacity-60">Queda {idx + 1}</span>
                        {map}
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="grid grid-cols-[3fr_1fr_1fr] gap-4 mb-2 px-2 text-xs font-bold uppercase text-gray-500">
                    <div>Time</div>
                    <div className="text-center">Colocação</div>
                    <div className="text-center">Abates</div>
                </div>
                <div className="space-y-3">
                    {teams.map(team => {
                        const currentScore = scores[currentMatchIndex]?.[team.id] || { rank: '', kills: '' };
                        const isBooyah = currentScore.rank === '1';

                        return (
                            <div key={team.id} className={`grid grid-cols-[3fr_1fr_1fr] gap-4 items-center p-3 rounded-lg border transition-all ${isBooyah ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-500' : 'bg-gray-50 dark:bg-gray-900 border-transparent'}`}>
                                <div className="font-bold flex items-center gap-2">
                                    {isBooyah && <Crown size={16} className="text-yellow-500" fill="currentColor" />}
                                    {team.name}
                                </div>
                                <input 
                                    type="number" 
                                    placeholder="Rank"
                                    min="1" max="15"
                                    value={currentScore.rank}
                                    onChange={(e) => {
                                        setScores(prev => ({
                                            ...prev,
                                            [currentMatchIndex]: {
                                                ...(prev[currentMatchIndex] || {}),
                                                [team.id]: { ...currentScore, rank: e.target.value }
                                            }
                                        }))
                                    }}
                                    className="w-full text-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-2 font-bold outline-none focus:border-brand-500"
                                />
                                <input 
                                    type="number" 
                                    placeholder="Kills"
                                    min="0"
                                    value={currentScore.kills}
                                    onChange={(e) => {
                                         setScores(prev => ({
                                            ...prev,
                                            [currentMatchIndex]: {
                                                ...(prev[currentMatchIndex] || {}),
                                                [team.id]: { ...currentScore, kills: e.target.value }
                                            }
                                        }))
                                    }}
                                    className="w-full text-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-2 font-bold text-red-500 outline-none focus:border-brand-500"
                                />
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
     );
  }

  if (step === 'leaderboard') {
      const leaderboard = calculateLeaderboard();
      const topKills = [...leaderboard].sort((a,b) => b.killPts - a.killPts).slice(0,3);
      const topPlacement = [...leaderboard].sort((a,b) => b.placementPts - a.placementPts).slice(0,3);

      return (
          <div className="max-w-[1200px] mx-auto animate-fade-in space-y-8 pb-20">
              <div className="flex justify-between items-center no-print">
                  <button onClick={() => setStep('scoring')} className="text-gray-500 hover:text-white flex items-center gap-2">
                      <ChevronRight className="rotate-180" /> Voltar
                  </button>
                  <button onClick={() => downloadDivAsImage('full-report', 'relatorio-treino')} className="bg-brand-500 text-gray-900 px-6 py-2 rounded-lg font-bold shadow-lg hover:scale-105 transition-transform">
                      <Download className="inline mr-2" size={18} /> Baixar Relatório
                  </button>
              </div>

              <div id="full-report" className="bg-gray-900 p-8 text-white min-h-screen">
                  {/* Header */}
                  <div className="text-center mb-10 border-b border-gray-800 pb-6">
                      <h1 className="text-4xl font-black italic tracking-tighter uppercase text-brand-500 mb-2">RELATÓRIO DO TREINO</h1>
                      <p className="text-gray-400 font-mono text-sm">{new Date().toLocaleDateString()} • {teams.length} TIMES • 6 QUEDAS</p>
                      <div className="flex justify-center gap-2 mt-4 text-xs font-bold text-gray-500 uppercase">
                          {mapOrder.map((m, i) => <span key={i} className="bg-gray-800 px-2 py-1 rounded">{m}</span>)}
                      </div>
                  </div>
                  
                  {/* Highlight Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                      {/* Champion */}
                      <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-900/20 border border-yellow-500/30 p-6 rounded-2xl text-center relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-10 bg-yellow-500/10 blur-3xl rounded-full"></div>
                          <Crown className="mx-auto text-yellow-500 mb-2" size={40} fill="currentColor" />
                          <h3 className="text-gray-400 font-bold uppercase text-xs mb-1">Campeão</h3>
                          <div className="text-2xl font-black text-white truncate">{leaderboard[0]?.name || '-'}</div>
                          <div className="text-yellow-500 font-mono font-bold mt-2">{leaderboard[0]?.totalPts || 0} PTS</div>
                      </div>

                      {/* MVP Kills */}
                      <div className="bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-500/30 p-6 rounded-2xl text-center">
                           <Crosshair className="mx-auto text-red-500 mb-2" size={40} />
                           <h3 className="text-gray-400 font-bold uppercase text-xs mb-1">Top Abates</h3>
                           <div className="text-2xl font-black text-white truncate">{topKills[0]?.name || '-'}</div>
                           <div className="text-red-500 font-mono font-bold mt-2">{topKills[0]?.killPts || 0} Kills</div>
                      </div>

                      {/* Placement King */}
                      <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/30 p-6 rounded-2xl text-center">
                           <MapIcon className="mx-auto text-blue-500 mb-2" size={40} />
                           <h3 className="text-gray-400 font-bold uppercase text-xs mb-1">Rei do Posicionamento</h3>
                           <div className="text-2xl font-black text-white truncate">{topPlacement[0]?.name || '-'}</div>
                           <div className="text-blue-500 font-mono font-bold mt-2">{topPlacement[0]?.placementPts || 0} Pts Pos.</div>
                      </div>
                  </div>

                  {/* Main Table */}
                  <div className="overflow-hidden rounded-xl border border-gray-800">
                      <table className="w-full text-sm">
                          <thead className="bg-gray-800 text-gray-400 uppercase font-bold text-xs">
                              <tr>
                                  <th className="p-4 text-center">#</th>
                                  <th className="p-4 text-left">Time</th>
                                  <th className="p-4 text-center text-brand-500">Pts Totais</th>
                                  <th className="p-4 text-center">Pts Coloc.</th>
                                  <th className="p-4 text-center">Abates</th>
                                  <th className="p-4 text-center">Booyahs</th>
                                  <th className="p-4 text-center text-gray-600">% Kills</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800">
                              {leaderboard.map((t, i) => (
                                  <tr key={t.id} className="hover:bg-white/5 transition-colors">
                                      <td className={`p-4 text-center font-bold ${i < 3 ? 'text-xl' : ''}`}>
                                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                      </td>
                                      <td className="p-4 font-bold">{t.name}</td>
                                      <td className="p-4 text-center font-black text-xl text-brand-500">{t.totalPts}</td>
                                      <td className="p-4 text-center font-mono">{t.placementPts}</td>
                                      <td className="p-4 text-center font-mono font-bold text-red-400">{t.killPts}</td>
                                      <td className="p-4 text-center font-mono">{t.booyahs > 0 ? `🏆 ${t.booyahs}` : '-'}</td>
                                      <td className="p-4 text-center text-xs text-gray-500">{t.killPercent}%</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  {/* Footer Stats */}
                  <div className="grid grid-cols-2 gap-8 mt-10">
                      <div>
                          <h4 className="font-bold text-gray-500 uppercase mb-4 text-xs">Top 3 Abates</h4>
                          {topKills.map((t,i) => (
                              <div key={i} className="flex justify-between border-b border-gray-800 py-2">
                                  <span>{i+1}. {t.name}</span>
                                  <span className="font-bold text-red-500">{t.killPts}</span>
                              </div>
                          ))}
                      </div>
                      <div>
                          <h4 className="font-bold text-gray-500 uppercase mb-4 text-xs">Top 3 Booyahs</h4>
                          {leaderboard.filter(t => t.booyahs > 0).slice(0,3).map((t,i) => (
                              <div key={i} className="flex justify-between border-b border-gray-800 py-2">
                                  <span>{i+1}. {t.name}</span>
                                  <span className="font-bold text-yellow-500">{t.booyahs}</span>
                              </div>
                          ))}
                      </div>
                  </div>
                  
                  <div className="mt-10 pt-6 border-t border-gray-800 text-center text-gray-600 text-xs font-mono uppercase">
                      Gerado por Jhan Medeiros Analytics Platform
                  </div>
              </div>
          </div>
      )
  }

  return null;
};

export default TrainingPlatform;
