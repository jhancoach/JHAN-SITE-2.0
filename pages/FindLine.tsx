import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/FirebaseProvider';
import { Search, UserPlus, Trash2, Clock, Calendar, Shield, Users, Crosshair, Filter } from 'lucide-react';

interface LFTPlayer {
  id: string;
  name: string;
  role: string;
  age: number;
  availability: string;
  createdAt: number;
  userId: string;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, auth: any) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.user?.uid,
      email: auth.user?.email,
      emailVerified: auth.user?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function FindLine() {
  const { user, login } = useAuth();
  const [players, setPlayers] = useState<LFTPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'players' | 'suggestions'>('players');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('TODAS');

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('RUSH');
  const [age, setAge] = useState('');
  const [availability, setAvailability] = useState('');

  const ROLES = ['RUSH', 'SUPORTE', 'GRANADEIRO', 'CAPITÃO (IGL)', 'COACH', 'ANALISTA', 'MISTER'];

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'lft_players'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedPlayers: LFTPlayer[] = [];
      querySnapshot.forEach((docSnap) => {
        fetchedPlayers.push({ id: docSnap.id, ...docSnap.data() } as LFTPlayer);
      });
      setPlayers(fetchedPlayers);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'lft_players', { user });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      login();
      return;
    }

    if (!name.trim() || !role || !age || !availability.trim()) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'lft_players'), {
        name: name.trim(),
        role,
        age: parseInt(age, 10),
        availability: availability.trim(),
        createdAt: Date.now(),
        userId: user.uid,
      });
      setShowForm(false);
      setName('');
      setAge('');
      setAvailability('');
      fetchPlayers();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'lft_players', { user });
      alert('Erro ao anunciar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja realmente remover seu anúncio?')) return;
    
    try {
      await deleteDoc(doc(db, 'lft_players', id));
      fetchPlayers();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `lft_players/${id}`, { user });
      alert('Erro ao deletar anúncio.');
    }
  };

  // Filtered players list
  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            player.availability.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'TODAS' || player.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [players, searchTerm, roleFilter]);

  // Algorithm to suggest balanced lines (2 RUSH, 1 SUPORTE, 1 CAPITÃO/GRANADEIRO or any 4 roles)
  const suggestedLines = useMemo(() => {
    const lines = [];
    const pool = [...players];
    
    const popPlayerByRole = (targetRole: string) => {
      const idx = pool.findIndex(p => p.role.toUpperCase().includes(targetRole.toUpperCase()));
      if (idx !== -1) {
        return pool.splice(idx, 1)[0];
      }
      return null;
    };

    let lineIndex = 1;
    while (pool.length >= 4) {
      const rush1 = popPlayerByRole('RUSH');
      const rush2 = popPlayerByRole('RUSH');
      const sup = popPlayerByRole('SUPORTE');
      const cap = popPlayerByRole('CAPITÃO') || popPlayerByRole('GRANADEIRO') || pool.shift();

      const squad = [rush1, rush2, sup, cap].filter(Boolean) as LFTPlayer[];

      // Fill remaining slots if any role was missing
      while (squad.length < 4 && pool.length > 0) {
        squad.push(pool.shift()!);
      }

      if (squad.length === 4) {
        lines.push({
          id: `line-${lineIndex++}`,
          members: squad
        });
      } else {
        break;
      }
    }
    return lines;
  }, [players]);

  return (
    <div className="min-h-screen bg-graphite-900 text-premium-text p-6">
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        
        {/* Header */}
        <div className="text-center space-y-4 pt-10 pb-6 border-b border-white/5">
          <h1 className="text-4xl md:text-5xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-loud-500 to-white font-display tracking-tight">
            Encontrar Line
          </h1>
          <p className="text-premium-muted max-w-2xl mx-auto">
            Procure por parceiros ou crie seu anúncio de jogador para cruzar dados e formar lines competitivas no Free Fire.
          </p>
          {!user ? (
            <button 
              onClick={() => login()}
              className="mt-6 bg-loud-500 hover:bg-loud-600 text-graphite-900 px-8 py-3 rounded-xl font-bold transition-all inline-flex items-center gap-2 shadow-[0_0_15px_rgba(58,255,0,0.2)]"
            >
              <UserPlus size={20} />
              Faça login para anunciar
            </button>
          ) : (
            <button 
              onClick={() => setShowForm(!showForm)}
              className="mt-6 bg-graphite-800 hover:bg-graphite-700 text-white px-8 py-3 rounded-xl font-bold transition-all inline-flex items-center gap-2 border border-loud-500/30"
            >
              {showForm ? 'Ocultar Formulário' : 'Quero me anunciar'}
            </button>
          )}
        </div>

        {/* Announce Form */}
        {showForm && user && (
          <form onSubmit={handleSubmit} className="bg-graphite-800 p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6 uppercase font-display border-b border-white/5 pb-4">Criar Anúncio de Player</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-premium-muted uppercase mb-2">Nome ou Nick</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nick no jogo"
                  maxLength={100}
                  className="w-full bg-graphite-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-loud-500 outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-premium-muted uppercase mb-2">Função Principal</label>
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-graphite-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-loud-500 outline-none transition-colors appearance-none"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-premium-muted uppercase mb-2">Idade</label>
                  <input 
                    type="number" 
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Ex: 18"
                    min="1"
                    max="99"
                    className="w-full bg-graphite-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-loud-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-premium-muted uppercase mb-2">Disponibilidade de Horário</label>
                <input 
                  type="text" 
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  placeholder="Ex: Todos os dias após as 19h"
                  maxLength={200}
                  className="w-full bg-graphite-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-loud-500 outline-none transition-colors"
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-loud-500 hover:bg-loud-600 text-graphite-900 font-bold py-4 rounded-xl mt-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {isSubmitting ? 'Publicando...' : 'Publicar Anúncio'}
              </button>
            </div>
          </form>
        )}

        {/* Tab Controls & Filters */}
        <div className="pt-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex gap-3">
              <button 
                onClick={() => setActiveTab('players')}
                className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'players' ? 'bg-loud-500 text-graphite-900' : 'bg-graphite-800 text-white hover:bg-graphite-700'}`}
              >
                <Users size={20} />
                Jogadores ({players.length})
              </button>
              <button 
                onClick={() => setActiveTab('suggestions')}
                className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'suggestions' ? 'bg-loud-500 text-graphite-900' : 'bg-graphite-800 text-white hover:bg-graphite-700'}`}
              >
                <Crosshair size={20} />
                Sugestões de Line ({suggestedLines.length})
              </button>
            </div>

            {activeTab === 'players' && (
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                {/* Search */}
                <div className="relative flex-1 sm:w-64">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-premium-muted" />
                  <input 
                    type="text" 
                    placeholder="Buscar por nick ou horário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-graphite-800 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-premium-muted/50 outline-none focus:border-loud-500"
                  />
                </div>
                {/* Role Filter */}
                <div className="relative">
                  <select 
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-graphite-800 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-loud-500 appearance-none pr-8 cursor-pointer"
                  >
                    <option value="TODAS">Todas as Funções</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-premium-muted pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-loud-500/20 border-t-loud-500 rounded-full animate-spin"></div>
            </div>
          ) : activeTab === 'players' ? (
            filteredPlayers.length === 0 ? (
              <div className="bg-graphite-800 border border-white/5 rounded-3xl p-12 text-center">
                <p className="text-premium-muted">Nenhum jogador encontrado com os filtros aplicados.</p>
                <p className="text-sm mt-2 opacity-60">Seja o primeiro a anunciar!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlayers.map((player) => (
                  <div key={player.id} className="bg-graphite-800 rounded-2xl p-6 border border-white/5 hover:border-loud-500/30 transition-colors flex flex-col group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Shield size={64} />
                    </div>
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div>
                        <h3 className="text-xl font-bold text-white uppercase truncate" title={player.name}>{player.name}</h3>
                        <span className="inline-block bg-graphite-900 text-loud-500 border border-loud-500/20 px-3 py-1 rounded-full text-xs font-bold mt-2 uppercase tracking-wide">
                          {player.role}
                        </span>
                      </div>
                      {user && user.uid === player.userId && (
                        <button 
                          onClick={() => handleDelete(player.id)}
                          className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                          title="Remover anúncio"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-3 flex-1 relative z-10 mt-4 text-sm text-premium-muted">
                      <div className="flex items-center gap-3">
                        <Calendar size={16} className="text-white/40" />
                        <span><strong className="text-white">Idade:</strong> {player.age} anos</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Clock size={16} className="text-white/40 mt-0.5 shrink-0" />
                        <span><strong className="text-white block sm:inline">Disponibilidade:</strong> <br className="sm:hidden" />{player.availability}</span>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-white/5 text-xs text-premium-muted/50 font-mono relative z-10">
                      Anunciado em {new Date(player.createdAt).toLocaleDateString()} às {new Date(player.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Suggestions Tab */
            suggestedLines.length === 0 ? (
              <div className="bg-graphite-800 border border-white/5 rounded-3xl p-12 text-center">
                <p className="text-premium-muted">Não há jogadores suficientes para sugerir uma line completa (mínimo de 4 jogadores no banco).</p>
              </div>
            ) : (
              <div className="space-y-8">
                {suggestedLines.map((line, idx) => (
                  <div key={line.id} className="bg-graphite-800 rounded-3xl p-6 md:p-8 border border-white/10 shadow-xl">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                      <Shield className="text-loud-500" size={28} />
                      <h3 className="text-2xl font-black uppercase text-white font-display">Sugestão de Line #{idx + 1}</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {line.members.map(member => (
                        <div key={member.id} className="bg-graphite-900 p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                          <div className="w-12 h-12 bg-graphite-800 rounded-full flex items-center justify-center mb-3 text-loud-500">
                            <UserPlus size={20} />
                          </div>
                          <span className="font-bold text-white mb-1 uppercase w-full truncate" title={member.name}>{member.name}</span>
                          <span className="text-xs font-bold text-loud-500 bg-loud-500/10 px-2 py-1 rounded mb-3 uppercase tracking-wider">{member.role}</span>
                          
                          <div className="text-xs text-premium-muted space-y-1 w-full text-left bg-graphite-800/50 p-2.5 rounded-lg font-mono">
                            <div className="truncate" title={member.availability}>⏱ {member.availability}</div>
                            <div>🎂 {member.age} anos</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
}
