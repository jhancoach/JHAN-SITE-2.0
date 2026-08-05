import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, Map as MapIcon, RotateCw, AlertTriangle, 
  Download, ChevronRight, Play, Trophy, Crosshair, 
  Crown, Save, Move, Trash2, LayoutList, Image as ImageIcon, ChevronLeft, RefreshCw, HelpCircle, X
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
  const [showHelp, setShowHelp] = useState(false);
  
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

  // Sync visual map if current one gets removed
  useEffect(() => {
    if (!mapOrder.includes(visualMap) && mapOrder.length > 0) {
      setVisualMap(mapOrder[0]);
    }
  }, [mapOrder, visualMap]);

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
      if (parsed.teams && parsed.teams.length > 0) {
          setTeams(parsed.teams);
          setMode(parsed.mode);
          setMapOrder(parsed.mapOrder);
          setSelectedLocations(parsed.selectedLocations);
          setTeamPositions(parsed.teamPositions);
          setScores(parsed.scores);
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

        for (let i = 0; i < mapOrder.length; i++) {
            const s = scores[i]?.[team.id];
            if (s && s.rank) {
                played++;
                const r = parseInt(s.rank);
                const k = parseInt(s.kills || '0');
                
                if (r === 1) booyahs++;
                
                const pPts = getPlacementPoints(r);
                placementPts += pPts;
                killPts += k;
                
                if (i === mapOrder.length - 1) lastRank = r;
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-fade-in bg-graphite-900 text-premium-text">
        <h1 className="text-4xl md:text-6xl font-black text-center bg-gradient-to-r from-loud-500 to-white bg-clip-text text-transparent uppercase font-display">
          PLATAFORMA DE TREINOS
        </h1>
        <p className="text-premium-muted max-w-lg text-center font-medium">
          Gerencie seus treinos, crie tabelas de calls, visualize rotações e gere relatórios automáticos.
        </p>
        
        {teams.length > 0 && (
             <div className="w-full max-w-md bg-graphite-800 p-6 rounded-3xl flex justify-between items-center border border-loud-500/30">
                 <div className="text-left">
                     <p className="text-white font-bold">Treino em andamento</p>
                     <p className="text-xs text-premium-muted">{teams.length} times registrados</p>
                 </div>
                 <div className="flex gap-2">
                     <button onClick={resetTraining} className="text-red-400 text-xs font-bold hover:text-red-300 px-2">Apagar</button>
                     <button onClick={() => setStep('setup')} className="bg-loud-500 text-graphite-900 px-4 py-2 rounded-xl font-bold flex items-center gap-1 hover:bg-loud-600 transition-colors">
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
          className="group relative px-8 py-4 bg-graphite-800 hover:bg-graphite-700 text-white font-bold text-xl rounded-full border border-white/10 transition-all font-display uppercase tracking-wider shadow-lg"
        >
          INICIAR NOVO TREINO
        </button>
      </div>
    );
  }

  if (step === 'mode') {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in bg-graphite-900 text-premium-text">
        <button onClick={() => setStep('intro')} className="mb-6 text-premium-muted hover:text-white flex items-center gap-1"><ChevronLeft /> Voltar</button>
        <h2 className="text-3xl font-bold text-center mb-10 uppercase tracking-tight font-display">Escolha o Tipo de Treino</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic */}
          <div 
            onClick={() => { setMode('basic'); setStep('teams'); }}
            className="bg-graphite-800 p-8 rounded-[40px] border border-white/5 hover:border-loud-500/50 cursor-pointer transition-all hover:-translate-y-2 group"
          >
            <div className="w-16 h-16 bg-graphite-700 rounded-2xl flex items-center justify-center mb-6 text-loud-500 group-hover:bg-loud-500 group-hover:text-graphite-900 transition-colors">
              <LayoutList size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-2 uppercase tracking-tight font-display">Treino Básico</h3>
            <ul className="space-y-2 text-premium-muted">
              <li>✔ Até 15 Times</li>
              <li>✔ Tabela de Calls Automática</li>
              <li>✔ Detecção de Conflitos</li>
              <li>✔ Roleta de Mapas</li>
            </ul>
          </div>

          {/* Premium */}
          <div 
             onClick={() => { setMode('premium'); setStep('teams'); }}
             className="bg-graphite-800 p-8 rounded-[40px] border border-loud-500/20 hover:border-loud-500 cursor-pointer transition-all hover:-translate-y-2 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-loud-500 text-graphite-900 text-xs font-bold px-3 py-1 rounded-bl-lg font-display">PREMIUM</div>
            <div className="w-16 h-16 bg-graphite-700 rounded-2xl flex items-center justify-center mb-6 text-loud-500 group-hover:bg-loud-500 group-hover:text-graphite-900 transition-colors">
              <Crown size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-white uppercase tracking-tight font-display">Treino Premium</h3>
            <ul className="space-y-2 text-premium-muted">
              <li>✔ Tudo do Treino Básico</li>
              <li>✔ <span className="text-loud-500 font-bold">Mapas Interativos</span> (Drag & Drop)</li>
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
      <div className="max-w-2xl mx-auto animate-fade-in space-y-6 bg-graphite-900 text-premium-text">
        <button onClick={() => setStep('mode')} className="text-premium-muted hover:text-white flex items-center gap-1"><ChevronLeft /> Voltar</button>
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2 uppercase tracking-tight font-display">Cadastro de Times</h2>
          <p className="text-premium-muted">{teams.length}/15 Times Cadastrados</p>
        </div>

        <div className="flex gap-2">
          <input 
            type="text" 
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTeam()}
            placeholder="Nome do Time (Ex: LOUD GG)"
            className="flex-1 bg-graphite-800 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-loud-500 text-white placeholder-premium-muted/30"
            autoFocus
          />
          <button 
            onClick={addTeam}
            disabled={teams.length >= 15}
            className="bg-loud-500 hover:bg-loud-600 disabled:opacity-50 disabled:cursor-not-allowed text-graphite-900 px-6 py-3 rounded-xl font-bold transition-colors"
          >
            Adicionar
          </button>
        </div>

        <div className="bg-graphite-800 rounded-3xl shadow-sm border border-white/10 overflow-hidden">
          {teams.length === 0 ? (
            <div className="p-8 text-center text-premium-muted font-medium">Nenhum time cadastrado ainda.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {teams.map((team, index) => (
                <div key={team.id} className="p-4 flex justify-between items-center hover:bg-graphite-700/30 transition-colors">
                  <span className="font-medium text-lg text-white">
                    <span className="text-loud-500 font-bold mr-3 font-mono">#{index + 1}</span>
                    {team.name}
                  </span>
                  <button onClick={() => removeTeam(team.id)} className="text-premium-muted hover:text-red-500 transition-colors">
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Seleção de Mapas do Treino */}
        <div className="bg-graphite-800 p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <MapIcon className="text-loud-500" size={20} />
            <h3 className="font-bold text-lg uppercase font-display text-white">Mapas do Treino (Calls por Mapa)</h3>
          </div>
          <p className="text-xs text-premium-muted">Selecione quais mapas deseja incluir na rotação e na tabela de calls deste treino.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {['Bermuda', 'Purgatório', 'Alpine', 'Nova Terra', 'Kalahari', 'Solara'].map((mapName) => {
              const isSelected = mapOrder.includes(mapName);
              return (
                <button
                  key={mapName}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      if (mapOrder.length <= 1) {
                        alert("Selecione pelo menos 1 mapa para o treino.");
                        return;
                      }
                      setMapOrder(prev => prev.filter(m => m !== mapName));
                    } else {
                      // Keep consistent ordering for convenience
                      const orderMap: Record<string, number> = {
                        'Bermuda': 0, 'Purgatório': 1, 'Alpine': 2, 'Nova Terra': 3, 'Kalahari': 4, 'Solara': 5
                      };
                      setMapOrder(prev => {
                        const newOrder = [...prev, mapName];
                        return newOrder.sort((a, b) => (orderMap[a] ?? 0) - (orderMap[b] ?? 0));
                      });
                    }
                  }}
                  className={`flex items-center justify-between p-3.5 rounded-xl border font-bold text-sm transition-all uppercase italic tracking-wider ${
                    isSelected 
                      ? 'bg-loud-500 text-graphite-900 border-loud-500 shadow-[0_0_12px_rgba(58,255,0,0.15)] font-black' 
                      : 'bg-graphite-900 text-premium-muted border-white/5 hover:text-white hover:border-white/10'
                  }`}
                >
                  <span>{mapName}</span>
                  <span className="text-xs font-black">{isSelected ? '✓' : '+'}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-4">
           <button 
            onClick={() => setStep('setup')}
            disabled={teams.length < 2} // Require at least 2 teams
            className="flex items-center gap-2 bg-loud-500 hover:bg-loud-600 text-graphite-900 px-8 py-3 rounded-xl font-bold text-lg disabled:opacity-50 disabled:grayscale transition-all shadow-lg"
           >
             Gerar Tabela do Treino <ChevronRight />
           </button>
        </div>
      </div>
    );
  }

  if (step === 'setup') {
    return (
      <div className="animate-fade-in space-y-6 max-w-[1400px] mx-auto bg-graphite-900 text-premium-text">
        <button onClick={() => setStep('teams')} className="text-premium-muted hover:text-white flex items-center gap-1"><ChevronLeft /> Voltar para Times</button>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-graphite-800 p-6 rounded-3xl border border-white/10 shadow-sm">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2 font-display uppercase tracking-tight">
                <MapIcon className="text-loud-500" /> Definição de Calls
              </h2>
              <p className="text-sm text-premium-muted">Defina as cidades de cada time e organize a rotação.</p>
            </div>
            
            <div className="flex items-center gap-3">
                <button onClick={() => setShowHelp(true)} className="p-2.5 bg-graphite-700 rounded-full hover:bg-graphite-600 text-white transition-colors" title="Ajuda">
                    <HelpCircle size={20} />
                </button>

               {mode === 'premium' && (
                 <div className="flex bg-graphite-900 p-1 rounded-xl border border-white/5 mr-4">
                    <button 
                      onClick={() => setSetupTab('table')}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${setupTab === 'table' ? 'bg-loud-500 text-graphite-900' : 'text-premium-muted hover:text-white'}`}
                    >
                      <LayoutList size={18} className="inline mr-1"/> Tabela
                    </button>
                    <button 
                      onClick={() => setSetupTab('visual')}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${setupTab === 'visual' ? 'bg-loud-500 text-graphite-900' : 'text-premium-muted hover:text-white'}`}
                    >
                      <ImageIcon size={18} className="inline mr-1"/> Mapa Visual
                    </button>
                 </div>
               )}
               
               <button onClick={spinRoulette} className="flex items-center gap-2 bg-graphite-700 text-white px-4 py-2 rounded-xl font-bold hover:bg-graphite-600 border border-white/5 transition-colors">
                  <RotateCw size={18} /> Sortear Mapas
               </button>
               
               <button 
                 onClick={() => setStep('scoring')}
                 className="flex items-center gap-2 bg-loud-500 text-graphite-900 px-6 py-2 rounded-xl font-bold hover:bg-loud-600 shadow-md transition-colors"
               >
                  <Play size={18} fill="currentColor" /> Iniciar Treino
               </button>
            </div>
        </div>
        
        {/* Rules Selector */}
        <div className="bg-loud-500/10 border border-loud-500/20 p-4 rounded-2xl">
           <label className="text-xs font-bold text-loud-500 uppercase mb-2 block">Regra do Treino (Aparecerá no Relatório)</label>
           <select 
             value={selectedRule}
             onChange={(e) => setSelectedRule(e.target.value)}
             className="w-full bg-transparent font-bold text-white outline-none cursor-pointer"
           >
             {TRAINING_RULES.map((r, i) => <option key={i} value={r} className="text-white bg-graphite-800">{r}</option>)}
           </select>
        </div>

        {setupTab === 'table' ? (
            <div className="overflow-x-auto bg-graphite-800 rounded-3xl shadow-lg border border-white/10">
              <div id="calls-table" className="p-6 min-w-[1000px] bg-graphite-800">
                {/* Header */}
                <div 
                  className="grid gap-2 mb-4 font-bold text-center uppercase text-sm tracking-wider text-premium-muted font-display"
                  style={{ gridTemplateColumns: `200px repeat(${mapOrder.length}, minmax(120px, 1fr))` }}
                >
                   <div className="text-left pl-4">Time</div>
                   {mapOrder.map(m => <div key={m}>{m}</div>)}
                </div>
                
                {/* Body */}
                <div className="space-y-2">
                   {teams.map((team) => (
                     <div 
                       key={team.id} 
                       className="grid gap-2 items-center bg-graphite-900/50 p-2 rounded-xl border border-white/5 hover:bg-graphite-700/20 transition-colors"
                       style={{ gridTemplateColumns: `200px repeat(${mapOrder.length}, minmax(120px, 1fr))` }}
                     >
                        <div className="font-bold pl-2 truncate text-white flex items-center h-full" title={team.name}>{team.name}</div>
                        {mapOrder.map(mapName => {
                           const currentLoc = selectedLocations[mapName]?.[team.name] || '';
                           const isConflict = checkConflict(mapName, currentLoc);
                           
                           return (
                             <div key={mapName} className="relative h-full w-full">
                               <select 
                                 value={currentLoc}
                                 onChange={(e) => handleLocationSelect(mapName, team.name, e.target.value)}
                                 className={`w-full h-10 text-xs font-bold py-1 px-1 rounded-lg border outline-none transition-all cursor-pointer text-center appearance-none ${
                                   isConflict 
                                    ? 'bg-red-600 text-white border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.8)] animate-pulse font-black' 
                                    : 'bg-graphite-800 text-white border-white/10 focus:border-loud-500'
                                 }`}
                               >
                                 <option value="" className="text-premium-muted/50">- Call -</option>
                                 {MAP_LOCATIONS[mapName]?.map(loc => (
                                   <option key={loc} value={loc} className="text-white bg-graphite-800 font-bold">{loc}</option>
                                 ))}
                               </select>
                               {isConflict && (
                                   <div className="absolute top-0 right-0 p-1 pointer-events-none">
                                       <AlertTriangle size={10} className="text-white fill-white" />
                                   </div>
                               )}
                             </div>
                           )
                        })}
                     </div>
                   ))}
                </div>
                <div className="mt-6 text-center">
                    <button 
                        onClick={() => downloadDivAsImage('calls-table', 'tabela-calls')}
                        className="text-xs font-bold text-premium-muted hover:text-loud-500 flex items-center justify-center gap-1 mx-auto transition-colors"
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
                    <div className="bg-graphite-800 p-4 rounded-2xl border border-white/10">
                        <h3 className="font-bold mb-3 text-sm uppercase text-premium-muted font-display">Selecionar Mapa</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {mapOrder.map(m => (
                                <button 
                                  key={m}
                                  onClick={() => setVisualMap(m)}
                                  className={`p-2 rounded-lg text-xs font-bold transition-colors ${visualMap === m ? 'bg-loud-500 text-graphite-900' : 'bg-graphite-700 hover:bg-graphite-600 text-white'}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-graphite-800 p-4 rounded-2xl border border-white/10">
                         <h3 className="font-bold mb-3 text-sm uppercase text-premium-muted font-display">Times (Arraste para o mapa)</h3>
                         <div className="flex flex-wrap gap-2">
                             {teams.map(team => (
                                 <div 
                                    key={team.id}
                                    draggable
                                    onDragEnd={(e) => handleDragEnd(visualMap, team.name, e)}
                                    className="bg-graphite-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-move hover:bg-loud-500 hover:text-graphite-900 transition-colors shadow-sm select-none border border-white/5"
                                 >
                                     {team.name}
                                 </div>
                             ))}
                         </div>
                         <p className="text-[10px] text-premium-muted mt-2">Dica: Arraste os nomes acima para a imagem do mapa. Clique no nome no mapa para remover.</p>
                    </div>
                    
                     <button 
                        onClick={() => downloadDivAsImage('map-canvas', `mapa-${visualMap}`)}
                        className="w-full bg-loud-500 hover:bg-loud-600 text-graphite-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg"
                    >
                        <Save size={18} /> Salvar Imagem
                    </button>
                </div>

                {/* Canvas Area */}
                <div className="lg:w-3/4">
                    <div 
                        id="map-canvas"
                        ref={mapContainerRef}
                        className="relative w-full aspect-video bg-graphite-950 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10"
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <img src={TRAINING_MAP_IMAGES[visualMap]} alt={visualMap} className="w-full h-full object-cover pointer-events-none" />
                        
                        {/* Title Overlay */}
                        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-4 py-2 rounded-lg border-l-4 border-loud-500">
                            <h2 className="text-2xl font-black text-white uppercase italic font-display">{visualMap}</h2>
                        </div>

                        {/* Placed Teams */}
                        {(Object.entries(teamPositions[visualMap] || {}) as [string, TeamPos][]).map(([tName, pos]) => (
                            <div
                                key={tName}
                                style={{ top: `${pos.y}%`, left: `${pos.x}%` }}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-graphite-900/90 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded border border-loud-500 shadow-lg cursor-pointer hover:bg-red-500 transition-colors z-10"
                                onClick={() => {
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

        {/* HELP MODAL */}
        {showHelp && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 animate-fade-in">
                <div className="bg-graphite-800 max-w-lg w-full p-6 rounded-2xl shadow-2xl border border-white/10 relative text-white">
                    <button onClick={() => setShowHelp(false)} className="absolute top-4 right-4 text-premium-muted hover:text-white"><X /></button>
                    <h3 className="text-2xl font-bold mb-4 text-loud-500 flex items-center gap-2 font-display uppercase tracking-tight"><HelpCircle /> Como usar</h3>
                    
                    <div className="space-y-4 text-sm text-premium-muted">
                        <div>
                            <h4 className="font-bold text-white mb-1">1. Definindo as Calls</h4>
                            <p>Selecione as cidades para cada time em cada mapa. Se dois times escolherem a mesma call, o slot ficará <span className="text-red-500 font-bold">VERMELHO</span> indicando conflito (Quebra de Call).</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-1">2. Sorteio de Mapas</h4>
                            <p>Use o botão "Sortear Mapas" para embaralhar a ordem das quedas aleatoriamente.</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-1">3. Modo Tabela vs Visual</h4>
                            <p>No modo <strong>Tabela</strong>, você define tudo em lista. No modo <strong>Visual</strong> (Premium), você arrasta os nomes dos times diretamente para a imagem do mapa para melhor visualização.</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-1">4. Pontuação</h4>
                            <p>Clique em "Iniciar Treino" para ir para a tela de pontuação. Lá você insere a colocação (Rank) e abates (Kills) a cada queda.</p>
                        </div>
                    </div>
                    
                    <button onClick={() => setShowHelp(false)} className="mt-6 w-full bg-graphite-700 hover:bg-graphite-600 py-3 rounded-lg font-bold transition-colors">Entendi</button>
                </div>
            </div>
        )}
      </div>
    );
  }

  if (step === 'scoring') {
     return (
        <div className="max-w-4xl mx-auto animate-fade-in space-y-6 bg-graphite-900 text-premium-text">
            <div className="flex justify-between items-center">
                 <div className="flex items-center gap-4">
                     <button onClick={() => setStep('setup')} className="p-2 bg-graphite-800 text-white rounded-lg hover:bg-graphite-700 border border-white/5 transition-colors"><ChevronLeft /></button>
                     <h2 className="text-3xl font-bold uppercase tracking-tight font-display">Lançar Resultados</h2>
                 </div>
                 <button onClick={() => setStep('leaderboard')} className="bg-loud-500 hover:bg-loud-600 text-graphite-900 px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors">
                    <Trophy size={18} /> Ver Classificação
                 </button>
            </div>

            {/* Match Tabs */}
            <div className="flex bg-graphite-800 p-1.5 rounded-2xl overflow-x-auto border border-white/10">
                {mapOrder.map((map, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentMatchIndex(idx)}
                        className={`flex-1 min-w-[100px] py-3 rounded-xl text-sm font-bold transition-all ${
                            currentMatchIndex === idx 
                            ? 'bg-loud-500 text-graphite-900 shadow-md' 
                            : 'text-premium-muted hover:bg-graphite-700/50 hover:text-white'
                        }`}
                    >
                        <span className="block text-[10px] uppercase opacity-60 font-mono">Queda {idx + 1}</span>
                        {map}
                    </button>
                ))}
            </div>

            <div className="bg-graphite-800 rounded-3xl shadow-lg border border-white/10 p-6">
                <div className="grid grid-cols-[3fr_1fr_1fr] gap-4 mb-3 px-2 text-xs font-bold uppercase text-premium-muted font-display tracking-wider">
                    <div>Time</div>
                    <div className="text-center">Colocação</div>
                    <div className="text-center">Abates</div>
                </div>
                <div className="space-y-3">
                    {teams.map(team => {
                        const currentScore = scores[currentMatchIndex]?.[team.id] || { rank: '', kills: '' };
                        const isBooyah = currentScore.rank === '1';

                        return (
                            <div key={team.id} className={`grid grid-cols-[3fr_1fr_1fr] gap-4 items-center p-3 rounded-xl border transition-all ${isBooyah ? 'bg-loud-500/10 border-loud-500' : 'bg-graphite-900/50 border-white/5'}`}>
                                <div className="font-bold flex items-center gap-2 text-white">
                                    {isBooyah && <Crown size={16} className="text-loud-500" fill="currentColor" />}
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
                                    className="w-full text-center bg-graphite-800 text-white border border-white/10 rounded-lg p-2 font-bold outline-none focus:border-loud-500"
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
                                    className="w-full text-center bg-graphite-800 border border-white/10 rounded-lg p-2 font-bold text-red-500 outline-none focus:border-loud-500"
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
          <div className="max-w-[1200px] mx-auto animate-fade-in space-y-8 pb-20 bg-graphite-900 text-premium-text">
              <div className="flex justify-between items-center no-print">
                  <button onClick={() => setStep('scoring')} className="text-premium-muted hover:text-white flex items-center gap-2 transition-colors">
                      <ChevronLeft /> Voltar
                  </button>
                  <button onClick={() => downloadDivAsImage('full-report', 'relatorio-treino')} className="bg-loud-500 hover:bg-loud-600 text-graphite-900 px-6 py-2 rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                      <Download size={18} /> Baixar Relatório
                  </button>
              </div>

              <div id="full-report" className="bg-graphite-900 p-8 text-white min-h-screen border border-white/10 rounded-[40px]">
                  {/* Header */}
                  <div className="text-center mb-10 border-b border-white/5 pb-6">
                      <h1 className="text-4xl font-black italic tracking-tighter uppercase text-loud-500 mb-2 font-display">RELATÓRIO DO TREINO</h1>
                      <p className="text-premium-muted font-mono text-sm">{new Date().toLocaleDateString()} • {teams.length} TIMES • {mapOrder.length} QUEDAS</p>
                      <div className="flex justify-center gap-2 mt-4 text-xs font-bold text-premium-muted uppercase">
                          {mapOrder.map((m, i) => <span key={i} className="bg-graphite-800 px-3 py-1 rounded-lg border border-white/5">{m}</span>)}
                      </div>
                  </div>
                  
                  {/* Highlight Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                      {/* Champion */}
                      <div className="bg-gradient-to-br from-loud-500/10 to-transparent border border-loud-500/30 p-6 rounded-3xl text-center relative overflow-hidden">
                          <Crown className="mx-auto text-loud-500 mb-2" size={40} fill="currentColor" />
                          <h3 className="text-premium-muted font-bold uppercase text-xs mb-1 font-display">Campeão</h3>
                          <div className="text-2xl font-black text-white truncate">{leaderboard[0]?.name || '-'}</div>
                          <div className="text-loud-500 font-mono font-bold mt-2">{leaderboard[0]?.totalPts || 0} PTS</div>
                      </div>

                      {/* MVP Kills */}
                      <div className="bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/30 p-6 rounded-3xl text-center">
                           <Crosshair className="mx-auto text-red-500 mb-2" size={40} />
                           <h3 className="text-premium-muted font-bold uppercase text-xs mb-1 font-display">Top Abates</h3>
                           <div className="text-2xl font-black text-white truncate">{topKills[0]?.name || '-'}</div>
                           <div className="text-red-500 font-mono font-bold mt-2">{topKills[0]?.killPts || 0} Kills</div>
                      </div>

                      {/* Placement King */}
                      <div className="bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/30 p-6 rounded-3xl text-center">
                           <MapIcon className="mx-auto text-blue-500 mb-2" size={40} />
                           <h3 className="text-premium-muted font-bold uppercase text-xs mb-1 font-display">Rei do Posicionamento</h3>
                           <div className="text-2xl font-black text-white truncate">{topPlacement[0]?.name || '-'}</div>
                           <div className="text-blue-500 font-mono font-bold mt-2">{topPlacement[0]?.placementPts || 0} Pts Pos.</div>
                      </div>
                  </div>

                  {/* Main Table */}
                  <div className="overflow-hidden rounded-3xl border border-white/5 bg-graphite-800">
                      <table className="w-full text-sm">
                          <thead className="bg-graphite-900 text-premium-muted uppercase font-bold text-xs">
                              <tr>
                                  <th className="p-4 text-center">#</th>
                                  <th className="p-4 text-left">Time</th>
                                  <th className="p-4 text-center text-loud-500">Pts Totais</th>
                                  <th className="p-4 text-center">Pts Coloc.</th>
                                  <th className="p-4 text-center">Abates</th>
                                  <th className="p-4 text-center">Booyahs</th>
                                  <th className="p-4 text-center text-premium-muted">% Kills</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                              {leaderboard.map((t, i) => (
                                  <tr key={t.id} className="hover:bg-white/5 transition-colors">
                                      <td className={`p-4 text-center font-bold ${i < 3 ? 'text-xl' : ''}`}>
                                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                      </td>
                                      <td className="p-4 font-bold text-white">{t.name}</td>
                                      <td className="p-4 text-center font-black text-xl text-loud-500">{t.totalPts}</td>
                                      <td className="p-4 text-center font-mono">{t.placementPts}</td>
                                      <td className="p-4 text-center font-mono font-bold text-red-400">{t.killPts}</td>
                                      <td className="p-4 text-center font-mono">{t.booyahs > 0 ? `🏆 ${t.booyahs}` : '-'}</td>
                                      <td className="p-4 text-center text-xs text-premium-muted">{t.killPercent}%</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  {/* Footer Stats */}
                  <div className="grid grid-cols-2 gap-8 mt-10">
                      <div>
                          <h4 className="font-bold text-premium-muted uppercase mb-4 text-xs font-display tracking-wider">Top 3 Abates</h4>
                          {topKills.map((t,i) => (
                              <div key={i} className="flex justify-between border-b border-white/5 py-2">
                                  <span>{i+1}. {t.name}</span>
                                  <span className="font-bold text-red-500">{t.killPts}</span>
                              </div>
                          ))}
                      </div>
                      <div>
                          <h4 className="font-bold text-premium-muted uppercase mb-4 text-xs font-display tracking-wider">Top 3 Booyahs</h4>
                          {leaderboard.filter(t => t.booyahs > 0).slice(0,3).map((t,i) => (
                              <div key={i} className="flex justify-between border-b border-white/5 py-2">
                                  <span>{i+1}. {t.name}</span>
                                  <span className="font-bold text-loud-500">{t.booyahs}</span>
                              </div>
                          ))}
                      </div>
                  </div>
                  
                  <div className="mt-10 pt-6 border-t border-white/5 text-center text-premium-muted/50 text-xs font-mono uppercase">
                      Gerado por Jhan Medeiros Analytics Platform
                  </div>
              </div>
          </div>
      )
  }

  return null;
};

export default TrainingPlatform;
