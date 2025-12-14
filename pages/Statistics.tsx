import React, { useState, useMemo } from 'react';
import { Printer, RefreshCw, BarChart2, FileText, ChevronLeft } from 'lucide-react';
import { translations, Language } from '../translations';
import { downloadDivAsImage } from '../utils';

interface StatisticsProps {
  language: Language;
}

interface MapStat {
  name: string;
  points: string; // Using string for better input handling, parsed to number for calc
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

// Moved outside and typed as React.FC to accept key prop correctly
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
  
  // Event State
  const [eventType, setEventType] = useState<'competicao' | 'treino'>('competicao');
  const [eventName, setEventName] = useState('');

  // Map Data State (6 Maps)
  const initialMaps: MapStat[] = [
    { name: 'Bermuda', points: '', matches: '', kills: '' },
    { name: 'Purgatório', points: '', matches: '', kills: '' },
    { name: 'Alpine', points: '', matches: '', kills: '' },
    { name: 'Nova Terra', points: '', matches: '', kills: '' },
    { name: 'Kalahari', points: '', matches: '', kills: '' },
    { name: 'Solara', points: '', matches: '', kills: '' },
  ];
  const [mapStats, setMapStats] = useState<MapStat[]>(initialMaps);

  // Player Data State (5 Players)
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

  // Calculations (Memoized)
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

