import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/FirebaseProvider';
import { 
  Search, UserPlus, Trash2, Clock, Calendar, Shield, Users, Crosshair, Filter, 
  Instagram, Edit2, Trophy, History, Swords, ExternalLink, X, Camera, Upload, 
  User, Eye, Sparkles, Check, Share2, Hammer
} from 'lucide-react';
import { CustomLineBuilder } from '../components/CustomLineBuilder';

interface LFTPlayer {
  id: string;
  name: string;
  role: string;
  age: number;
  availability: string;
  photoUrl?: string;
  instagram?: string;
  achievements?: string;
  teamsHistory?: string;
  tournamentsHistory?: string;
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
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'players' | 'builder' | 'suggestions'>('players');

  // Selected player for Modal Detail view
  const [selectedPlayer, setSelectedPlayer] = useState<LFTPlayer | null>(null);
  const [copiedInsta, setCopiedInsta] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('TODAS');

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('RUSH');
  const [age, setAge] = useState('');
  const [availability, setAvailability] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [instagram, setInstagram] = useState('');
  const [achievements, setAchievements] = useState('');
  const [teamsHistory, setTeamsHistory] = useState('');
  const [tournamentsHistory, setTournamentsHistory] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ROLES = ['RUSH', 'SUPORTE', 'GRANADEIRO', 'CAPITÃO (IGL)', 'COACH', 'ANALISTA', 'MISTER'];

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 350;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const compressed = await compressImage(e.target.files[0]);
        setPhotoUrl(compressed);
      } catch (err) {
        console.error('Error compressing photo:', err);
        alert('Erro ao carregar a imagem. Tente uma foto menor ou em formato JPG/PNG.');
      }
    }
  };

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

  const resetForm = () => {
    setName('');
    setRole('RUSH');
    setAge('');
    setAvailability('');
    setPhotoUrl('');
    setInstagram('');
    setAchievements('');
    setTeamsHistory('');
    setTournamentsHistory('');
    setEditingPlayerId(null);
  };

  const handleStartEdit = (player: LFTPlayer) => {
    setEditingPlayerId(player.id);
    setName(player.name || '');
    setRole(player.role || 'RUSH');
    setAge(player.age ? String(player.age) : '');
    setAvailability(player.availability || '');
    setPhotoUrl(player.photoUrl || '');
    setInstagram(player.instagram || '');
    setAchievements(player.achievements || '');
    setTeamsHistory(player.teamsHistory || '');
    setTournamentsHistory(player.tournamentsHistory || '');
    setShowForm(true);
    setSelectedPlayer(null);
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      login();
      return;
    }

    if (!name.trim() || !role || !age || !availability.trim()) {
      alert('Por favor, preencha os campos obrigatórios (Nick, Função, Idade e Disponibilidade).');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        role,
        age: parseInt(age, 10),
        availability: availability.trim(),
        photoUrl: photoUrl.trim(),
        instagram: instagram.trim(),
        achievements: achievements.trim(),
        teamsHistory: teamsHistory.trim(),
        tournamentsHistory: tournamentsHistory.trim(),
      };

      if (editingPlayerId) {
        await updateDoc(doc(db, 'lft_players', editingPlayerId), {
          ...payload,
          updatedAt: Date.now(),
        });
      } else {
        await addDoc(collection(db, 'lft_players'), {
          ...payload,
          createdAt: Date.now(),
          userId: user.uid,
        });
      }

      setShowForm(false);
      resetForm();
      fetchPlayers();
    } catch (error) {
      handleFirestoreError(
        error, 
        editingPlayerId ? OperationType.UPDATE : OperationType.CREATE, 
        editingPlayerId ? `lft_players/${editingPlayerId}` : 'lft_players', 
        { user }
      );
      alert('Erro ao salvar anúncio. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja realmente remover seu anúncio?')) return;
    
    try {
      await deleteDoc(doc(db, 'lft_players', id));
      if (selectedPlayer?.id === id) {
        setSelectedPlayer(null);
      }
      fetchPlayers();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `lft_players/${id}`, { user });
      alert('Erro ao deletar anúncio.');
    }
  };

  // Helper to format instagram handle or link
  const getInstagramUrl = (insta: string) => {
    if (!insta) return '';
    const clean = insta.trim();
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      return clean;
    }
    const username = clean.replace(/^@/, '');
    return `https://instagram.com/${username}`;
  };

  const getInstagramHandle = (insta: string) => {
    if (!insta) return '';
    const clean = insta.trim();
    if (clean.includes('instagram.com/')) {
      const parts = clean.split('instagram.com/');
      const handle = parts[1]?.split('/')[0]?.split('?')[0];
      return handle ? `@${handle}` : clean;
    }
    return clean.startsWith('@') ? clean : `@${clean}`;
  };

  const handleCopyInstagram = (insta: string) => {
    const handle = getInstagramHandle(insta);
    navigator.clipboard.writeText(handle);
    setCopiedInsta(true);
    setTimeout(() => setCopiedInsta(false), 2000);
  };

  // Filtered players list
  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            player.availability.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (player.instagram && player.instagram.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (player.teamsHistory && player.teamsHistory.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (player.achievements && player.achievements.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesRole = roleFilter === 'TODAS' || player.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [players, searchTerm, roleFilter]);

  // Algorithm to suggest balanced lines
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
    <div className="min-h-screen bg-graphite-900 text-premium-text p-6 relative">
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        
        {/* Header */}
        <div className="text-center space-y-4 pt-10 pb-6 border-b border-white/5">
          <h1 className="text-4xl md:text-5xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-loud-500 to-white font-display tracking-tight">
            Encontrar Line
          </h1>
          <p className="text-premium-muted max-w-2xl mx-auto">
            Procure por parceiros ou crie/edite seu anúncio de jogador com histórico, conquistas e redes sociais para formar lines no Free Fire. Clique no card de qualquer jogador para ver o perfil completo!
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
              onClick={() => {
                if (showForm) {
                  setShowForm(false);
                  resetForm();
                } else {
                  setShowForm(true);
                }
              }}
              className="mt-6 bg-graphite-800 hover:bg-graphite-700 text-white px-8 py-3 rounded-xl font-bold transition-all inline-flex items-center gap-2 border border-loud-500/30"
            >
              {showForm ? 'Ocultar Formulário' : (editingPlayerId ? 'Editando meu Anúncio' : 'Quero me anunciar')}
            </button>
          )}
        </div>

        {/* Announce / Edit Form */}
        {showForm && user && (
          <form onSubmit={handleSubmit} className="bg-graphite-800 p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl max-w-2xl mx-auto relative">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
              <h2 className="text-2xl font-bold text-white uppercase font-display">
                {editingPlayerId ? 'Editar Anúncio de Player' : 'Criar Anúncio de Player'}
              </h2>
              {editingPlayerId && (
                <button 
                  type="button" 
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="text-premium-muted hover:text-white p-1 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            
            <div className="space-y-5">
              {/* Photo Upload Section */}
              <div className="bg-graphite-900/60 p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 rounded-full bg-graphite-800 border-2 border-loud-500/50 flex items-center justify-center overflow-hidden shadow-lg">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={36} className="text-loud-500/70" />
                    )}
                  </div>
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                    title="Alterar foto"
                  >
                    <Camera size={20} />
                  </button>
                </div>

                <div className="flex-1 w-full space-y-2 text-center sm:text-left">
                  <label className="block text-xs font-bold text-premium-muted uppercase">Foto de Perfil / Avatar</label>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handlePhotoUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-graphite-800 hover:bg-graphite-700 text-white border border-white/10 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Upload size={14} className="text-loud-500" />
                      Escolher Foto do Dispositivo
                    </button>
                    {photoUrl && (
                      <button 
                        type="button" 
                        onClick={() => setPhotoUrl('')}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      >
                        Remover Foto
                      </button>
                    )}
                  </div>
                  <input 
                    type="text" 
                    value={photoUrl} 
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="Ou cole o Link de uma Imagem (https://...)" 
                    className="w-full bg-graphite-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-premium-muted/50 outline-none focus:border-loud-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-premium-muted uppercase mb-2">Nome ou Nick *</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nick no jogo"
                    maxLength={100}
                    required
                    className="w-full bg-graphite-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-loud-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-premium-muted uppercase mb-2">Instagram (@ ou link)</label>
                  <div className="relative">
                    <Instagram size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-500" />
                    <input 
                      type="text" 
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="@seu_instagram"
                      maxLength={200}
                      className="w-full bg-graphite-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-loud-500 outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-premium-muted uppercase mb-2">Função Principal *</label>
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-graphite-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-loud-500 outline-none transition-colors appearance-none"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-premium-muted uppercase mb-2">Idade *</label>
                  <input 
                    type="number" 
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Ex: 18"
                    min="1"
                    max="99"
                    required
                    className="w-full bg-graphite-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-loud-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-premium-muted uppercase mb-2">Disponibilidade de Horário *</label>
                <input 
                  type="text" 
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  placeholder="Ex: Todos os dias das 19h às 23h"
                  maxLength={200}
                  required
                  className="w-full bg-graphite-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-loud-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-premium-muted uppercase mb-2">Conquistas e Títulos</label>
                <textarea 
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  placeholder="Ex: Top 1 Diário LOUD, Campeão X1 dos Crias, MVP NFA Amadores..."
                  rows={2}
                  maxLength={1000}
                  className="w-full bg-graphite-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-loud-500 outline-none transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-premium-muted uppercase mb-2">Histórico de Times</label>
                  <textarea 
                    value={teamsHistory}
                    onChange={(e) => setTeamsHistory(e.target.value)}
                    placeholder="Ex: LOUD Academy, Fluxo, PaiN Gaming..."
                    rows={2}
                    maxLength={1000}
                    className="w-full bg-graphite-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-loud-500 outline-none transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-premium-muted uppercase mb-2">Campeonatos Disputados</label>
                  <textarea 
                    value={tournamentsHistory}
                    onChange={(e) => setTournamentsHistory(e.target.value)}
                    placeholder="Ex: LBFF Classificatória, NFA Season 6, CPN..."
                    rows={2}
                    maxLength={1000}
                    className="w-full bg-graphite-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-loud-500 outline-none transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-loud-500 hover:bg-loud-600 text-graphite-900 font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  {isSubmitting ? 'Salvando...' : (editingPlayerId ? 'Salvar Alterações' : 'Publicar Anúncio')}
                </button>
                {editingPlayerId && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="px-6 bg-graphite-900 hover:bg-graphite-700 text-white font-bold py-4 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </form>
        )}

        {/* Tab Controls & Filters */}
        <div className="pt-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => setActiveTab('players')}
                className={`px-5 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'players' ? 'bg-loud-500 text-graphite-900 shadow-[0_0_15px_rgba(58,255,0,0.15)]' : 'bg-graphite-800 text-white hover:bg-graphite-700'}`}
              >
                <Users size={18} />
                Jogadores ({players.length})
              </button>
              <button 
                onClick={() => setActiveTab('builder')}
                className={`px-5 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'builder' ? 'bg-loud-500 text-graphite-900 shadow-[0_0_15px_rgba(58,255,0,0.2)]' : 'bg-graphite-800 text-white hover:bg-graphite-700'}`}
              >
                <Swords size={18} />
                Montar Minha Line
              </button>
              <button 
                onClick={() => setActiveTab('suggestions')}
                className={`px-5 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'suggestions' ? 'bg-loud-500 text-graphite-900 shadow-[0_0_15px_rgba(58,255,0,0.15)]' : 'bg-graphite-800 text-white hover:bg-graphite-700'}`}
              >
                <Crosshair size={18} />
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
                    placeholder="Buscar por nick, time, histórico..."
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
          ) : activeTab === 'builder' ? (
            <CustomLineBuilder 
              availablePlayers={players} 
              onViewPlayerDetails={setSelectedPlayer} 
            />
          ) : activeTab === 'players' ? (
            filteredPlayers.length === 0 ? (
              <div className="bg-graphite-800 border border-white/5 rounded-3xl p-12 text-center">
                <p className="text-premium-muted">Nenhum jogador encontrado com os filtros aplicados.</p>
                <p className="text-sm mt-2 opacity-60">Seja o primeiro a anunciar!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlayers.map((player) => (
                  <div 
                    key={player.id} 
                    onClick={() => setSelectedPlayer(player)}
                    className="bg-graphite-800 rounded-2xl p-6 border border-white/5 hover:border-loud-500/50 transition-all flex flex-col group relative overflow-hidden cursor-pointer hover:shadow-[0_0_20px_rgba(58,255,0,0.08)]"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Shield size={64} />
                    </div>
                    
                    <div className="flex justify-between items-start mb-4 relative z-10 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-14 rounded-full bg-graphite-900 border-2 border-loud-500/40 shrink-0 overflow-hidden flex items-center justify-center shadow-md">
                          {player.photoUrl ? (
                            <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                          ) : (
                            <User size={26} className="text-loud-500/70" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xl font-bold text-white uppercase truncate group-hover:text-loud-500 transition-colors" title={player.name}>{player.name}</h3>
                          <span className="inline-block bg-graphite-900 text-loud-500 border border-loud-500/20 px-3 py-0.5 rounded-full text-xs font-bold mt-1 uppercase tracking-wide">
                            {player.role}
                          </span>
                        </div>
                      </div>
                      
                      {user && user.uid === player.userId && (
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => handleStartEdit(player)}
                            className="text-loud-500 hover:bg-loud-500/10 p-2 rounded-lg transition-colors"
                            title="Editar anúncio"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(player.id)}
                            className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                            title="Remover anúncio"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-3 flex-1 relative z-10 mt-2 text-sm text-premium-muted">
                      <div className="flex items-center gap-3">
                        <Calendar size={16} className="text-white/40" />
                        <span><strong className="text-white">Idade:</strong> {player.age} anos</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Clock size={16} className="text-white/40 mt-0.5 shrink-0" />
                        <span><strong className="text-white block sm:inline">Disponibilidade:</strong> <br className="sm:hidden" />{player.availability}</span>
                      </div>

                      {/* Instagram link */}
                      {player.instagram && (
                        <div className="flex items-center gap-3 pt-1" onClick={(e) => e.stopPropagation()}>
                          <Instagram size={16} className="text-pink-500 shrink-0" />
                          <a 
                            href={getInstagramUrl(player.instagram)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-pink-400 hover:text-pink-300 hover:underline flex items-center gap-1 font-medium truncate"
                          >
                            {getInstagramHandle(player.instagram)}
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      )}

                      {/* Snippet preview of achievements or history */}
                      {(player.achievements || player.teamsHistory || player.tournamentsHistory) && (
                        <div className="pt-2 border-t border-white/5 space-y-2">
                          {player.achievements && (
                            <div className="flex items-center gap-1.5 text-xs text-amber-400 truncate">
                              <Trophy size={13} className="shrink-0" />
                              <span className="truncate">{player.achievements}</span>
                            </div>
                          )}
                          {player.teamsHistory && (
                            <div className="flex items-center gap-1.5 text-xs text-blue-400 truncate">
                              <History size={13} className="shrink-0" />
                              <span className="truncate">{player.teamsHistory}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-xs text-premium-muted/60 relative z-10">
                      <span>Anunciado em {new Date(player.createdAt).toLocaleDateString()}</span>
                      <span className="text-loud-500 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Ver perfil completo <Eye size={12} />
                      </span>
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
                        <div 
                          key={member.id} 
                          onClick={() => setSelectedPlayer(member)}
                          className="bg-graphite-900 p-4 rounded-2xl border border-white/5 hover:border-loud-500/40 transition-all flex flex-col items-center text-center cursor-pointer group"
                        >
                          <div className="w-14 h-14 bg-graphite-800 rounded-full border-2 border-loud-500/40 flex items-center justify-center mb-3 text-loud-500 overflow-hidden shadow-md group-hover:scale-105 transition-transform">
                            {member.photoUrl ? (
                              <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                              <User size={26} className="text-loud-500/70" />
                            )}
                          </div>
                          <span className="font-bold text-white mb-1 uppercase w-full truncate group-hover:text-loud-500 transition-colors" title={member.name}>{member.name}</span>
                          <span className="text-xs font-bold text-loud-500 bg-loud-500/10 px-2 py-1 rounded mb-2 uppercase tracking-wider">{member.role}</span>
                          
                          {member.instagram && (
                            <a 
                              href={getInstagramUrl(member.instagram)} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-pink-400 hover:text-pink-300 hover:underline mb-2 flex items-center gap-1"
                            >
                              <Instagram size={12} />
                              <span>{getInstagramHandle(member.instagram)}</span>
                            </a>
                          )}

                          <div className="text-xs text-premium-muted space-y-1 w-full text-left bg-graphite-800/50 p-2.5 rounded-lg font-mono">
                            <div className="truncate" title={member.availability}>⏱ {member.availability}</div>
                            <div>🎂 {member.age} anos</div>
                            {member.teamsHistory && (
                              <div className="truncate text-blue-400/90" title={member.teamsHistory}>🛡 {member.teamsHistory}</div>
                            )}
                          </div>

                          <div className="mt-3 text-[10px] font-bold text-loud-500 flex items-center gap-1">
                            <Eye size={12} /> Ver perfil
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

      {/* FULL PLAYER PROFILE MODAL */}
      {selectedPlayer && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedPlayer(null)}
        >
          <div 
            className="bg-graphite-800 border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Cover */}
            <div className="bg-gradient-to-r from-loud-500/20 via-graphite-900 to-graphite-800 p-6 md:p-8 border-b border-white/10 relative">
              <button 
                onClick={() => setSelectedPlayer(null)}
                className="absolute top-4 right-4 bg-graphite-900/80 hover:bg-graphite-900 text-white p-2 rounded-full border border-white/10 transition-colors z-20"
                title="Fechar"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-graphite-900 border-4 border-loud-500 shadow-xl overflow-hidden shrink-0 flex items-center justify-center">
                  {selectedPlayer.photoUrl ? (
                    <img src={selectedPlayer.photoUrl} alt={selectedPlayer.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={48} className="text-loud-500/80" />
                  )}
                </div>

                <div className="text-center sm:text-left space-y-2 flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-3xl font-black text-white uppercase font-display">{selectedPlayer.name}</h2>
                    <span className="bg-loud-500 text-graphite-900 font-extrabold px-3 py-1 rounded-full text-xs uppercase tracking-wider">
                      {selectedPlayer.role}
                    </span>
                  </div>

                  <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-premium-muted">
                    <span className="flex items-center gap-1.5"><Calendar size={16} className="text-loud-500" /> {selectedPlayer.age} anos</span>
                    <span className="flex items-center gap-1.5"><Clock size={16} className="text-loud-500" /> {selectedPlayer.availability}</span>
                  </div>

                  {selectedPlayer.instagram && (
                    <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                      <a 
                        href={getInstagramUrl(selectedPlayer.instagram)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/30 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
                      >
                        <Instagram size={16} />
                        {getInstagramHandle(selectedPlayer.instagram)}
                        <ExternalLink size={12} />
                      </a>

                      <button 
                        onClick={() => handleCopyInstagram(selectedPlayer.instagram!)}
                        className="bg-graphite-900 hover:bg-graphite-700 text-white border border-white/10 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        {copiedInsta ? <Check size={14} className="text-loud-500" /> : <Share2 size={14} />}
                        {copiedInsta ? 'Copiado!' : 'Copiar @'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Body - Detailed Cards */}
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
              
              {/* Conquistas */}
              {selectedPlayer.achievements ? (
                <div className="bg-graphite-900 p-5 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-amber-400 uppercase tracking-wider">
                    <Trophy size={18} />
                    Conquistas e Títulos
                  </div>
                  <p className="text-sm text-white/90 whitespace-pre-line leading-relaxed font-sans">
                    {selectedPlayer.achievements}
                  </p>
                </div>
              ) : (
                <div className="bg-graphite-900/40 p-4 rounded-2xl border border-white/5 text-xs text-premium-muted italic">
                  Nenhuma conquista informada.
                </div>
              )}

              {/* Histórico de Times */}
              {selectedPlayer.teamsHistory ? (
                <div className="bg-graphite-900 p-5 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-blue-400 uppercase tracking-wider">
                    <History size={18} />
                    Histórico de Times Passados
                  </div>
                  <p className="text-sm text-white/90 whitespace-pre-line leading-relaxed font-sans">
                    {selectedPlayer.teamsHistory}
                  </p>
                </div>
              ) : (
                <div className="bg-graphite-900/40 p-4 rounded-2xl border border-white/5 text-xs text-premium-muted italic">
                  Nenhum histórico de time informado.
                </div>
              )}

              {/* Campeonatos Disputados */}
              {selectedPlayer.tournamentsHistory ? (
                <div className="bg-graphite-900 p-5 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-purple-400 uppercase tracking-wider">
                    <Swords size={18} />
                    Campeonatos Disputados
                  </div>
                  <p className="text-sm text-white/90 whitespace-pre-line leading-relaxed font-sans">
                    {selectedPlayer.tournamentsHistory}
                  </p>
                </div>
              ) : (
                <div className="bg-graphite-900/40 p-4 rounded-2xl border border-white/5 text-xs text-premium-muted italic">
                  Nenhum campeonato informado.
                </div>
              )}

              <div className="pt-2 text-xs text-premium-muted/50 font-mono text-center">
                Anúncio publicado em {new Date(selectedPlayer.createdAt).toLocaleString()}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-graphite-900/90 p-4 px-6 md:px-8 border-t border-white/10 flex flex-wrap justify-between items-center gap-3">
              {user && user.uid === selectedPlayer.userId ? (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => handleStartEdit(selectedPlayer)}
                    className="flex-1 sm:flex-initial bg-loud-500 hover:bg-loud-600 text-graphite-900 font-bold px-5 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    <Edit2 size={16} /> Editar meu anúncio
                  </button>
                  <button 
                    onClick={() => handleDelete(selectedPlayer.id)}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold px-4 py-2.5 rounded-xl text-sm flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Trash2 size={16} /> Excluir
                  </button>
                </div>
              ) : selectedPlayer.instagram ? (
                <a 
                  href={getInstagramUrl(selectedPlayer.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto bg-pink-600 hover:bg-pink-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg"
                >
                  <Instagram size={18} /> Chamar no Instagram
                </a>
              ) : (
                <span className="text-xs text-premium-muted italic">Jogador sem rede social informada</span>
              )}

              <button 
                onClick={() => setSelectedPlayer(null)}
                className="w-full sm:w-auto bg-graphite-800 hover:bg-graphite-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm border border-white/10 transition-colors"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
