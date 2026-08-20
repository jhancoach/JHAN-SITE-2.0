
import React, { useState, useMemo } from 'react';
import { 
  Printer, RefreshCw, BarChart2, FileText, ChevronLeft, Plus, Trash2, 
  ChevronDown, ChevronUp, Trophy, Sparkles, Image as ImageIcon, CheckCircle2 
} from 'lucide-react';
import { translations, Language } from '../translations';
import { downloadDivAsImage } from '../utils';
import { ScoreboardImageScanner, ScannedMatchResult } from '../components/ScoreboardImageScanner';

interface StatisticsProps {
  language: Language;
}

interface MapStat {
  name: string;
  points: string;
  matches: string;
  kills: string;
}

interface PlayerStat {
  id: number;
  name: string;
  matches: string;
  kills: string;
  deaths: string;
  assists: string;
  damage: string;
  knockdowns: string;
}

// --- NEW TYPES FOR DETAILED MODE ---
interface DetailedMatch {
    id: string;
    map: string;
    rank: string;
    placementPoints: string;
    teamKills: number; // Calculated automatically
    totalPoints: number; // Calculated automatically
    playerData: {
        kills: string;
        damage: string;
        assists: string;
        deaths: string;
        knocks: string;
    }[]; // Index corresponds to player index (0-4)
}

const MAP_OPTIONS = ['Bermuda', 'Purgatório', 'Alpine', 'Nova Terra', 'Kalahari', 'Solara'];

const ChartBar: React.FC<{ label: string, value: number, max: number, color: string }> = ({ label, value, max, color }) => {
  const percent = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="w-24 text-xs font-bold text-right truncate text-gray-700 dark:text-gray-300">{label}</span>
      <div className="flex-1 bg-gray-200 dark:bg-gray-700 h-4 rounded-full overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${percent}%` }}></div>
      </div>
      <span className="w-10 text-xs font-bold text-gray-700 dark:text-gray-300">{value}</span>
    </div>
  );
};