  const handleReset = () => {
    if (confirm('Tem certeza? Todos os dados serão perdidos.')) {
      setMapStats(initialMaps);
      setPlayerStats(initialPlayers);
      setEventName('');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (viewMode === 'summary') {
    return (
      <div className="animate-fade-in bg-white dark:bg-gray-900 min-h-screen">
         {/* Summary Header (No Print) */}
         <div className="no-print p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white/90 dark:bg-gray-900/90 z-20 backdrop-blur-md">
            <button onClick={() => setViewMode('edit')} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-brand-500">
                <ChevronLeft /> {t.back}
            </button>
            <div className="flex gap-2">
                <button onClick={() => downloadDivAsImage('summary-report', 'resumo-time')} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    <BarChart2 size={18} /> Imagem
                </button>
                <button onClick={handlePrint} className="flex items-center gap-2 bg-brand-500 text-gray-900 px-4 py-2 rounded-lg hover:bg-brand-600 font-bold">
                    <Printer size={18} /> {t.print}
                </button>
            </div>
         </div>

         {/* Printable Area */}
         <div id="summary-report" className="max-w-5xl mx-auto p-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            {/* Header */}
            <div className="text-center mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-4xl font-black italic tracking-tighter uppercase text-brand-500 mb-2">{t.summary}</h1>
                <h2 className="text-2xl font-bold">{eventName || t.eventName}</h2>
                <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-bold uppercase mt-2">
                    {eventType === 'competicao' ? t.competition : t.practice}
                </span>
            </div>

            {/* Section 1: Collective Stats */}
            <div className="mb-8">
                <h3 className="text-xl font-bold border-l-4 border-brand-500 pl-3 mb-4 uppercase">{t.collective}</h3>
                <div className="grid grid-cols-5 gap-4 bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                   <div>
                       <p className="text-xs text-gray-500 uppercase font-bold">{t.points}</p>
                       <p className="text-3xl font-black text-brand-500">{collectiveStats.totalPoints}</p>
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
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-bold uppercase mb-4 text-center">{t.chartPoints}</h4>
                    {mapStats.map(m => (
                        <ChartBar 
                            key={m.name} 
                            label={m.name} 
                            value={Number(m.points)} 
                            max={Math.max(...mapStats.map(x => Number(x.points)))} 
                            color="bg-brand-500" 
                        />
                    ))}
                </div>
                {/* Kills Chart */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
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
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
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
                                <tr key={i} className="bg-white dark:bg-gray-900">
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

  // Edit Mode
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black italic tracking-wide text-brand-500 uppercase">{t.title}</h1>
          <p className="text-gray-500">{t.subtitle}</p>
        </div>
        <div className="flex gap-2">
            <button onClick={handleReset} className="flex items-center gap-2 bg-gray-200 dark:bg-gray-800 px-4 py-2 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors">
                <RefreshCw size={18} /> {t.reset}
            </button>
            <button onClick={() => setViewMode('summary')} className="flex items-center gap-2 bg-brand-500 text-gray-900 px-6 py-2 rounded-lg hover:bg-brand-600 font-bold shadow-lg shadow-brand-500/20">
                <FileText size={18} /> {t.generate}
            </button>
        </div>
      </div>

      <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg text-yellow-800 dark:text-yellow-200 text-sm font-medium text-center border border-yellow-200 dark:border-yellow-700/50">
        💡 {t.disclaimer}
      </div>

      {/* 1. Event Info */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-6">
         <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">{t.eventType}</label>
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button 
                    onClick={() => setEventType('competicao')}
                    className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${eventType === 'competicao' ? 'bg-white dark:bg-gray-600 shadow text-brand-500' : 'text-gray-500'}`}
                >
                    {t.competition}
                </button>
                <button 
                    onClick={() => setEventType('treino')}
                    className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${eventType === 'treino' ? 'bg-white dark:bg-gray-600 shadow text-brand-500' : 'text-gray-500'}`}
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
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 outline-none focus:border-brand-500 transition-colors"
            />
         </div>
      </div>

      {/* 2. Collective Stats (Read Only) */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 rounded-2xl shadow-lg border border-gray-700">
        <h3 className="text-lg font-bold uppercase mb-4 text-brand-500 flex items-center gap-2">
            <BarChart2 /> {t.collective}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className="bg-white/5 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-xs text-gray-400 uppercase font-bold">{t.points}</p>
                <p className="text-3xl font-black">{collectiveStats.totalPoints}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-xs text-gray-400 uppercase font-bold">{t.matches}</p>
                <p className="text-3xl font-black">{collectiveStats.totalMatches}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-xs text-gray-400 uppercase font-bold">{t.kills}</p>
                <p className="text-3xl font-black text-red-400">{collectiveStats.totalKills}</p>
            </div>
             <div className="bg-white/5 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-xs text-gray-400 uppercase font-bold">{t.avgPoints}</p>
                <p className="text-2xl font-bold">{collectiveStats.avgPoints}</p>
            </div>
             <div className="bg-white/5 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-xs text-gray-400 uppercase font-bold">{t.avgKills}</p>
                <p className="text-2xl font-bold">{collectiveStats.avgKills}</p>
            </div>
        </div>
      </div>

      {/* 3. Map Stats Inputs */}
      <div>
        <h3 className="text-xl font-bold mb-4 uppercase border-l-4 border-brand-500 pl-3">{t.maps}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mapStats.map((map, idx) => {
                const p = Number(map.points) || 0;
                const m = Number(map.matches) || 0;
                const k = Number(map.kills) || 0;
                const avgP = m > 0 ? (p/m).toFixed(1) : '-';
                const avgK = m > 0 ? (k/m).toFixed(1) : '-';

                return (
                    <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:border-brand-500 transition-colors">
                        <h4 className="font-bold text-lg mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">{map.name}</h4>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">{t.points}</label>
                                <input type="number" value={map.points} onChange={(e) => updateMap(idx, 'points', e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded p-1.5 text-center font-bold outline-none focus:border-brand-500" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">{t.matches}</label>
                                <input type="number" value={map.matches} onChange={(e) => updateMap(idx, 'matches', e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded p-1.5 text-center font-bold outline-none focus:border-brand-500" />
                            </div>
                             <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">{t.kills}</label>
                                <input type="number" value={map.kills} onChange={(e) => updateMap(idx, 'kills', e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded p-1.5 text-center font-bold text-red-500 outline-none focus:border-brand-500" />
                            </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 bg-gray-50 dark:bg-gray-900 p-2 rounded">
                            <span>{t.avgPoints}: <strong className="text-gray-700 dark:text-gray-200">{avgP}</strong></span>
                            <span>{t.avgKills}: <strong className="text-gray-700 dark:text-gray-200">{avgK}</strong></span>
                        </div>
                    </div>
                )
            })}
        </div>
      </div>

      {/* 4. Individual Stats Inputs */}
      <div>
         <h3 className="text-xl font-bold mb-4 uppercase border-l-4 border-purple-500 pl-3">{t.individual}</h3>
         <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {playerStats.map((player, idx) => (
                <div key={player.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gray-200 dark:bg-gray-700 group-hover:bg-brand-500 transition-colors rounded-l-xl"></div>
                    <div className="pl-3">
                         <input 
                            type="text" 
                            placeholder={`${t.player} ${player.id}`}
                            value={player.name}
                            onChange={(e) => updatePlayer(idx, 'name', e.target.value)}
                            className="w-full bg-transparent text-xl font-bold mb-4 border-b border-gray-200 dark:border-gray-700 pb-1 outline-none focus:border-brand-500 placeholder-gray-300 dark:placeholder-gray-600"
                        />
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                             <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">{t.matches}</label>
                                <input type="number" value={player.matches} onChange={(e) => updatePlayer(idx, 'matches', e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded p-1.5 text-center font-bold outline-none focus:border-brand-500" />
                            </div>
                             <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">{t.kills}</label>
                                <input type="number" value={player.kills} onChange={(e) => updatePlayer(idx, 'kills', e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded p-1.5 text-center font-bold text-red-500 outline-none focus:border-brand-500" />
                            </div>
                             <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">{t.deaths}</label>
                                <input type="number" value={player.deaths} onChange={(e) => updatePlayer(idx, 'deaths', e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded p-1.5 text-center font-bold outline-none focus:border-brand-500" />
                            </div>
                             <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">{t.assists}</label>
                                <input type="number" value={player.assists} onChange={(e) => updatePlayer(idx, 'assists', e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded p-1.5 text-center font-bold outline-none focus:border-brand-500" />
                            </div>
                             <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">{t.damage}</label>
                                <input type="number" value={player.damage} onChange={(e) => updatePlayer(idx, 'damage', e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded p-1.5 text-center font-bold outline-none focus:border-brand-500" />
                            </div>
                             <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">{t.knockdowns}</label>
                                <input type="number" value={player.knockdowns} onChange={(e) => updatePlayer(idx, 'knockdowns', e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded p-1.5 text-center font-bold outline-none focus:border-brand-500" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default Statistics;