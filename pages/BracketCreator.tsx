import React, { useState, useEffect } from 'react';
import { 
  Trophy, ImageIcon, Trash2, Plus, CheckCircle, Settings, Users, Sword, Sparkles
} from 'lucide-react';
import { downloadDivAsImage } from '../utils';
import { useBrandTheme } from '../context/BrandThemeContext';

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
  const { allLogos } = useBrandTheme();

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

  // Helper to find logo by team name
  const findLogoForTeam = (name: string): string | null => {
    const clean = name.toLowerCase().trim();
    const found = allLogos.find(l => {
      const lName = l.name.toLowerCase().trim();
      return lName === clean || lName.includes(clean) || clean.includes(lName);
    });
    return found ? found.imageUrl : null;
  };

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

      for (let i = 0; i < data.teams.length; i += 2) {
          const matchIdx = Math.floor(i / 2);
          if (newMatches[matchIdx]) {
              newMatches[matchIdx].teamAId = data.teams[i]?.id || null;
              newMatches[matchIdx].teamBId = data.teams[i + 1]?.id || null;
          }
      }

      setData(prev => ({ ...prev, matches: newMatches }));
  };

  const addTeam = (customName?: string, customLogo?: string | null) => {
      const nameToAdd = (customName || newTeamName).trim().toUpperCase();
      if (!nameToAdd || data.teams.length >= data.teamsCount) return;
      
      const logoToAdd = customLogo !== undefined ? customLogo : findLogoForTeam(nameToAdd);

      const newTeam: Team = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
          name: nameToAdd,
          logo: logoToAdd
      };
      setData(prev => ({ ...prev, teams: [...prev.teams, newTeam] }));
      setNewTeamName('');
  };

  const removeTeam = (id: string) => {
      setData(prev => ({ 
          ...prev, 
          teams: prev.teams.filter(t => t.id !== id),
          matches: []
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

  // --- RENDER HELPERS ---

  const getRoundMatches = (round: number) => data.matches.filter(m => m.round === round);
  const totalRounds = Math.log2(data.teamsCount);

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-10 animate-fade-in pb-20">
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-graphite-800 border border-white/5 p-8 rounded-3xl shadow-2xl animate-fade-in">
            <div>
                <h1 className="text-3xl font-black text-loud-500 uppercase italic tracking-tighter flex items-center gap-3">
                    <Trophy size={32} /> Criar Chaveamento
                </h1>
                <p className="text-premium-muted font-bold uppercase text-xs tracking-widest mt-1">Free Fire • Torneios & Scrims</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
                <button 
                    onClick={() => downloadDivAsImage('bracket-area', 'chaveamento')} 
                    className="bg-graphite-900 hover:bg-graphite-700 text-white px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-white/10"
                >
                    <ImageIcon size={18}/> Baixar Imagem / Print
                </button>
            </div>
        </div>

        {/* --- CONFIGURATION FORM --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-graphite-800 border border-white/5 p-6 rounded-3xl space-y-6 shadow-2xl">
                <div className="flex items-center gap-2 text-loud-500 font-black text-sm uppercase italic">
                    <Settings size={18}/> Configurações Gerais
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-premium-muted uppercase tracking-widest mb-1 block">Nome do Torneio</label>
                        <input 
                            type="text" 
                            value={data.name} 
                            onChange={e => setData(prev => ({...prev, name: e.target.value.toUpperCase()}))}
                            className="w-full bg-graphite-900 border border-white/10 rounded-xl p-3 text-white focus:border-loud-500 outline-none font-bold"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-premium-muted uppercase tracking-widest mb-1 block">Times</label>
                            <select 
                                value={data.teamsCount} 
                                onChange={e => setData(prev => ({...prev, teamsCount: parseInt(e.target.value), matches: []}))}
                                className="w-full bg-graphite-900 border border-white/10 rounded-xl p-3 text-white focus:border-loud-500 outline-none font-bold"
                            >
                                <option value={2}>2 Times</option>
                                <option value={4}>4 Times</option>
                                <option value={8}>8 Times</option>
                                <option value={16}>16 Times</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-premium-muted uppercase tracking-widest mb-1 block">Formato</label>
                            <select 
                                value={data.format}
                                onChange={e => setData(prev => ({...prev, format: e.target.value as any}))}
                                className="w-full bg-graphite-900 border border-white/10 rounded-xl p-3 text-white focus:border-loud-500 outline-none font-bold"
                            >
                                <option value="single">Elim. Simples</option>
                                <option value="double">Elim. Dupla</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-premium-muted uppercase tracking-widest mb-1 block">Série (Melhor de X)</label>
                        <div className="flex gap-2">
                            {['MD1', 'MD3', 'MD5', 'MD7'].map(md => (
                                <button 
                                    key={md} 
                                    onClick={() => setData(prev => ({...prev, seriesFormat: md as any}))}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${data.seriesFormat === md ? 'bg-loud-500 text-graphite-900' : 'bg-graphite-900 text-premium-muted border border-white/5 hover:border-white/10'}`}
                                >
                                    {md}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-graphite-800 border border-white/5 p-6 rounded-3xl space-y-6 lg:col-span-2 shadow-2xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-loud-500 font-black text-sm uppercase italic">
                        <Users size={18}/> Times ({data.teams.length}/{data.teamsCount})
                    </div>
                    {data.teams.length === data.teamsCount && (
                        <button 
                            onClick={handleCreateBracket} 
                            className="bg-loud-500 hover:bg-loud-600 text-graphite-900 px-6 py-2 rounded-xl text-xs font-black uppercase transition-all shadow-lg shadow-loud-500/20 flex items-center gap-2"
                        >
                            <Sword size={16}/> Gerar Confrontos
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="NOME DO TIME (Ex: LOUD, NOISE, LOUD ACADEMY)..." 
                                value={newTeamName}
                                onChange={e => setNewTeamName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addTeam()}
                                className="flex-1 bg-graphite-900 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-loud-500 outline-none font-bold uppercase"
                            />
                            <button 
                                onClick={() => addTeam()} 
                                className="bg-loud-500 hover:bg-loud-600 text-graphite-950 p-3 rounded-xl transition-all font-black text-xs uppercase flex items-center gap-1 cursor-pointer shadow-md"
                                title="Adicionar time"
                            >
                                <Plus size={18}/>
                            </button>
                        </div>

                        {/* Quick Add Preset Teams Pills */}
                        <div className="space-y-1.5">
                            <span className="text-[10px] text-premium-muted font-bold uppercase tracking-wider block">
                                Adicionar Rápido da Galeria de Logos:
                            </span>
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar p-1 bg-graphite-900/60 rounded-xl border border-white/5">
                                {allLogos.slice(0, 14).map((logoItem) => {
                                    const alreadyAdded = data.teams.some(t => t.name.toUpperCase() === logoItem.name.toUpperCase());
                                    return (
                                        <button
                                            key={logoItem.id}
                                            type="button"
                                            disabled={alreadyAdded || data.teams.length >= data.teamsCount}
                                            onClick={() => addTeam(logoItem.name, logoItem.imageUrl)}
                                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                                                alreadyAdded 
                                                    ? 'bg-white/5 text-gray-500 opacity-50 cursor-not-allowed'
                                                    : 'bg-graphite-800 hover:bg-loud-500 hover:text-graphite-950 text-gray-300 border border-white/5 cursor-pointer'
                                            }`}
                                        >
                                            <img src={logoItem.imageUrl} alt="" className="w-3.5 h-3.5 object-contain" referrerPolicy="no-referrer" />
                                            <span>{logoItem.name.split(' ')[0]}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <p className="text-[10px] text-premium-muted italic uppercase">O escudo oficial é associado automaticamente pelo padrão de logos.</p>
                    </div>

                    <div className="bg-graphite-900 border border-white/5 rounded-2xl p-4 max-h-56 overflow-y-auto custom-scrollbar">
                        {data.teams.length === 0 ? (
                            <div className="text-center py-10 text-premium-muted text-xs font-bold uppercase">Nenhum time cadastrado.</div>
                        ) : (
                            <div className="space-y-2">
                                {data.teams.map((t, i) => (
                                    <div key={t.id} className="flex items-center justify-between bg-graphite-800 border border-white/5 p-2 px-3 rounded-xl group">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="text-[10px] font-black text-loud-500 shrink-0">#{i+1}</span>
                                            <div className="w-6 h-6 rounded-md bg-graphite-900 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                                {t.logo ? (
                                                    <img src={t.logo} alt={t.name} className="w-full h-full object-contain p-0.5" referrerPolicy="no-referrer" />
                                                ) : (
                                                    <span className="text-[10px] font-bold text-gray-400">{t.name.charAt(0)}</span>
                                                )}
                                            </div>
                                            <span className="text-xs font-bold text-gray-200 truncate uppercase">{t.name}</span>
                                        </div>
                                        <button onClick={() => removeTeam(t.id)} className="text-premium-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1 cursor-pointer">
                                            <Trash2 size={14}/>
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
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-2 text-loud-500 font-black text-sm uppercase italic px-4">
                    <Sword size={18}/> Chaveamento do Torneio
                </div>
                
                <div className="overflow-x-auto pb-10 custom-scrollbar">
                    <div id="bracket-area" className="flex gap-20 p-10 min-w-max justify-center bg-graphite-800 rounded-[3rem] border border-white/5 shadow-2xl">
                        {Array.from({ length: totalRounds }).map((_, rIdx) => {
                            const roundNum = rIdx + 1;
                            const roundMatches = getRoundMatches(roundNum);
                            const isFinal = roundNum === totalRounds;

                            return (
                                <div key={roundNum} className="flex flex-col gap-12 items-center">
                                    <h3 className="bg-graphite-900 border border-white/10 px-6 py-2 rounded-full text-[10px] font-black text-loud-500 tracking-[0.3em] uppercase italic">
                                        {isFinal ? 'Grande Final' : `Round ${roundNum}`}
                                    </h3>
                                    
                                    <div className="flex flex-col justify-around flex-1 gap-16 py-10">
                                        {roundMatches.map((m, mIdx) => {
                                            const teamA = data.teams.find(t => t.id === m.teamAId);
                                            const teamB = data.teams.find(t => t.id === m.teamBId);

                                            return (
                                                <div key={m.id} className="relative group">
                                                    <div className="bg-graphite-900 border-2 border-white/5 rounded-3xl w-72 overflow-hidden shadow-2xl transition-all group-hover:border-loud-500/50">
                                                        <div className={`p-4 flex items-center justify-between border-b border-white/5 transition-all ${m.winnerId === m.teamAId ? 'bg-loud-500/10' : ''}`}>
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className="w-8 h-8 rounded-lg bg-graphite-800 border border-white/5 flex items-center justify-center font-black text-xs text-loud-500 overflow-hidden shrink-0">
                                                                    {teamA?.logo ? (
                                                                        <img src={teamA.logo} alt={teamA.name} className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                                                                    ) : (
                                                                        teamA?.name.charAt(0) || '?'
                                                                    )}
                                                                </div>
                                                                <span className={`text-sm font-black truncate uppercase italic ${teamA ? 'text-gray-100' : 'text-premium-muted'}`}>
                                                                    {teamA?.name || 'Aguardando'}
                                                                </span>
                                                            </div>
                                                            <input 
                                                                type="number" 
                                                                value={m.scoreA} 
                                                                onChange={e => updateScore(m.id, 'A', parseInt(e.target.value) || 0)}
                                                                className="w-10 bg-graphite-800 border border-white/10 rounded p-1 text-center font-black text-loud-500 outline-none"
                                                            />
                                                            <button 
                                                                onClick={() => setWinner(m.id, m.teamAId)}
                                                                className={`ml-2 p-1.5 rounded-lg transition-all ${m.winnerId === m.teamAId ? 'text-loud-500 bg-loud-500/10' : 'text-premium-muted hover:text-white'}`}
                                                            >
                                                                <CheckCircle size={18}/>
                                                            </button>
                                                        </div>

                                                        <div className={`p-4 flex items-center justify-between transition-all ${m.winnerId === m.teamBId ? 'bg-loud-500/10' : ''}`}>
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className="w-8 h-8 rounded-lg bg-graphite-800 border border-white/5 flex items-center justify-center font-black text-xs text-loud-500 overflow-hidden shrink-0">
                                                                    {teamB?.logo ? (
                                                                        <img src={teamB.logo} alt={teamB.name} className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                                                                    ) : (
                                                                        teamB?.name.charAt(0) || '?'
                                                                    )}
                                                                </div>
                                                                <span className={`text-sm font-black truncate uppercase italic ${teamB ? 'text-gray-100' : 'text-premium-muted'}`}>
                                                                    {teamB?.name || 'Aguardando'}
                                                                </span>
                                                            </div>
                                                            <input 
                                                                type="number" 
                                                                value={m.scoreB} 
                                                                onChange={e => updateScore(m.id, 'B', parseInt(e.target.value) || 0)}
                                                                className="w-10 bg-graphite-800 border border-white/10 rounded p-1 text-center font-black text-loud-500 outline-none"
                                                            />
                                                            <button 
                                                                onClick={() => setWinner(m.id, m.teamBId)}
                                                                className={`ml-2 p-1.5 rounded-lg transition-all ${m.winnerId === m.teamBId ? 'text-loud-500 bg-loud-500/10' : 'text-premium-muted hover:text-white'}`}
                                                            >
                                                                <CheckCircle size={18}/>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {!isFinal && (
                                                        <div className="absolute top-1/2 -right-20 w-20 flex items-center pointer-events-none">
                                                            <div className="h-px bg-graphite-700 flex-1"></div>
                                                            <div className={`w-px bg-graphite-700 ${mIdx % 2 === 0 ? 'h-32 translate-y-16' : 'h-32 -translate-y-16'}`}></div>
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