const Statistics: React.FC<StatisticsProps> = ({ language }) => {
  const t = translations[language].stats;
  const [viewMode, setViewMode] = useState<'edit' | 'summary'>('edit');
  
  // --- INPUT MODE STATE ---
  const [inputMode, setInputMode] = useState<'simple' | 'detailed' | 'scanner'>('scanner');
  const [importBanner, setImportBanner] = useState<string | null>(null);

  // Event State
  const [eventType, setEventType] = useState<'competicao' | 'treino'>('competicao');
  const [eventName, setEventName] = useState('');

  // Map Data State (Simple Mode)
  const initialMaps: MapStat[] = MAP_OPTIONS.map(name => ({ name, points: '', matches: '', kills: '' }));
  const [mapStats, setMapStats] = useState<MapStat[]>(initialMaps);

  // Player Data State (Simple Mode & Names for Detailed)
  const initialPlayers: PlayerStat[] = Array.from({ length: 5 }).map((_, i) => ({
    id: i + 1,
    name: '',
    matches: '',
    kills: '',
    deaths: '',
    assists: '',
    damage: '',
    knockdowns: ''
  }));
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>(initialPlayers);

  // --- DETAILED MODE STATE ---
  const [matches, setMatches] = useState<DetailedMatch[]>([]);

  // --- CALCULATIONS ---

  // Aggregate Detailed Data into Simple Data Structure
  const aggregateDetailedData = (customMatches?: DetailedMatch[], customPlayers?: PlayerStat[]) => {
      const targetMatches = customMatches || matches;
      const targetPlayers = customPlayers || playerStats;

      // Reset accumulators
      const newMapStats = MAP_OPTIONS.map(name => ({ name, points: 0, matches: 0, kills: 0 }));
      const newPlayerStats = targetPlayers.map(p => ({ 
          ...p, matches: 0, kills: 0, deaths: 0, assists: 0, damage: 0, knockdowns: 0 
      }));

      targetMatches.forEach(match => {
          // Map Aggregation
          const mapIndex = newMapStats.findIndex(m => m.name.toLowerCase() === match.map.toLowerCase());
          if (mapIndex >= 0) {
              const pKills = match.playerData.reduce((acc, curr) => acc + (parseInt(curr.kills) || 0), 0);
              const pPlace = parseInt(match.placementPoints) || 0;
              
              newMapStats[mapIndex].matches += 1;
              newMapStats[mapIndex].kills += pKills;
              newMapStats[mapIndex].points += (pPlace + pKills);
          }

          // Player Aggregation
          match.playerData.forEach((pData, idx) => {
              if (newPlayerStats[idx]) {
                  newPlayerStats[idx].matches += 1;
                  newPlayerStats[idx].kills += parseInt(pData.kills) || 0;
                  newPlayerStats[idx].deaths += parseInt(pData.deaths) || 0;
                  newPlayerStats[idx].assists += parseInt(pData.assists) || 0;
                  newPlayerStats[idx].damage += parseInt(pData.damage) || 0;
                  newPlayerStats[idx].knockdowns += parseInt(pData.knocks) || 0;
              }
          });
      });

      // Convert back to string format for the View
      setMapStats(newMapStats.map(m => ({
          name: m.name,
          points: m.points.toString(),
          matches: m.matches.toString(),
          kills: m.kills.toString()
      })));

      setPlayerStats(newPlayerStats.map(p => ({
          ...p,
          matches: p.matches.toString(),
          kills: p.kills.toString(),
          deaths: p.deaths.toString(),
          assists: p.assists.toString(),
          damage: p.damage.toString(),
          knockdowns: p.knockdowns.toString()
      })));
  };

  // Handler for importing matches from ScoreboardImageScanner
  const handleImportFromScanner = (scannedMatches: ScannedMatchResult[], append: boolean) => {
    // 1. Discover player names from scanned matches
    const updatedPlayers = [...playerStats];
    const discoveredNames: string[] = [];

    scannedMatches.forEach(sm => {
      sm.players.forEach(p => {
        if (p.name && !discoveredNames.includes(p.name)) {
          discoveredNames.push(p.name);
        }
      });
    });

    // Populate empty names
    discoveredNames.forEach((name, idx) => {
      if (idx < updatedPlayers.length) {
        if (!updatedPlayers[idx].name || !append) {
          updatedPlayers[idx].name = name;
        }
      }
    });

    // 2. Convert scanned matches to DetailedMatch
    const convertedMatches: DetailedMatch[] = scannedMatches.map((sm, mIdx) => {
      const pData = Array.from({ length: 5 }).map((_, pIdx) => {
        // Try to match by player name first, or fallback to index
        const currentTargetName = updatedPlayers[pIdx]?.name;
        let matchedScannedPlayer = sm.players.find(p => p.name && currentTargetName && p.name.toLowerCase() === currentTargetName.toLowerCase());
        if (!matchedScannedPlayer) {
          matchedScannedPlayer = sm.players[pIdx];
        }

        return {
          kills: matchedScannedPlayer ? (matchedScannedPlayer.kills || 0).toString() : '0',
          damage: matchedScannedPlayer ? (matchedScannedPlayer.damage || 0).toString() : '0',
          assists: matchedScannedPlayer ? (matchedScannedPlayer.assists || 0).toString() : '0',
          deaths: matchedScannedPlayer ? (matchedScannedPlayer.deaths || 0).toString() : '0',
          knocks: matchedScannedPlayer ? ((matchedScannedPlayer.knocks ?? 0)).toString() : '0',
        };
      });

      const totalKills = sm.players.reduce((acc, p) => acc + (p.kills || 0), 0);
      const totalPoints = (sm.placementPoints || 0) + totalKills;

      return {
        id: sm.id || `imported-${Date.now()}-${mIdx}`,
        map: sm.map || 'Bermuda',
        rank: sm.rank.toString(),
        placementPoints: sm.placementPoints.toString(),
        teamKills: totalKills,
        totalPoints: totalPoints,
        playerData: pData,
      };
    });

    const finalMatches = append ? [...matches, ...convertedMatches] : convertedMatches;
    setMatches(finalMatches);
    setPlayerStats(updatedPlayers);

    // Run aggregation
    aggregateDetailedData(finalMatches, updatedPlayers);

    // Switch to detailed view and show banner
    setInputMode('detailed');
    setImportBanner(
      `🎉 ${scannedMatches.length} partida(s) importada(s) com sucesso via Scanner IA! Todas as estatísticas e cálculos foram atualizados.`
    );

    setTimeout(() => {
      setImportBanner(null);
    }, 6000);
  };

  const collectiveStats = useMemo(() => {
    let totalPoints = 0;
    let totalMatches = 0;
    let totalKills = 0;

    mapStats.forEach(m => {
      totalPoints += Number(m.points) || 0;
      totalMatches += Number(m.matches) || 0;
      totalKills += Number(m.kills) || 0;
    });

    const avgPoints = totalMatches > 0 ? (totalPoints / totalMatches).toFixed(2) : '0';
    const avgKills = totalMatches > 0 ? (totalKills / totalMatches).toFixed(2) : '0';

    return { totalPoints, totalMatches, totalKills, avgPoints, avgKills };
  }, [mapStats]);

  // --- ACTIONS ---

  const handleGenerateSummary = () => {
      if (inputMode === 'detailed') {
          aggregateDetailedData();
      }
      setViewMode('summary');
  };

  const updateMap = (index: number, field: keyof MapStat, value: string) => {
    const newMaps = [...mapStats];
    newMaps[index] = { ...newMaps[index], [field]: value };
    setMapStats(newMaps);
  };

  const updatePlayer = (index: number, field: keyof PlayerStat, value: string) => {
    const newPlayers = [...playerStats];
    newPlayers[index] = { ...newPlayers[index], [field]: value };
    setPlayerStats(newPlayers);
  };

  // Detailed Mode Actions
  const addMatch = () => {
      const newMatch: DetailedMatch = {
          id: Date.now().toString(),
          map: 'Bermuda',
          rank: '',
          placementPoints: '',
          teamKills: 0,
          totalPoints: 0,
          playerData: Array(5).fill({ kills: '', damage: '', assists: '', deaths: '', knocks: '' })
      };
      setMatches([...matches, newMatch]);
  };

  const removeMatch = (id: string) => {
      setMatches(matches.filter(m => m.id !== id));
  };

  const updateMatch = (matchId: string, field: keyof DetailedMatch, value: any) => {
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, [field]: value } : m));
  };

  const updateMatchPlayer = (matchId: string, playerIndex: number, field: string, value: string) => {
      setMatches(prev => prev.map(m => {
          if (m.id !== matchId) return m;
          const newPData = [...m.playerData];
          newPData[playerIndex] = { ...newPData[playerIndex], [field]: value };
          return { ...m, playerData: newPData };
      }));
  };

  const handleReset = () => {
    if (confirm('Tem certeza? Todos os dados serão perdidos.')) {
      setMapStats(initialMaps);
      setPlayerStats(initialPlayers);
      setMatches([]);
      setEventName('');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // --- VIEW: SUMMARY ---
  if (viewMode === 'summary') {
    return (
      <div className="animate-fade-in bg-graphite-900 text-white min-h-screen">
         {/* Summary Header (No Print) */}
         <div className="no-print p-4 border-b border-white/10 flex justify-between items-center sticky top-0 bg-graphite-900/90 z-20 backdrop-blur-md">
            <button onClick={() => setViewMode('edit')} className="flex items-center gap-2 text-premium-muted hover:text-white hover:text-loud-500">
                <ChevronLeft /> {t.back}
            </button>
            <div className="flex gap-2">
                <button onClick={() => downloadDivAsImage('summary-report', 'resumo-time')} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    <BarChart2 size={18} /> Imagem
                </button>
                <button onClick={handlePrint} className="flex items-center gap-2 bg-loud-500 text-gray-900 px-4 py-2 rounded-lg hover:bg-loud-600 font-bold">
                    <Printer size={18} /> {t.print}
                </button>
            </div>
         </div>

         {/* Printable Area */}
         <div id="summary-report" className="max-w-5xl mx-auto p-8 bg-graphite-900 text-white text-white">
            {/* Header */}
            <div className="text-center mb-8 pb-4 border-b border-white/10">
                <h1 className="text-4xl font-black italic tracking-tighter uppercase text-loud-500 mb-2">{t.summary}</h1>
                <h2 className="text-2xl font-bold">{eventName || t.eventName}</h2>
                <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-bold uppercase mt-2">
                    {eventType === 'competicao' ? t.competition : t.practice}
                </span>
            </div>

            {/* Section 1: Collective Stats */}
            <div className="mb-8">
                <h3 className="text-xl font-bold border-l-4 border-loud-500 pl-3 mb-4 uppercase">{t.collective}</h3>
                <div className="grid grid-cols-5 gap-4 bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-white/10 text-center">
                   <div>
                       <p className="text-xs text-gray-500 uppercase font-bold">{t.points}</p>
                       <p className="text-3xl font-black text-loud-500">{collectiveStats.totalPoints}</p>
                   </div>
                   <div>
                       <p className="text-xs text-gray-500 uppercase font-bold">{t.matches}</p>
                       <p className="text-3xl font-black">{collectiveStats.totalMatches}</p>
                   </div>
                   <div>
                       <p className="text-xs text-gray-500 uppercase font-bold">{t.kills}</p>
                       <p className="text-3xl font-black text-red-500">{collectiveStats.totalKills}</p>
                   </div>
                   <div>
                       <p className="text-xs text-gray-500 uppercase font-bold">{t.avgPoints}</p>
                       <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{collectiveStats.avgPoints}</p>
                   </div>
                   <div>
                       <p className="text-xs text-gray-500 uppercase font-bold">{t.avgKills}</p>
                       <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{collectiveStats.avgKills}</p>
                   </div>
                </div>
            </div>

            {/* Section 2: Visual Charts (Side by Side) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Points Chart */}
                <div className="bg-graphite-800 text-white p-4 rounded-xl border border-white/10">
                    <h4 className="text-sm font-bold uppercase mb-4 text-center">{t.chartPoints}</h4>
                    {mapStats.map(m => (
                        <ChartBar 
                            key={m.name} 
                            label={m.name} 
                            value={Number(m.points)} 
                            max={Math.max(...mapStats.map(x => Number(x.points)))} 
                            color="bg-loud-500" 
                        />
                    ))}
                </div>
                {/* Kills Chart */}
                <div className="bg-graphite-800 text-white p-4 rounded-xl border border-white/10">
                    <h4 className="text-sm font-bold uppercase mb-4 text-center">{t.chartKills}</h4>
                    {mapStats.map(m => (
                        <ChartBar 
                            key={m.name} 
                            label={m.name} 
                            value={Number(m.kills)} 
                            max={Math.max(...mapStats.map(x => Number(x.kills)))} 
                            color="bg-red-500" 
                        />
                    ))}
                </div>
            </div>

            {/* Section 3: Distribution (Table Style for Clarity) */}
            <div className="mb-8">
                <h3 className="text-xl font-bold border-l-4 border-blue-500 pl-3 mb-4 uppercase">{t.distMatches}</h3>
                <div className="grid grid-cols-6 gap-2">
                    {mapStats.map(m => (
                        <div key={m.name} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                            <p className="text-[10px] font-bold uppercase mb-1 truncate">{m.name}</p>
                            <p className="text-xl font-black">{m.matches || 0}</p>
                            <p className="text-[10px] text-gray-400">Salas</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Section 4: Individual Stats */}
            <div>
                <h3 className="text-xl font-bold border-l-4 border-purple-500 pl-3 mb-4 uppercase">{t.individual}</h3>
                <div className="overflow-hidden rounded-xl border border-white/10">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase font-bold text-xs">
                            <tr>
                                <th className="p-3 text-left">{t.player}</th>
                                <th className="p-3 text-center">{t.matches}</th>
                                <th className="p-3 text-center">{t.kills}</th>
                                <th className="p-3 text-center">{t.deaths}</th>
                                <th className="p-3 text-center">{t.assists}</th>
                                <th className="p-3 text-center">{t.damage}</th>
                                <th className="p-3 text-center">{t.knockdowns}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {playerStats.map((p, i) => (
                                <tr key={i} className="bg-graphite-900 text-white">
                                    <td className="p-3 font-bold">{p.name || `Player ${p.id}`}</td>
                                    <td className="p-3 text-center">{p.matches}</td>
                                    <td className="p-3 text-center font-bold text-red-500">{p.kills}</td>
                                    <td className="p-3 text-center">{p.deaths}</td>
                                    <td className="p-3 text-center">{p.assists}</td>
                                    <td className="p-3 text-center">{p.damage}</td>
                                    <td className="p-3 text-center">{p.knockdowns}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-8 text-center text-xs text-gray-400 font-mono uppercase">
                Jhan Medeiros Analytics • {new Date().toLocaleDateString()}
            </div>
         </div>
      </div>
    );
  }

  // --- VIEW: EDIT ---
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black italic tracking-wide text-loud-500 uppercase">{t.title}</h1>
          <p className="text-gray-500">{t.subtitle}</p>
        </div>
        <div className="flex gap-2">
            <button onClick={handleReset} className="flex items-center gap-2 bg-gray-200 dark:bg-gray-800 px-4 py-2 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors">
                <RefreshCw size={18} /> {t.reset}
            </button>
            <button onClick={handleGenerateSummary} className="flex items-center gap-2 bg-loud-500 text-gray-900 px-6 py-2 rounded-lg hover:bg-loud-600 font-bold shadow-lg shadow-loud-500/20">
                <FileText size={18} /> {t.generate}
            </button>
        </div>
      </div>

      {/* INPUT MODE TOGGLE */}
      <div className="bg-graphite-800 text-white p-2 rounded-xl border border-white/10 flex flex-col sm:flex-row gap-2">
          <button 
            onClick={() => setInputMode('scanner')}
            className={`flex-1 py-3 px-4 rounded-lg font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              inputMode === 'scanner' 
                ? 'bg-loud-500 text-gray-900 shadow-lg shadow-loud-500/20' 
                : 'text-gray-400 hover:text-white hover:bg-graphite-700'
            }`}
          >
              <ImageIcon size={16} />
              <span>Importar por Prints / Fotos</span>
              <span className="bg-black/40 text-[10px] px-1.5 py-0.5 rounded text-white font-mono uppercase">Sem IA / IA</span>
          </button>
          <button 
            onClick={() => setInputMode('detailed')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              inputMode === 'detailed' 
                ? 'bg-loud-500 text-gray-900 shadow-lg shadow-loud-500/20' 
                : 'text-gray-400 hover:text-white hover:bg-graphite-700'
            }`}
          >
              <FileText size={16} />
              <span>Modo Detalhado (Queda a Queda)</span>
              {matches.length > 0 && (
                <span className="bg-black/30 text-[11px] px-2 py-0.5 rounded-full font-bold">
                  {matches.length}
                </span>
              )}
          </button>
          <button 
            onClick={() => setInputMode('simple')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              inputMode === 'simple' 
                ? 'bg-loud-500 text-gray-900 shadow-lg shadow-loud-500/20' 
                : 'text-gray-400 hover:text-white hover:bg-graphite-700'
            }`}
          >
              <BarChart2 size={16} />
              <span>Modo Simples (Totais)</span>
          </button>
      </div>

      {/* Import Notification Banner */}
      {importBanner && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-4 rounded-2xl flex items-center justify-between gap-3 animate-fade-in shadow-lg">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={22} className="text-emerald-400 shrink-0" />
            <span className="text-sm font-medium">{importBanner}</span>
          </div>
          <button
            onClick={() => setImportBanner(null)}
            className="text-xs text-gray-400 hover:text-white underline cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* 1. Event Info (Shared) */}
      <div className="bg-graphite-800 text-white p-6 rounded-2xl shadow-sm border border-white/10 grid grid-cols-1 md:grid-cols-3 gap-6">
         <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">{t.eventType}</label>
            <div className="flex bg-graphite-900 rounded-lg p-1">
                <button 
                    onClick={() => setEventType('competicao')}
                    className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${eventType === 'competicao' ? 'bg-loud-500 text-graphite-900 shadow' : 'text-gray-500'}`}
                >
                    {t.competition}
                </button>
                <button 
                    onClick={() => setEventType('treino')}
                    className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${eventType === 'treino' ? 'bg-loud-500 text-graphite-900 shadow' : 'text-gray-500'}`}
                >
                    {t.practice}
                </button>
            </div>
         </div>
         <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">{t.eventName}</label>
            <input 
                type="text" 
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder={t.eventName}
                className="w-full bg-graphite-900 border border-white/10 rounded-lg p-2.5 outline-none focus:border-loud-500 transition-colors"
            />
         </div>
      </div>

      {/* --- CONTENT BASED ON MODE --- */}
      {inputMode === 'scanner' && (
        <ScoreboardImageScanner
          onImportMatches={handleImportFromScanner}
          existingMatchCount={matches.length}
        />
      )}

      {inputMode === 'simple' && (
          <>
            {/* Simple Mode: Collective Stats Preview */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 rounded-2xl shadow-lg border border-gray-700">
                <h3 className="text-lg font-bold uppercase mb-4 text-loud-500 flex items-center gap-2">
                    <BarChart2 /> {t.collective} (Preview)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                    <div className="bg-white/5 rounded-xl p-3 backdrop-blur-sm"><p className="text-xs text-gray-400 uppercase font-bold">{t.points}</p><p className="text-3xl font-black">{collectiveStats.totalPoints}</p></div>
                    <div className="bg-white/5 rounded-xl p-3 backdrop-blur-sm"><p className="text-xs text-gray-400 uppercase font-bold">{t.matches}</p><p className="text-3xl font-black">{collectiveStats.totalMatches}</p></div>
                    <div className="bg-white/5 rounded-xl p-3 backdrop-blur-sm"><p className="text-xs text-gray-400 uppercase font-bold">{t.kills}</p><p className="text-3xl font-black text-red-400">{collectiveStats.totalKills}</p></div>
                    <div className="bg-white/5 rounded-xl p-3 backdrop-blur-sm"><p className="text-xs text-gray-400 uppercase font-bold">{t.avgPoints}</p><p className="text-2xl font-bold">{collectiveStats.avgPoints}</p></div>
                    <div className="bg-white/5 rounded-xl p-3 backdrop-blur-sm"><p className="text-xs text-gray-400 uppercase font-bold">{t.avgKills}</p><p className="text-2xl font-bold">{collectiveStats.avgKills}</p></div>
                </div>
            </div>

            {/* Simple Mode: Map Stats Inputs */}
            <div>
                <h3 className="text-xl font-bold mb-4 uppercase border-l-4 border-loud-500 pl-3">{t.maps}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mapStats.map((map, idx) => (
                        <div key={idx} className="bg-graphite-800 text-white p-4 rounded-xl border border-white/10 shadow-sm hover:border-loud-500 transition-colors">
                            <h4 className="font-bold text-lg mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">{map.name}</h4>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                <div><label className="text-[10px] font-bold text-gray-500 uppercase">{t.points}</label><input type="number" value={map.points} onChange={(e) => updateMap(idx, 'points', e.target.value)} className="w-full bg-graphite-900 border border-gray-200 dark:border-gray-600 rounded p-1.5 text-center font-bold outline-none focus:border-loud-500" /></div>
                                <div><label className="text-[10px] font-bold text-gray-500 uppercase">{t.matches}</label><input type="number" value={map.matches} onChange={(e) => updateMap(idx, 'matches', e.target.value)} className="w-full bg-graphite-900 border border-gray-200 dark:border-gray-600 rounded p-1.5 text-center font-bold outline-none focus:border-loud-500" /></div>
                                <div><label className="text-[10px] font-bold text-gray-500 uppercase">{t.kills}</label><input type="number" value={map.kills} onChange={(e) => updateMap(idx, 'kills', e.target.value)} className="w-full bg-graphite-900 border border-gray-200 dark:border-gray-600 rounded p-1.5 text-center font-bold text-red-500 outline-none focus:border-loud-500" /></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Simple Mode: Individual Stats Inputs */}
            <div>
                <h3 className="text-xl font-bold mb-4 uppercase border-l-4 border-purple-500 pl-3">{t.individual}</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {playerStats.map((player, idx) => (
                        <div key={player.id} className="bg-graphite-800 text-white p-5 rounded-xl border border-white/10 shadow-sm relative group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gray-200 dark:bg-gray-700 group-hover:bg-loud-500 transition-colors rounded-l-xl"></div>
                            <div className="pl-3">
                                <input type="text" placeholder={`${t.player} ${player.id}`} value={player.name} onChange={(e) => updatePlayer(idx, 'name', e.target.value)} className="w-full bg-transparent text-xl font-bold mb-4 border-b border-white/10 pb-1 outline-none focus:border-loud-500 placeholder-gray-300 dark:placeholder-gray-600" />
                                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                    <div><label className="text-[10px] font-bold text-gray-500 uppercase">{t.matches}</label><input type="number" value={player.matches} onChange={(e) => updatePlayer(idx, 'matches', e.target.value)} className="w-full bg-graphite-900 border border-gray-200 dark:border-gray-600 rounded p-1.5 text-center font-bold outline-none focus:border-loud-500" /></div>
                                    <div><label className="text-[10px] font-bold text-gray-500 uppercase">{t.kills}</label><input type="number" value={player.kills} onChange={(e) => updatePlayer(idx, 'kills', e.target.value)} className="w-full bg-graphite-900 border border-gray-200 dark:border-gray-600 rounded p-1.5 text-center font-bold text-red-500 outline-none focus:border-loud-500" /></div>
                                    <div><label className="text-[10px] font-bold text-gray-500 uppercase">{t.deaths}</label><input type="number" value={player.deaths} onChange={(e) => updatePlayer(idx, 'deaths', e.target.value)} className="w-full bg-graphite-900 border border-gray-200 dark:border-gray-600 rounded p-1.5 text-center font-bold outline-none focus:border-loud-500" /></div>
                                    <div><label className="text-[10px] font-bold text-gray-500 uppercase">{t.assists}</label><input type="number" value={player.assists} onChange={(e) => updatePlayer(idx, 'assists', e.target.value)} className="w-full bg-graphite-900 border border-gray-200 dark:border-gray-600 rounded p-1.5 text-center font-bold outline-none focus:border-loud-500" /></div>
                                    <div><label className="text-[10px] font-bold text-gray-500 uppercase">{t.damage}</label><input type="number" value={player.damage} onChange={(e) => updatePlayer(idx, 'damage', e.target.value)} className="w-full bg-graphite-900 border border-gray-200 dark:border-gray-600 rounded p-1.5 text-center font-bold outline-none focus:border-loud-500" /></div>
                                    <div><label className="text-[10px] font-bold text-gray-500 uppercase">{t.knockdowns}</label><input type="number" value={player.knockdowns} onChange={(e) => updatePlayer(idx, 'knockdowns', e.target.value)} className="w-full bg-graphite-900 border border-gray-200 dark:border-gray-600 rounded p-1.5 text-center font-bold outline-none focus:border-loud-500" /></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </>
      )}

      {/* --- DETAILED MODE UI --- */}
      {inputMode === 'detailed' && (
          <div className="space-y-8 animate-fade-in">
              <div className="bg-loud-500/10 border border-loud-500/30 p-4 rounded-xl text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-loud-500 uppercase tracking-wide">Modo Detalhado (Queda a Queda)</p>
                    <p className="text-gray-300 text-xs">Adicione cada queda individualmente ou escaneie os prints do jogo com IA para preenchimento automático. O sistema somará todos os abates, pontos e estatísticas ao gerar o resumo.</p>
                  </div>
                  <button
                    onClick={() => setInputMode('scanner')}
                    className="shrink-0 bg-loud-500 hover:bg-loud-600 text-gray-900 px-4 py-2 rounded-lg font-black text-xs uppercase flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                  >
                    <Sparkles size={14} />
                    Escanear Prints com IA
                  </button>
              </div>

              {/* Player Names Section */}
              <div className="bg-graphite-800 text-white p-6 rounded-2xl shadow-sm border border-white/10">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Trophy size={18} className="text-loud-500"/> Nomes dos Jogadores (Line-up)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                      {playerStats.map((p, i) => (
                          <div key={i}>
                              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Jogador {i+1}</label>
                              <input 
                                type="text" 
                                placeholder={`Nick Jogador ${i+1}`}
                                value={p.name}
                                onChange={(e) => updatePlayer(i, 'name', e.target.value)}
                                className="w-full bg-graphite-900 border border-white/10 rounded p-2 text-sm font-bold focus:border-loud-500 outline-none"
                              />
                          </div>
                      ))}
                  </div>
              </div>

              {/* Match List */}
              <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-xl font-bold uppercase border-l-4 border-loud-500 pl-3">Partidas / Quedas ({matches.length})</h3>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setInputMode('scanner')} 
                          className="flex items-center gap-1.5 bg-graphite-800 hover:bg-graphite-700 text-loud-500 border border-loud-500/30 px-3.5 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer"
                        >
                            <Sparkles size={16}/> Importar Prints IA
                        </button>
                        <button 
                          onClick={addMatch} 
                          className="flex items-center gap-1.5 bg-loud-500 hover:bg-loud-600 text-gray-900 px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-md cursor-pointer"
                        >
                            <Plus size={16}/> Adicionar Queda Manual
                        </button>
                      </div>
                  </div>

                  {matches.length === 0 ? (
                      <div className="text-center py-12 bg-graphite-800/60 rounded-2xl border-2 border-dashed border-white/10 space-y-3">
                          <p className="text-gray-400 font-medium">Nenhuma partida adicionada ainda.</p>
                          <div className="flex justify-center gap-3">
                            <button onClick={() => setInputMode('scanner')} className="bg-loud-500 text-gray-900 px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 shadow-md hover:bg-loud-600 transition-all cursor-pointer">
                              <Sparkles size={14} /> Escanear Prints com IA
                            </button>
                            <button onClick={addMatch} className="bg-graphite-800 text-white border border-white/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-graphite-700 transition-all cursor-pointer">
                              Adicionar Queda Manual
                            </button>
                          </div>
                      </div>
                  ) : (
                      matches.map((match, mIdx) => (
                          <div key={match.id} className="bg-graphite-800 text-white rounded-2xl shadow-sm border border-white/10 overflow-hidden animate-fade-in-down">
                              {/* Match Header */}
                              <div className="bg-graphite-900/50 p-4 border-b border-white/10 flex flex-wrap gap-4 justify-between items-center">
                                  <div className="flex items-center gap-4">
                                      <span className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded text-xs font-bold text-premium-muted hover:text-white uppercase">Queda {mIdx + 1}</span>
                                      <div className="flex items-center gap-2">
                                          <select 
                                            value={match.map}
                                            onChange={(e) => updateMatch(match.id, 'map', e.target.value)}
                                            className="bg-transparent font-bold text-lg outline-none cursor-pointer hover:text-loud-500"
                                          >
                                              {MAP_OPTIONS.map(m => <option key={m} value={m} className="bg-graphite-800 text-white">{m}</option>)}
                                          </select>
                                          <ChevronDown size={14} className="text-gray-400"/>
                                      </div>
                                  </div>
                                  <button onClick={() => removeMatch(match.id)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={18}/></button>
                              </div>

                              {/* Match Details */}
                              <div className="p-4 grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
                                  {/* Left: General Info */}
                                  <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                          <div>
                                              <label className="text-[10px] font-bold text-gray-500 uppercase">Rank (Colocação)</label>
                                              <input 
                                                type="number" 
                                                placeholder="#"
                                                value={match.rank} 
                                                onChange={(e) => updateMatch(match.id, 'rank', e.target.value)}
                                                className="w-full bg-graphite-900 border border-gray-200 dark:border-gray-600 rounded p-2 text-center font-bold text-lg outline-none focus:border-loud-500"
                                              />
                                          </div>
                                          <div>
                                              <label className="text-[10px] font-bold text-gray-500 uppercase">Pts de Colocação</label>
                                              <input 
                                                type="number" 
                                                placeholder="Pts"
                                                value={match.placementPoints} 
                                                onChange={(e) => updateMatch(match.id, 'placementPoints', e.target.value)}
                                                className="w-full bg-graphite-900 border border-gray-200 dark:border-gray-600 rounded p-2 text-center font-bold text-lg outline-none focus:border-loud-500"
                                              />
                                          </div>
                                      </div>
                                      <div className="bg-graphite-900 p-3 rounded-lg flex justify-between items-center border border-gray-100 dark:border-gray-800">
                                          <span className="text-xs font-bold text-gray-500 uppercase">Total da Queda</span>
                                          <span className="text-xl font-black text-loud-500">
                                              {(parseInt(match.placementPoints) || 0) + (match.playerData.reduce((acc, c) => acc + (parseInt(c.kills)||0), 0))} Pts
                                          </span>
                                      </div>
                                  </div>

                                  {/* Right: Player Stats Table */}
                                  <div className="overflow-x-auto">
                                      <table className="w-full text-xs">
                                          <thead>
                                              <tr className="text-gray-500 border-b border-white/10">
                                                  <th className="text-left py-2 font-bold uppercase w-1/3">Jogador</th>
                                                  <th className="text-center py-2 font-bold uppercase">Kills</th>
                                                  <th className="text-center py-2 font-bold uppercase">Dano</th>
                                                  <th className="text-center py-2 font-bold uppercase">Assis.</th>
                                                  <th className="text-center py-2 font-bold uppercase hidden sm:table-cell">Morte</th>
                                                  <th className="text-center py-2 font-bold uppercase hidden sm:table-cell">Knock</th>
                                              </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                              {match.playerData.map((pData, pIdx) => (
                                                  <tr key={pIdx}>
                                                      <td className="py-2 font-bold truncate max-w-[100px]" title={playerStats[pIdx].name}>
                                                          {playerStats[pIdx].name || `Jogador ${pIdx+1}`}
                                                      </td>
                                                      <td className="p-1"><input type="number" placeholder="0" className="w-full bg-graphite-900 border border-white/10 rounded p-1.5 text-center font-bold focus:border-red-500 outline-none text-red-500" value={pData.kills} onChange={e => updateMatchPlayer(match.id, pIdx, 'kills', e.target.value)} /></td>
                                                      <td className="p-1"><input type="number" placeholder="0" className="w-full bg-graphite-900 border border-white/10 rounded p-1.5 text-center outline-none focus:border-loud-500" value={pData.damage} onChange={e => updateMatchPlayer(match.id, pIdx, 'damage', e.target.value)} /></td>
                                                      <td className="p-1"><input type="number" placeholder="0" className="w-full bg-graphite-900 border border-white/10 rounded p-1.5 text-center outline-none focus:border-loud-500" value={pData.assists} onChange={e => updateMatchPlayer(match.id, pIdx, 'assists', e.target.value)} /></td>
                                                      <td className="p-1 hidden sm:table-cell"><input type="number" placeholder="0" className="w-full bg-graphite-900 border border-white/10 rounded p-1.5 text-center outline-none focus:border-loud-500" value={pData.deaths} onChange={e => updateMatchPlayer(match.id, pIdx, 'deaths', e.target.value)} /></td>
                                                      <td className="p-1 hidden sm:table-cell"><input type="number" placeholder="0" className="w-full bg-graphite-900 border border-white/10 rounded p-1.5 text-center outline-none focus:border-loud-500" value={pData.knocks} onChange={e => updateMatchPlayer(match.id, pIdx, 'knocks', e.target.value)} /></td>
                                                  </tr>
                                              ))}
                                          </tbody>
                                      </table>
                                  </div>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default Statistics;
