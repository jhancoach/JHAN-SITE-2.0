import React, { useState, useEffect } from 'react';
import { 
  Trophy, Save, Printer, ImageIcon, Share2, MonitorPlay, 
  Trash2, Plus, ArrowRight, CheckCircle, ChevronRight, Settings, Users, Sword
} from 'lucide-react';
import { downloadDivAsImage } from '../utils';

// --- TYPES ---

interface Team {
  id: string;
  name: string;
  logo: string | null;
}

interface Match {
  id: string; // Ex: "round1-match1"
  round: number;
  teamAId: string | null;
  teamBId: string | null;
  scoreA: number;
  scoreB: number;
  winnerId: string | null;
}

interface TournamentData {
  name: string;
  teamsCount: number;
  format: 'single' | 'double' | 'swiss';
  seriesFormat: 'MD1' | 'MD3' | 'MD5' | 'MD7';
  teams: Team[];
  matches: Match[];
}

const BracketCreator: React.FC = () => {
  // --- STATE ---
  const [data, setData] = useState<TournamentData>(() => {
    const saved = localStorage.getItem('ff_tournament_data');
    if (saved) return JSON.parse(saved);
    return {
      name: 'TORNEIO JHAN MEDEIROS',
      teamsCount: 8,
      format: 'single',
      seriesFormat: 'MD1',
      teams: [],
      matches: []
    };
  });

  const [newTeamName, setNewTeamName] = useState('');

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('ff_tournament_data', JSON.stringify(data));
  }, [data]);

  // --- ACTIONS ---

  const handleCreateBracket = () => {
      const { teamsCount } = data;
      const rounds = Math.log2(teamsCount);
      const newMatches: Match[] = [];

      for (let r = 1; r <= rounds; r++) {
          const matchesInRound = Math.pow(2, rounds - r);
          for (let m = 1; m <= matchesInRound; m++) {
              newMatches.push({
                  id: `R${r}-M${m}`,
                  round: r,
                  teamAId: null,
                  teamBId: null,
                  scoreA: 0,
                  scoreB: 0,
                  winnerId: null
              });
          }
      }

      // Pre-fill Round 1 with available teams
      for (let i = 0; i < data.teams.length; i += 2) {
          const matchIdx = Math.floor(i / 2);
          if (newMatches[matchIdx]) {
              newMatches[matchIdx].teamAId = data.teams[i]?.id || null;
              newMatches[matchIdx].teamBId = data.teams[i + 1]?.id || null;
          }
      }

      setData(prev => ({ ...prev, matches: newMatches }));
  };

  const addTeam = () => {
      if (!newTeamName.trim() || data.teams.length >= data.teamsCount) return;
      const newTeam: Team = {
          id: Date.now().toString(),
          name: newTeamName.trim().toUpperCase(),
          logo: null
      };
      setData(prev => ({ ...prev, teams: [...prev.teams, newTeam] }));
      setNewTeamName('');
  };

  const removeTeam = (id: string) => {
      setData(prev => ({ 
          ...prev, 
          teams: prev.teams.filter(t => t.id !== id),
          matches: [] // Reset bracket on team list change for consistency
      }));
  };

  const updateScore = (matchId: string, side: 'A' | 'B', val: number) => {
      setData(prev => {
          const newMatches = prev.matches.map(m => {
              if (m.id === matchId) {
                  return { ...m, [side === 'A' ? 'scoreA' : 'scoreB']: val };
              }
              return m;
          });
          return { ...prev, matches: newMatches };
      });
  };

  const setWinner = (matchId: string, teamId: string | null) => {
      if (!teamId) return;
      
      setData(prev => {
          const newMatches = [...prev.matches];
          const matchIdx = newMatches.findIndex(m => m.id === matchId);
          if (matchIdx === -1) return prev;

          newMatches[matchIdx].winnerId = teamId;

          // Logic to advance to next match
          const [rStr, mStr] = matchId.split('-');
          const round = parseInt(rStr.replace('R', ''));
          const matchNum = parseInt(mStr.replace('M', ''));
          
          const nextRound = round + 1;
          const nextMatchNum = Math.ceil(matchNum / 2);
          const nextMatchId = `R${nextRound}-M${nextMatchNum}`;
          
          const nextMatchIdx = newMatches.findIndex(m => m.id === nextMatchId);
          if (nextMatchIdx !== -1) {
              const isTeamASlot = matchNum % 2 !== 0;
              if (isTeamASlot) {
                  newMatches[nextMatchIdx].teamAId = teamId;
              } else {
                  newMatches[nextMatchIdx].teamBId = teamId;
              }
          }

          return { ...prev, matches: newMatches };
      });
  };

  const openOverlay = () => {
      window.open('/overlay/chaveamento', '_blank');
  };

  // --- RENDER HELPERS ---

  const getRoundMatches = (round: number) => data.matches.filter(m => m.round === round);
  const totalRounds = Math.log2(data.teamsCount);

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-10 animate-fade-in pb-20">
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gray-900 border border-gray-800 p-8 rounded-3xl shadow-2xl">
            <div>
                <h1 className="text-3xl font-black text-brand-500 uppercase italic tracking-tighter flex items-center gap-3">
                    <Trophy size={32} /> Criar Chaveamento
                </h1>
                <p className="text-gray-500 font-bold uppercase text-xs tracking-widest mt-1">Free Fire • Torneios & Scrims</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
                <button onClick={() => downloadDivAsImage('bracket-area', 'chaveamento')} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all">
                    <ImageIcon size={16}/> Print
                </button>
                <button onClick={() => window.print()} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all">
                    <Printer size={16}/> Imprimir
                </button>
                <button onClick={openOverlay} className="bg-brand-500 hover:bg-brand-600 text-black px-6 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg animate-pulse">
                    <MonitorPlay size={16}/> Versão Overlay (LIVE)
                </button>
            </div>
        </div>

        {/* --- CONFIGURATION FORM --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 1. Basic Info */}
            <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-3xl space-y-6">
                <div className="flex items-center gap-2 text-brand-500 font-black text-sm uppercase italic">
                    <Settings size={18}/> Configurações Gerais
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Nome do Torneio</label>
                        <input 
                            type="text" 
                            value={data.name} 
                            onChange={e => setData(prev => ({...prev, name: e.target.value.toUpperCase()}))}
                            className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none font-bold"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Times</label>
                            <select 
                                value={data.teamsCount} 
                                onChange={e => setData(prev => ({...prev, teamsCount: parseInt(e.target.value), matches: []}))}
                                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none font-bold"
                            >
                                <option value={2}>2 Times</option>
                                <option value={4}>4 Times</option>
                                <option value={8}>8 Times</option>
                                <option value={16}>16 Times</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Formato</label>
                            <select 
                                value={data.format}
                                onChange={e => setData(prev => ({...prev, format: e.target.value as any}))}
                                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none font-bold"
                            >
                                <option value="single">Elim. Simples</option>
                                <option value="double">Elim. Dupla</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Série (Melhor de X)</label>
                        <div className="flex gap-2">
                            {['MD1', 'MD3', 'MD5', 'MD7'].map(md => (
                                <button 
                                    key={md} 
                                    onClick={() => setData(prev => ({...prev, seriesFormat: md as any}))}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${data.seriesFormat === md ? 'bg-brand-500 text-black' : 'bg-gray-800 text-gray-400'}`}
                                >
                                    {md}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Team Management */}
            <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-3xl space-y-6 lg:col-span-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-brand-500 font-black text-sm uppercase italic">
                        <Users size={18}/> Times ({data.teams.length}/{data.teamsCount})
                    </div>
                    {data.teams.length === data.teamsCount && (
                        <button onClick={handleCreateBracket} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-xl text-xs font-black uppercase transition-all shadow-lg flex items-center gap-2">
                            {/* Fix: Replaced 'ソード' with 'Sword' as per the correct lucide-react import */}
                            <Sword size={16}/> Gerar Confrontos
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="NOME DO TIME..." 
                                value={newTeamName}
                                onChange={e => setNewTeamName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addTeam()}
                                className="flex-1 bg-gray-950 border border-gray-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none font-bold uppercase"
                            />
                            <button onClick={addTeam} className="bg-gray-800 hover:bg-brand-500 hover:text-black p-3 rounded-xl transition-all">
                                <Plus size={20}/>
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-500 italic uppercase">Dica: Adicione os times na ordem que deseja os confrontos ou use um sorteador externo.</p>
                    </div>

                    <div className="bg-gray-950/50 border border-gray-800 rounded-2xl p-4 max-h-48 overflow-y-auto custom-scrollbar">
                        {data.teams.length === 0 ? (
                            <div className="text-center py-10 text-gray-600 text-xs font-bold uppercase">Nenhum time cadastrado.</div>
                        ) : (
                            <div className="space-y-2">
                                {data.teams.map((t, i) => (
                                    <div key={t.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 p-2 px-4 rounded-xl group">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-brand-500">#{i+1}</span>
                                            <span className="text-sm font-bold text-gray-200">{t.name}</span>
                                        </div>
                                        <button onClick={() => removeTeam(t.id)} className="text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* --- BRACKET VISUAL AREA --- */}
        {data.matches.length > 0 && (
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-brand-500 font-black text-sm uppercase italic px-4">
                    <Sword size={18}/> Chaveamento do Torneio
                </div>
                
                <div className="overflow-x-auto pb-10 custom-scrollbar">
                    <div id="bracket-area" className="flex gap-20 p-10 min-w-max justify-center bg-gray-950/30 rounded-[3rem] border border-gray-800/50">
                        {Array.from({ length: totalRounds }).map((_, rIdx) => {
                            const roundNum = rIdx + 1;
                            const roundMatches = getRoundMatches(roundNum);
                            const isFinal = roundNum === totalRounds;

                            return (
                                <div key={roundNum} className="flex flex-col gap-12 items-center">
                                    <h3 className="bg-gray-900 border border-gray-800 px-6 py-2 rounded-full text-[10px] font-black text-brand-500 tracking-[0.3em] uppercase italic">
                                        {isFinal ? 'Grande Final' : `Round ${roundNum}`}
                                    </h3>
                                    
                                    <div className="flex flex-col justify-around flex-1 gap-16 py-10">
                                        {roundMatches.map((m, mIdx) => {
                                            const teamA = data.teams.find(t => t.id === m.teamAId);
                                            const teamB = data.teams.find(t => t.id === m.teamBId);

                                            return (
                                                <div key={m.id} className="relative group">
                                                    <div className="bg-gray-900 border-2 border-gray-800 rounded-3xl w-72 overflow-hidden shadow-2xl transition-all group-hover:border-brand-500/50">
                                                        {/* Team A */}
                                                        <div className={`p-4 flex items-center justify-between border-b border-gray-800 transition-all ${m.winnerId === m.teamAId ? 'bg-brand-500/10' : ''}`}>
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className="w-8 h-8 rounded-lg bg-gray-950 border border-gray-800 flex items-center justify-center font-black text-xs text-brand-500">
                                                                    {teamA?.name.charAt(0) || '?'}
                                                                </div>
                                                                <span className={`text-sm font-black truncate uppercase italic ${teamA ? 'text-gray-100' : 'text-gray-600'}`}>
                                                                    {teamA?.name || 'Aguardando'}
                                                                </span>
                                                            </div>
                                                            <input 
                                                                type="number" 
                                                                value={m.scoreA} 
                                                                onChange={e => updateScore(m.id, 'A', parseInt(e.target.value) || 0)}
                                                                className="w-10 bg-gray-950 border border-gray-800 rounded p-1 text-center font-black text-brand-500 outline-none"
                                                            />
                                                            <button 
                                                                onClick={() => setWinner(m.id, m.teamAId)}
                                                                className={`ml-2 p-1.5 rounded-lg transition-all ${m.winnerId === m.teamAId ? 'text-green-500 bg-green-500/10' : 'text-gray-700 hover:text-white'}`}
                                                            >
                                                                <CheckCircle size={18}/>
                                                            </button>
                                                        </div>

                                                        {/* Team B */}
                                                        <div className={`p-4 flex items-center justify-between transition-all ${m.winnerId === m.teamBId ? 'bg-brand-500/10' : ''}`}>
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className="w-8 h-8 rounded-lg bg-gray-950 border border-gray-800 flex items-center justify-center font-black text-xs text-brand-500">
                                                                    {teamB?.name.charAt(0) || '?'}
                                                                </div>
                                                                <span className={`text-sm font-black truncate uppercase italic ${teamB ? 'text-gray-100' : 'text-gray-600'}`}>
                                                                    {teamB?.name || 'Aguardando'}
                                                                </span>
                                                            </div>
                                                            <input 
                                                                type="number" 
                                                                value={m.scoreB} 
                                                                onChange={e => updateScore(m.id, 'B', parseInt(e.target.value) || 0)}
                                                                className="w-10 bg-gray-950 border border-gray-800 rounded p-1 text-center font-black text-brand-500 outline-none"
                                                            />
                                                            <button 
                                                                onClick={() => setWinner(m.id, m.teamBId)}
                                                                className={`ml-2 p-1.5 rounded-lg transition-all ${m.winnerId === m.teamBId ? 'text-green-500 bg-green-500/10' : 'text-gray-700 hover:text-white'}`}
                                                            >
                                                                <CheckCircle size={18}/>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Connection Lines (Brackets) */}
                                                    {!isFinal && (
                                                        <div className="absolute top-1/2 -right-20 w-20 flex items-center pointer-events-none">
                                                            <div className="h-px bg-gray-700 flex-1"></div>
                                                            <div className={`w-px bg-gray-700 ${mIdx % 2 === 0 ? 'h-32 translate-y-16' : 'h-32 -translate-y-16'}`}></div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default BracketCreator;