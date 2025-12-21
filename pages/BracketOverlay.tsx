import React, { useState, useEffect } from 'react';
// Fix: Added missing import for Trophy icon
import { Trophy } from 'lucide-react';

// --- TYPES ---

interface Team {
  id: string;
  name: string;
  logo: string | null;
}

interface Match {
  id: string;
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
  seriesFormat: string;
  teams: Team[];
  matches: Match[];
}

const BracketOverlay: React.FC = () => {
  const [data, setData] = useState<TournamentData | null>(null);

  const loadData = () => {
    const saved = localStorage.getItem('ff_tournament_data');
    if (saved) setData(JSON.parse(saved));
  };

  useEffect(() => {
    loadData();
    // Listen for storage changes from the creator page
    const handleStorage = (e: StorageEvent) => {
        if (e.key === 'ff_tournament_data') loadData();
    };
    window.addEventListener('storage', handleStorage);
    // Poll every 2 seconds as a fallback
    const interval = setInterval(loadData, 2000);
    
    return () => {
        window.removeEventListener('storage', handleStorage);
        clearInterval(interval);
    };
  }, []);

  if (!data || data.matches.length === 0) {
      return (
          <div className="h-screen w-screen flex items-center justify-center text-white/20 text-xs uppercase font-black tracking-widest italic">
              Aguardando configuração de chaveamento...
          </div>
      );
  }

  const totalRounds = Math.log2(data.teamsCount);
  const getRoundMatches = (round: number) => data.matches.filter(m => m.round === round);

  return (
    <div className="h-screen w-screen bg-transparent text-white font-sans overflow-hidden flex flex-col items-center justify-center p-10 select-none">
        {/* TOURNAMENT NAME BAR */}
        <div className="mb-16 bg-black/80 backdrop-blur-md px-12 py-3 rounded-full border-t-2 border-brand-500 shadow-2xl flex items-center gap-6">
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-brand-500">{data.name}</h1>
            <div className="h-6 w-px bg-gray-700"></div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{data.seriesFormat} • SINGLE ELIMINATION</span>
        </div>

        {/* BRACKET AREA */}
        <div className="flex gap-16 justify-center items-center scale-90 origin-center">
            {Array.from({ length: totalRounds }).map((_, rIdx) => {
                const roundNum = rIdx + 1;
                const roundMatches = getRoundMatches(roundNum);
                const isFinal = roundNum === totalRounds;

                return (
                    <div key={roundNum} className="flex flex-col gap-20">
                        {roundMatches.map((m, mIdx) => {
                            const teamA = data.teams.find(t => t.id === m.teamAId);
                            const teamB = data.teams.find(t => t.id === m.teamBId);

                            return (
                                <div key={m.id} className="relative">
                                    <div className="bg-black/90 border-2 border-white/10 rounded-2xl w-64 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                        {/* Team A */}
                                        <div className={`p-3 flex items-center justify-between border-b border-white/5 transition-all ${m.winnerId === m.teamAId ? 'bg-brand-500/20' : ''}`}>
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-7 h-7 rounded bg-brand-500 flex items-center justify-center font-black text-[10px] text-black italic">
                                                    {teamA?.name.charAt(0) || '?'}
                                                </div>
                                                <span className={`text-xs font-black truncate uppercase italic ${teamA ? 'text-white' : 'text-white/20'}`}>
                                                    {teamA?.name || '---'}
                                                </span>
                                            </div>
                                            <span className="text-sm font-black text-brand-500 italic mr-2">{m.scoreA}</span>
                                        </div>

                                        {/* Team B */}
                                        <div className={`p-3 flex items-center justify-between transition-all ${m.winnerId === m.teamBId ? 'bg-brand-500/20' : ''}`}>
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-7 h-7 rounded bg-brand-500 flex items-center justify-center font-black text-[10px] text-black italic">
                                                    {teamB?.name.charAt(0) || '?'}
                                                </div>
                                                <span className={`text-xs font-black truncate uppercase italic ${teamB ? 'text-white' : 'text-white/20'}`}>
                                                    {teamB?.name || '---'}
                                                </span>
                                            </div>
                                            <span className="text-sm font-black text-brand-500 italic mr-2">{m.scoreB}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Small round badge */}
                                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-brand-500 text-black text-[8px] font-black rounded-full flex items-center justify-center italic border-2 border-black">
                                        {m.id.split('-')[1]}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            })}
            
            {/* CHAMPION BOX */}
            <div className="flex flex-col items-center ml-10">
                <div className="w-20 h-20 rounded-full bg-brand-500 flex items-center justify-center text-black mb-4 shadow-[0_0_50px_rgba(234,179,8,0.4)] animate-pulse">
                    <Trophy size={40} />
                </div>
                <div className="bg-black/95 px-10 py-5 rounded-3xl border-2 border-brand-500 text-3xl font-black text-brand-500 uppercase italic shadow-2xl tracking-tighter">
                    {data.matches.find(m => m.round === totalRounds)?.winnerId 
                        ? data.teams.find(t => t.id === data.matches.find(m => m.round === totalRounds)?.winnerId)?.name 
                        : '?? ?? ??'}
                </div>
            </div>
        </div>

        {/* Footer info */}
        <div className="absolute bottom-10 bg-black/60 px-6 py-2 rounded-full border border-white/10 text-[10px] font-black text-white/50 tracking-widest uppercase italic">
            Visualização Live • Jhan Medeiros Analytics
        </div>
    </div>
  );
};

export default BracketOverlay;