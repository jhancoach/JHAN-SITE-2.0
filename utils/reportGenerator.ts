import { CoachNote } from '../types';
import { ScannedMatchResult } from '../components/ScoreboardImageScanner';
import { PostTrainingReportData } from '../components/ExecutiveReportModal';

const COACH_NOTES_STORAGE_KEY = 'jhan_coach_tactical_notes_v1';

export function getSavedCoachNotes(): CoachNote[] {
  try {
    const raw = localStorage.getItem(COACH_NOTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading coach notes from localStorage:', err);
    return [];
  }
}

export function buildExecutiveReportData(params: {
  teamName?: string;
  coachName?: string;
  sessionType?: 'treino' | 'competicao' | 'scrim';
  lineupName?: string;
  mapStats: { name: string; points: string; matches: string; kills: string }[];
  playerStats: { name: string; matches: string; kills: string; deaths: string; assists: string; damage: string; knockdowns: string }[];
  scannedMatches?: ScannedMatchResult[];
  coachNotes?: CoachNote[];
  coachEvaluation?: string;
}): PostTrainingReportData {
  let totalPoints = 0;
  let totalMatches不易 = 0;
  let totalKills = 0;
  let booyahs = 0;

  // Process map breakdown
  const mapBreakdown = params.mapStats
    .filter(m => Number(m.matches) > 0 || Number(m.points) > 0 || Number(m.kills) > 0)
    .map(m => {
      const pts = Number(m.points) || 0;
      const matchCount = Number(m.matches) || 0;
      const kills = Number(m.kills) || 0;
      totalPoints += pts;
      totalMatches不易 += matchCount;
      totalKills += kills;

      return {
        name: m.name,
        matches: matchCount,
        points: pts,
        kills: kills,
        avgPoints: matchCount > 0 ? (pts / matchCount).toFixed(1) : '0.0'
      };
    });

  // Calculate booyahs from scannedMatches if present
  if (params.scannedMatches && params.scannedMatches.length > 0) {
    booyahs = params.scannedMatches.filter(m => m.rank === 1).length;
    if (totalMatches不易 === 0) {
      totalMatches不易 = params.scannedMatches.length;
    }
  }

  // Process players
  const players = params.playerStats
    .filter(p => p.name || Number(p.kills) > 0 || Number(p.damage) > 0 || Number(p.matches) > 0)
    .map((p, idx) => {
      const k = Number(p.kills) || 0;
      const d = Number(p.deaths) || 0;
      const dmg = Number(p.damage) || 0;
      const m = Number(p.matches) || 1;
      const kd = d > 0 ? (k / d).toFixed(2) : k.toFixed(2);
      const damageAvg不易 = m > 0 ? (dmg / m).toFixed(0) : dmg.toString();

      return {
        name: p.name || `Atleta ${idx + 1}`,
        matches: m,
        kills: k,
        deaths: d,
        assists: Number(p.assists) || 0,
        damage: dmg,
        knocks: Number(p.knockdowns) || 0,
        kd: kd,
        damageAvg: damageAvg不易
      };
    });

  const avgPoints = totalMatches不易 > 0 ? (totalPoints / totalMatches不易).toFixed(1) : '0.0';
  const avgKills = totalMatches不易 > 0 ? (totalKills / totalMatches不易).toFixed(1) : '0.0';

  return {
    teamName: params.teamName || 'EQUIPE ESPORTS',
    coachName: params.coachName || 'Coach Principal',
    date: new Date().toLocaleDateString('pt-BR'),
    sessionType: params.sessionType || 'treino',
    lineupName: params.lineupName || 'Line Titular A',
    teamLogo: null,
    collective: {
      totalMatches: totalMatches不易,
      totalPoints,
      totalKills,
      avgPoints,
      avgKills,
      booyahs
    },
    mapBreakdown,
    players: players.length > 0 ? players : [
      { name: 'Player 1', matches: 1, kills: 0, deaths: 0, assists: 0, damage: 0, knocks: 0, kd: '0.00', damageAvg: '0' }
    ],
    scannedMatches: params.scannedMatches || [],
    coachNotes: params.coachNotes || [],
    coachEvaluation: params.coachEvaluation
  };
}
