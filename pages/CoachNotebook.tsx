import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Plus, Search, Filter, Pin, Trash2, Edit3, Copy, CheckSquare, 
  Square, Share2, Download, Upload, Sparkles, MapPin, ShieldAlert, 
  CheckCircle2, Clock, Cloud, CloudOff, RefreshCw, ChevronDown, ChevronRight,
  Printer, ArrowRight, ExternalLink, Flame, Bookmark, Tag, AlertTriangle, Layers
} from 'lucide-react';
import { useAuth } from '../components/FirebaseProvider';
import { db } from '../firebase';
import { 
  collection, query, where, onSnapshot, doc, setDoc, deleteDoc, 
  serverTimestamp, getDocs 
} from 'firebase/firestore';
import { CoachNote, CoachChecklistItem } from '../types';
import { TRAINING_MAP_IMAGES } from '../constants';

interface CoachNotebookProps {
  onNavigate?: (path: string) => void;
}

const MAP_OPTIONS = [
  'Todos',
  'Bermuda',
  'Purgatório',
  'Kalahari',
  'Alpine',
  'Nova Terra',
  'Solara',
  'Geral'
];

const SAFE_PHASE_OPTIONS = [
  'Todas',
  'Early Game / Drop',
  'Safe 1',
  'Safe 2',
  'Safe 3',
  'Safe 4',
  'Late Game / Endgame',
  'Geral / Mentalidade'
];

const CATEGORY_OPTIONS = [
  'Todas',
  'Call & Drop',
  'Rotação & Flanco',
  'Hold & Posicionamento',
  'Retake & Rush',
  'Análise de Rival',
  'Setup de Granada & Armas',
  'Geral'
];

const PRIORITY_OPTIONS = [
  { id: 'urgente', label: 'Urgente', color: 'bg-red-500/20 text-red-400 border-red-500/40' },
  { id: 'alta', label: 'Alta', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
  { id: 'media', label: 'Média', color: 'bg-loud-500/20 text-loud-400 border-loud-500/40' },
  { id: 'baixa', label: 'Baixa', color: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
];

const COLOR_THEMES = [
  { id: 'loud', name: 'LOUD Neon', hex: '#00ff66', border: 'border-loud-500/40', badge: 'bg-loud-500/10 text-loud-400' },
  { id: 'fire', name: 'Fogo / Rush', hex: '#ff4444', border: 'border-red-500/40', badge: 'bg-red-500/10 text-red-400' },
  { id: 'cyan', name: 'Gelo / Cyber', hex: '#00e5ff', border: 'border-cyan-500/40', badge: 'bg-cyan-500/10 text-cyan-400' },
  { id: 'gold', name: 'Ouro / Vitória', hex: '#ffc400', border: 'border-amber-500/40', badge: 'bg-amber-500/10 text-amber-400' },
  { id: 'purple', name: 'Tático / Mágico', hex: '#b388ff', border: 'border-purple-500/40', badge: 'bg-purple-500/10 text-purple-400' },
  { id: 'graphite', name: 'Grafite Pro', hex: '#888888', border: 'border-white/10', badge: 'bg-white/10 text-gray-300' },
];

const QUICK_TEMPLATES = [
  {
    title: 'Drop & Rotação Safe 1 (Dividida)',
    map: 'Bermuda',
    safeZone: 'Early Game / Drop',
    category: 'Call & Drop',
    priority: 'alta',
    color: 'loud',
    tags: ['drop', 'split', 'safe1'],
    content: `📍 **CALL DE DROP**: Observatório + Hangar (Split 2-2)
🚗 **VEÍCULO**: Garantir o carro monstro na pista do Hangar logo no primeiro minuto.
🛡️ **ROTAÇÃO**: Se a safe fechar Peak, subir pela tirolesa dos fundos às 2:20 min.
⚠️ **ATENÇÃO**: Cuidado com a line da Factory atravessando pela pista.

🎯 **POSICIONAMENTO DOS JOGADORES**:
- Player 1 (Capitão/Suporte): Observa de cima da torre do Obs.
- Player 2 & 3 (Rush): Limpam galpões rápidos de Hangar e pegam coletes 3.
- Player 4 (Flanco): Pega tirolesa e marca descida de Bimasakti.`,
    checklist: [
      { id: 'c1', text: 'Garantir mínimo 2 granadas de gelo por player', completed: false },
      { id: 'c2', text: 'Marcar se o time rival caiu em Cemitério', completed: false },
      { id: 'c3', text: 'Iniciar rotação antes dos 2:30 min de gás', completed: false },
    ]
  },
  {
    title: 'Hold Casa Forte / Brasília Centro',
    map: 'Purgatório',
    safeZone: 'Safe 3',
    category: 'Hold & Posicionamento',
    priority: 'urgente',
    color: 'gold',
    tags: ['brasília', 'casa-forte', 'hold'],
    content: `📍 **LOCAL**: Casa dos 3 andares / L central de Brasília.
💣 **DEFESA DE GRANADAS**: Manter 1 jogador no teto com arma de mira e 2 na escada com armas de curta distância (MP40 / Trogon).
🛡️ **GELOS DE BACKUP**: Bloquear a janela lateral para evitar granadas de longe da tirolesa.

⏱️ **TIMING**: Não atirar em quem estiver rotacionando de longe para não entregar a posição cedo.`,
    checklist: [
      { id: 'c1', text: 'Trancar entrada da escada com gelo invertido', completed: true },
      { id: 'c2', text: 'Capitão marcando visão da tirolesa do morro', completed: false },
    ]
  },
  {
    title: 'Análise de Equipe Rival & Contra-Estratégia',
    map: 'Geral',
    safeZone: 'Geral / Mentalidade',
    category: 'Análise de Rival',
    priority: 'media',
    color: 'purple',
    tags: ['rival', 'scout', 'estrategia'],
    content: `🔍 **EQUIPE RIVAL ANALISADA**: [Nome do Time Rival]
📍 **DROPS USUAIS**: Purgatório (Campos/Central), Bermuda (Peak/Bima).
⚔️ **PONTO FORTE**: Rush frontal muito agressivo com 2 granadeiros ativos.
🛡️ **PONTO FRACO**: Demoram a rotacionar da Safe 2 para Safe 3; costumam sofrer de costa no gás.

🎯 **NOSSA CONDUTA**:
- Evitar trocar tiro no aberto contra eles no Early Game.
- Esperar eles engajarem com outro time e fazer o Third Party (limpar o confronto).`,
    checklist: [
      { id: 'c1', text: 'Identificar as skins e nicks dos 4 titulares', completed: false },
      { id: 'c2', text: 'Avisar capitão quando avistar os veículos característicos', completed: false },
    ]
  }
];

const LOCAL_STORAGE_KEY = 'jhan_coach_tactical_notes_v1';

export const CoachNotebook: React.FC<CoachNotebookProps> = ({ onNavigate }) => {
  const { user, login } = useAuth();
  
  // State
  const [notes, setNotes] = useState<CoachNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Filters
  const [selectedMap, setSelectedMap] = useState('Todos');
  const [selectedSafe, setSelectedSafe] = useState('Todas');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedPriority, setSelectedPriority] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'priority' | 'title'>('updated');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal / Editor
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  
  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formMap, setFormMap] = useState<CoachNote['map']>('Bermuda');
  const [formSafeZone, setFormSafeZone] = useState('Safe 1');
  const [formCategory, setFormCategory] = useState('Call & Drop');
  const [formPriority, setFormPriority] = useState<CoachNote['priority']>('alta');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [formChecklist, setFormChecklist] = useState<CoachChecklistItem[]>([]);
  const [newChecklistInput, setNewChecklistInput] = useState('');
  const [formColor, setFormColor] = useState('loud');
  const [formPinned, setFormPinned] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Initial Load: Load local notes first
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNotes(parsed);
        } else {
          // If empty, initialize with templates as demo
          setNotes(QUICK_TEMPLATES.map((tpl, i) => ({
            id: 'sample-' + i,
            title: tpl.title,
            map: tpl.map as any,
            safeZone: tpl.safeZone,
            category: tpl.category,
            priority: tpl.priority as any,
            content: tpl.content,
            tags: tpl.tags,
            checklist: tpl.checklist,
            color: tpl.color,
            pinned: i === 0,
            userId: 'local',
            createdAt: Date.now() - (i * 3600000),
            updatedAt: Date.now() - (i * 3600000),
          })));
        }
      } else {
        setNotes(QUICK_TEMPLATES.map((tpl, i) => ({
          id: 'sample-' + i,
          title: tpl.title,
          map: tpl.map as any,
          safeZone: tpl.safeZone,
          category: tpl.category,
          priority: tpl.priority as any,
          content: tpl.content,
          tags: tpl.tags,
          checklist: tpl.checklist,
          color: tpl.color,
          pinned: i === 0,
          userId: 'local',
          createdAt: Date.now() - (i * 3600000),
          updatedAt: Date.now() - (i * 3600000),
        })));
      }
    } catch (e) {
      console.error('Failed to load local notes', e);
    }
    setLoading(false);
  }, []);

  // Save to LocalStorage whenever notes change
  useEffect(() => {
    if (!loading && notes.length > 0) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
      } catch (e) {
        console.error('Local storage save error', e);
      }
    }
  }, [notes, loading]);

  // 2. Firebase Sync: Listen to coach_notes for logged in user
  useEffect(() => {
    if (!user) return;

    setIsSyncing(true);
    const q = query(
      collection(db, 'coach_notes'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cloudNotes: CoachNote[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as CoachNote;
        cloudNotes.push({
          ...data,
          id: docSnap.id
        });
      });

      if (cloudNotes.length > 0) {
        setNotes(cloudNotes);
        setSyncMessage('Sincronizado com a Nuvem Google');
      }
      setIsSyncing(false);
    }, (error) => {
      console.error('Error fetching coach notes from Firestore:', error);
      setIsSyncing(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Sync Local Notes to Cloud
  const handleSyncToCloud = async () => {
    if (!user) {
      login();
      return;
    }

    setIsSyncing(true);
    try {
      for (const note of notes) {
        const noteRef = doc(db, 'coach_notes', note.id.startsWith('sample-') ? 'note-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5) : note.id);
        const payload: CoachNote = {
          ...note,
          id: noteRef.id,
          userId: user.uid,
          authorName: user.displayName || user.email || 'Coach',
          updatedAt: Date.now()
        };
        await setDoc(noteRef, payload, { merge: true });
      }
      showToast('✅ Todas as anotações foram salvas na Nuvem!');
    } catch (err: any) {
      console.error('Failed to sync to cloud:', err);
      showToast('❌ Erro ao sincronizar: ' + (err.message || 'Verifique as permissões'));
    } finally {
      setIsSyncing(false);
    }
  };

  // Open Form for New Note
  const handleOpenNewNote = (template?: typeof QUICK_TEMPLATES[0]) => {
    if (template) {
      setFormTitle(template.title);
      setFormMap(template.map as any);
      setFormSafeZone(template.safeZone);
      setFormCategory(template.category);
      setFormPriority(template.priority as any);
      setFormContent(template.content);
      setFormTags([...template.tags]);
      setFormChecklist(template.checklist.map(c => ({ ...c, id: Math.random().toString(36).substr(2, 6) })));
      setFormColor(template.color);
    } else {
      setFormTitle('');
      setFormMap('Bermuda');
      setFormSafeZone('Safe 1');
      setFormCategory('Call & Drop');
      setFormPriority('alta');
      setFormContent('');
      setFormTags(['call', 'rotação']);
      setFormChecklist([
        { id: '1', text: 'Confirmar rotação com o capitão', completed: false }
      ]);
      setFormColor('loud');
    }
    setFormPinned(false);
    setEditingNoteId(null);
    setNewTagInput('');
    setNewChecklistInput('');
    setIsModalOpen(true);
  };

  // Open Form to Edit
  const handleEditNote = (note: CoachNote) => {
    setEditingNoteId(note.id);
    setFormTitle(note.title);
    setFormMap(note.map);
    setFormSafeZone(note.safeZone || 'Safe 1');
    setFormCategory(note.category || 'Call & Drop');
    setFormPriority(note.priority || 'media');
    setFormContent(note.content);
    setFormTags(note.tags || []);
    setFormChecklist(note.checklist || []);
    setFormColor(note.color || 'loud');
    setFormPinned(note.pinned || false);
    setNewTagInput('');
    setNewChecklistInput('');
    setIsModalOpen(true);
  };

  // Save Note (Cloud or Local)
  const handleSaveNote = async () => {
    if (!formTitle.trim()) {
      alert('Por favor, informe o título da anotação.');
      return;
    }

    const noteId = editingNoteId || 'note-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    const updatedNote: CoachNote = {
      id: noteId,
      title: formTitle.trim(),
      map: formMap,
      safeZone: formSafeZone,
      category: formCategory,
      priority: formPriority,
      content: formContent,
      tags: formTags,
      checklist: formChecklist,
      pinned: formPinned,
      color: formColor,
      userId: user ? user.uid : 'local',
      authorName: user ? (user.displayName || user.email || 'Coach') : 'Coach Local',
      createdAt: editingNoteId ? (notes.find(n => n.id === editingNoteId)?.createdAt || Date.now()) : Date.now(),
      updatedAt: Date.now()
    };

    // Update Local state
    setNotes(prev => {
      const idx = prev.findIndex(n => n.id === noteId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedNote;
        return next;
      }
      return [updatedNote, ...prev];
    });

    // If User is logged in, save to Firestore
    if (user) {
      try {
        await setDoc(doc(db, 'coach_notes', noteId), updatedNote, { merge: true });
        showToast('✅ Anotação salva na nuvem com sucesso!');
      } catch (err: any) {
        console.error('Error saving to cloud:', err);
        showToast('⚠️ Salvo localmente (erro ao enviar para nuvem)');
      }
    } else {
      showToast('💾 Anotação salva localmente no navegador!');
    }

    setIsModalOpen(false);
  };

  // Toggle Checklist Item
  const handleToggleChecklist = async (noteId: string, itemId: string) => {
    const targetNote = notes.find(n => n.id === noteId);
    if (!targetNote || !targetNote.checklist) return;

    const updatedChecklist = targetNote.checklist.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    const updatedNote = {
      ...targetNote,
      checklist: updatedChecklist,
      updatedAt: Date.now()
    };

    setNotes(prev => prev.map(n => n.id === noteId ? updatedNote : n));

    if (user && !noteId.startsWith('sample-')) {
      try {
        await setDoc(doc(db, 'coach_notes', noteId), {
          checklist: updatedChecklist,
          updatedAt: Date.now()
        }, { merge: true });
      } catch (err) {
        console.error('Error updating checklist in cloud', err);
      }
    }
  };

  // Toggle Pin
  const handleTogglePin = async (noteId: string) => {
    const targetNote = notes.find(n => n.id === noteId);
    if (!targetNote) return;

    const nextPinned = !targetNote.pinned;
    const updatedNote = {
      ...targetNote,
      pinned: nextPinned,
      updatedAt: Date.now()
    };

    setNotes(prev => prev.map(n => n.id === noteId ? updatedNote : n));

    if (user && !noteId.startsWith('sample-')) {
      try {
        await setDoc(doc(db, 'coach_notes', noteId), {
          pinned: nextPinned,
          updatedAt: Date.now()
        }, { merge: true });
      } catch (err) {
        console.error('Error updating pin', err);
      }
    }
  };

  // Delete Note
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Deseja realmente excluir esta anotação tática?')) return;

    setNotes(prev => prev.filter(n => n.id !== noteId));

    if (user && !noteId.startsWith('sample-')) {
      try {
        await deleteDoc(doc(db, 'coach_notes', noteId));
        showToast('🗑️ Anotação excluída!');
      } catch (err) {
        console.error('Error deleting note from cloud', err);
      }
    } else {
      showToast('🗑️ Anotação removida localmente!');
    }
  };

  // Duplicate Note
  const handleDuplicateNote = async (note: CoachNote) => {
    const newId = 'note-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    const duplicated: CoachNote = {
      ...note,
      id: newId,
      title: `${note.title} (Cópia)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      userId: user ? user.uid : 'local',
    };

    setNotes(prev => [duplicated, ...prev]);

    if (user) {
      try {
        await setDoc(doc(db, 'coach_notes', newId), duplicated);
        showToast('📋 Anotação duplicada e salva na nuvem!');
      } catch (err) {
        console.error('Error duplicating in cloud', err);
      }
    } else {
      showToast('📋 Anotação duplicada localmente!');
    }
  };

  // Copy Formatted Note for Discord/WhatsApp
  const handleCopyDiscordFormat = (note: CoachNote) => {
    let text = `📋 **[CADERNO DO COACH] ${note.title}**\n`;
    text += `🗺️ **Mapa**: ${note.map} | ⏱️ **Fase**: ${note.safeZone || 'Geral'}\n`;
    text += `🏷️ **Categoria**: ${note.category || 'Estratégia'} | ⚡ **Prioridade**: ${(note.priority || 'Média').toUpperCase()}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `${note.content}\n\n`;

    if (note.checklist && note.checklist.length > 0) {
      text += `✅ **CHECKLIST DO TIME**:\n`;
      note.checklist.forEach(item => {
        text += `${item.completed ? '☑️' : '◻️'} ${item.text}\n`;
      });
    }

    if (note.tags && note.tags.length > 0) {
      text += `\n🏷️ ${note.tags.map(t => `#${t}`).join(' ')}\n`;
    }

    navigator.clipboard.writeText(text);
    showToast('✨ Anotação copiada no formato Discord/WhatsApp!');
  };

  // Tag Add / Remove in Form
  const handleAddTag = () => {
    const tag = newTagInput.trim().replace(/^#/, '').toLowerCase();
    if (tag && !formTags.includes(tag)) {
      setFormTags([...formTags, tag]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormTags(formTags.filter(t => t !== tagToRemove));
  };

  // Checklist Add / Remove in Form
  const handleAddChecklistItem = () => {
    if (newChecklistInput.trim()) {
      setFormChecklist([
        ...formChecklist,
        {
          id: Math.random().toString(36).substr(2, 6),
          text: newChecklistInput.trim(),
          completed: false
        }
      ]);
      setNewChecklistInput('');
    }
  };

  const handleRemoveChecklistItem = (id: string) => {
    setFormChecklist(formChecklist.filter(item => item.id !== id));
  };

  // Filtered & Sorted Notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter(note => {
        if (selectedMap !== 'Todos' && note.map !== selectedMap) return false;
        if (selectedSafe !== 'Todas' && note.safeZone !== selectedSafe) return false;
        if (selectedCategory !== 'Todas' && note.category !== selectedCategory) return false;
        if (selectedPriority !== 'Todas' && note.priority !== selectedPriority) return false;
        if (searchTerm.trim()) {
          const s = searchTerm.toLowerCase();
          const matchesTitle = note.title.toLowerCase().includes(s);
          const matchesContent = note.content.toLowerCase().includes(s);
          const matchesTags = note.tags?.some(t => t.toLowerCase().includes(s));
          const matchesMap = note.map.toLowerCase().includes(s);
          if (!matchesTitle && !matchesContent && !matchesTags && !matchesMap) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Pinned notes always come first
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;

        if (sortBy === 'updated') return (b.updatedAt || 0) - (a.updatedAt || 0);
        if (sortBy === 'created') return (b.createdAt || 0) - (a.createdAt || 0);
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'priority') {
          const order: Record<string, number> = { urgente: 4, alta: 3, media: 2, baixa: 1 };
          return (order[b.priority || 'baixa'] || 0) - (order[a.priority || 'baixa'] || 0);
        }
        return 0;
      });
  }, [notes, selectedMap, selectedSafe, selectedCategory, selectedPriority, searchTerm, sortBy]);

  // Counts by Map
  const mapCounts = useMemo(() => {
    const counts: Record<string, number> = { Todos: notes.length };
    notes.forEach(n => {
      counts[n.map] = (counts[n.map] || 0) + 1;
    });
    return counts;
  }, [notes]);

  return (
    <div className="section-spacing space-y-8 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-graphite-800 border-2 border-loud-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <Sparkles className="text-loud-500" size={20} />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-graphite-800/90 border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-loud-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 blur-[90px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-loud-500/20 text-loud-400 border border-loud-500/40 text-xs font-black uppercase tracking-wider">
                <BookOpen size={14} />
                <span>Coach Tactical Notebook</span>
              </span>

              {user ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 text-xs font-bold">
                  <Cloud size={14} className="animate-pulse" />
                  <span>Sincronizado na Nuvem: {user.displayName || user.email}</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => login()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition-colors cursor-pointer"
                  title="Clique para fazer login com Google e sincronizar"
                >
                  <CloudOff size={14} />
                  <span>Modo Local (Clique p/ Login Google & Salvar na Nuvem)</span>
                </button>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight uppercase">
              Caderno Tático <span className="text-loud-500">do Coach</span>
            </h1>
            <p className="text-gray-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Centralize todas as estratégias, chamadas de drop, rotações de safe, defesas de casa forte e leituras de adversários salvas e organizadas por mapa.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenNewNote()}
              className="btn-loud flex items-center gap-2 py-3 px-6 text-sm font-bold shadow-lg shadow-loud-500/20 cursor-pointer"
            >
              <Plus size={18} />
              <span>Nova Anotação</span>
            </button>

            {user ? (
              <button
                type="button"
                onClick={handleSyncToCloud}
                disabled={isSyncing}
                className="bg-graphite-700 hover:bg-graphite-600 border border-white/10 text-white font-bold text-xs py-3 px-4 rounded-full flex items-center gap-2 transition-all cursor-pointer"
                title="Forçar sincronização de dados"
              >
                <RefreshCw size={14} className={isSyncing ? 'animate-spin text-loud-500' : ''} />
                <span>{isSyncing ? 'Salvando...' : 'Sincronizar'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => login()}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 px-4 rounded-full flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                <Cloud size={14} />
                <span>Conectar Google</span>
              </button>
            )}

            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('/quadro-tatico')}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-bold text-xs py-3 px-4 rounded-full flex items-center gap-2 transition-all cursor-pointer"
              >
                <Layers size={14} />
                <span>Abrir Quadro Tático</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Template Suggestions Carousel */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Sparkles size={14} className="text-loud-500" />
              <span>Modelos Rápidos Pré-Configurados para Treino:</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {QUICK_TEMPLATES.map((tpl, i) => (
              <div
                key={i}
                onClick={() => handleOpenNewNote(tpl)}
                className="bg-graphite-900/80 hover:bg-graphite-900 border border-white/10 hover:border-loud-500/50 rounded-2xl p-3.5 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-loud-500/20 text-loud-400 uppercase">
                      {tpl.map}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {tpl.safeZone}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-loud-400 transition-colors line-clamp-1">
                    {tpl.title}
                  </h4>
                </div>
                <div className="mt-2 text-[10px] font-bold text-loud-500 flex items-center gap-1">
                  <span>Usar Modelo</span>
                  <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {MAP_OPTIONS.map((mapName) => {
          const count = mapCounts[mapName] || 0;
          const isSelected = selectedMap === mapName;
          return (
            <button
              key={mapName}
              type="button"
              onClick={() => setSelectedMap(mapName)}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                isSelected 
                  ? 'bg-loud-500 text-graphite-900 shadow-lg shadow-loud-500/20 scale-105' 
                  : 'bg-graphite-800 text-gray-300 hover:bg-graphite-700 hover:text-white border border-white/5'
              }`}
            >
              <span>{mapName.toUpperCase()}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSelected ? 'bg-graphite-900 text-loud-400' : 'bg-white/10 text-gray-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Secondary Controls: Search, Phase, Category, Priority, Sort & View Mode */}
      <div className="bg-graphite-800/80 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-lg">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por título, call, tag (#drop) ou conteúdo..."
            className="w-full bg-graphite-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-loud-500 transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Safe Phase */}
          <select
            value={selectedSafe}
            onChange={(e) => setSelectedSafe(e.target.value)}
            className="bg-graphite-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-loud-500 cursor-pointer"
          >
            {SAFE_PHASE_OPTIONS.map(opt => (
              <option key={opt} value={opt}>Fase: {opt}</option>
            ))}
          </select>

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-graphite-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-loud-500 cursor-pointer"
          >
            {CATEGORY_OPTIONS.map(opt => (
              <option key={opt} value={opt}>Cat: {opt}</option>
            ))}
          </select>

          {/* Priority */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-graphite-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-loud-500 cursor-pointer"
          >
            <option value="Todas">Prioridade: Todas</option>
            <option value="urgente">Prioridade: Urgente</option>
            <option value="alta">Prioridade: Alta</option>
            <option value="media">Prioridade: Média</option>
            <option value="baixa">Prioridade: Baixa</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-graphite-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-loud-500 cursor-pointer"
          >
            <option value="updated">Mais Recentes</option>
            <option value="priority">Maior Prioridade</option>
            <option value="title">Ordem Alfabética</option>
            <option value="created">Data de Criação</option>
          </select>
        </div>
      </div>

      {/* Tactical Notes Content Area */}
      {filteredNotes.length === 0 ? (
        <div className="bg-graphite-800/40 border border-dashed border-white/10 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-loud-500/10 text-loud-500 flex items-center justify-center mx-auto">
            <BookOpen size={32} />
          </div>
          <h3 className="text-xl font-bold text-white">Nenhuma anotação tática encontrada</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            {searchTerm || selectedMap !== 'Todos' || selectedSafe !== 'Todas' 
              ? 'Tente remover os filtros ou pesquisar por outro termo.' 
              : 'Comece criando a primeira anotação tática da sua equipe para registrar chamadas de drop e rotações de safe.'}
          </p>
          <button
            type="button"
            onClick={() => handleOpenNewNote()}
            className="btn-loud inline-flex items-center gap-2 py-2.5 px-6 text-xs font-bold cursor-pointer"
          >
            <Plus size={16} />
            <span>Criar Primeira Anotação</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => {
            const themeConfig = COLOR_THEMES.find(t => t.id === note.color) || COLOR_THEMES[0];
            const priorityConfig = PRIORITY_OPTIONS.find(p => p.id === note.priority) || PRIORITY_OPTIONS[2];
            const completedCount = note.checklist ? note.checklist.filter(c => c.completed).length : 0;
            const totalChecklist = note.checklist ? note.checklist.length : 0;

            return (
              <div
                key={note.id}
                className={`bg-graphite-800/90 border ${note.pinned ? 'border-loud-500/60 shadow-loud-500/5' : 'border-white/10'} hover:border-white/20 rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between relative group shadow-xl`}
              >
                {/* Pinned Ribbon Badge */}
                {note.pinned && (
                  <div className="absolute -top-2.5 right-6 px-3 py-0.5 rounded-full bg-loud-500 text-graphite-900 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                    <Pin size={10} className="fill-graphite-900" />
                    <span>Fixada</span>
                  </div>
                )}

                {/* Top Meta Details */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-loud-500/20 text-loud-400 border border-loud-500/30 uppercase tracking-wider">
                        {note.map}
                      </span>
                      {note.safeZone && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 text-gray-300 border border-white/10">
                          {note.safeZone}
                        </span>
                      )}
                      {note.category && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 text-gray-400">
                          {note.category}
                        </span>
                      )}
                    </div>

                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${priorityConfig.color}`}>
                      {priorityConfig.label}
                    </span>
                  </div>

                  {/* Note Title */}
                  <h3 className="text-lg sm:text-xl font-display font-bold text-white group-hover:text-loud-400 transition-colors leading-snug">
                    {note.title}
                  </h3>

                  {/* Note Content Text with Markdown-like rendering */}
                  <div className="text-xs text-gray-300 leading-relaxed max-h-48 overflow-y-auto pr-1 whitespace-pre-line space-y-1 scrollbar-thin">
                    {note.content}
                  </div>

                  {/* Checklist Section if available */}
                  {note.checklist && note.checklist.length > 0 && (
                    <div className="pt-3 border-t border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-gray-400">
                        <span>Checklist de Execução</span>
                        <span className="font-mono text-loud-400">{completedCount}/{totalChecklist}</span>
                      </div>
                      <div className="space-y-1.5">
                        {note.checklist.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleToggleChecklist(note.id, item.id)}
                            className={`flex items-start gap-2 p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                              item.completed ? 'bg-loud-500/10 text-gray-400 line-through' : 'bg-graphite-900/60 hover:bg-graphite-900 text-gray-200'
                            }`}
                          >
                            {item.completed ? (
                              <CheckSquare size={14} className="text-loud-500 shrink-0 mt-0.5" />
                            ) : (
                              <Square size={14} className="text-gray-500 shrink-0 mt-0.5" />
                            )}
                            <span className="leading-tight select-none">{item.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-2">
                      {note.tags.map((t, idx) => (
                        <span
                          key={idx}
                          onClick={() => setSearchTerm(t)}
                          className="text-[10px] font-semibold text-gray-400 hover:text-loud-400 bg-white/5 hover:bg-loud-500/10 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-4 border-t border-white/10 mt-6 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleTogglePin(note.id)}
                      className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                        note.pinned ? 'bg-loud-500/20 text-loud-400 border-loud-500/30' : 'bg-white/5 hover:bg-white/10 text-gray-400 border-white/5'
                      }`}
                      title={note.pinned ? 'Desafixar' : 'Fixar no Topo'}
                    >
                      <Pin size={14} className={note.pinned ? 'fill-loud-400' : ''} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyDiscordFormat(note)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-loud-500/20 text-gray-400 hover:text-loud-400 border border-white/5 transition-colors cursor-pointer"
                      title="Copiar formatado para Discord / WhatsApp"
                    >
                      <Copy size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicateNote(note)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 transition-colors cursor-pointer"
                      title="Duplicar Anotação"
                    >
                      <Share2 size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleEditNote(note)}
                      className="bg-white/10 hover:bg-loud-500 text-gray-200 hover:text-black font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Edit3 size={13} />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-colors cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Note Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-graphite-900 border border-white/20 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-loud-500/20 text-loud-500 flex items-center justify-center">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {editingNoteId ? 'Editar Anotação Tática' : 'Nova Anotação Tática do Coach'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Defina mapas, chamadas de safe, rotações e checklist de tarefas para sua line.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-2 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Inputs */}
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Título da Anotação *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Call Bermudas Queda 1 - Rotação Observatory -> Peak"
                  className="w-full bg-graphite-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-loud-500 transition-colors"
                />
              </div>

              {/* Grid 1: Map, Safe Zone, Category, Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Mapa
                  </label>
                  <select
                    value={formMap}
                    onChange={(e) => setFormMap(e.target.value as any)}
                    className="w-full bg-graphite-800 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-loud-500"
                  >
                    {MAP_OPTIONS.filter(m => m !== 'Todos').map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Fase da Safe
                  </label>
                  <select
                    value={formSafeZone}
                    onChange={(e) => setFormSafeZone(e.target.value)}
                    className="w-full bg-graphite-800 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-loud-500"
                  >
                    {SAFE_PHASE_OPTIONS.filter(s => s !== 'Todas').map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-graphite-800 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-loud-500"
                  >
                    {CATEGORY_OPTIONS.filter(c => c !== 'Todas').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Prioridade
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full bg-graphite-800 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-loud-500"
                  >
                    {PRIORITY_OPTIONS.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Strategy Content */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Instruções & Chamadas Táticas
                  </label>
                  {/* Quick Text Helpers */}
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {['📍 CALL: ', '🚗 VEÍCULO: ', '💣 GRANADA: ', '🛡️ GELO: ', '⏱️ TEMPO: ', '⚠️ ATENÇÃO: '].map((prefix, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormContent(prev => prev ? `${prev}\n${prefix}` : prefix)}
                        className="text-[10px] font-bold bg-white/5 hover:bg-loud-500/20 text-gray-300 hover:text-loud-400 px-2 py-0.5 rounded border border-white/10 transition-colors"
                      >
                        {prefix}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  rows={8}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Escreva os detalhes da estratégia, timing das rotações, funções de cada jogador (Rush/Suporte), marcação de território..."
                  className="w-full bg-graphite-800 border border-white/10 rounded-xl p-4 text-xs sm:text-sm text-white focus:outline-none focus:border-loud-500 transition-colors font-sans leading-relaxed"
                />
              </div>

              {/* Checklist Builder */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Checklist de Tarefas para a Line
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={newChecklistInput}
                    onChange={(e) => setNewChecklistInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddChecklistItem(); } }}
                    placeholder="Adicionar item (Ex: Pegar 2 granadas por jogador)..."
                    className="flex-1 bg-graphite-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-loud-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddChecklistItem}
                    className="bg-white/10 hover:bg-loud-500 text-white hover:text-black text-xs font-bold py-2 px-4 rounded-xl transition-all cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>

                {formChecklist.length > 0 && (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {formChecklist.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-graphite-800 border border-white/5 text-xs">
                        <span className="text-gray-300">{item.text}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveChecklistItem(item.id)}
                          className="text-red-400 hover:text-red-300 text-xs px-2"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags & Pin Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Tags de Filtro (#)
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                      placeholder="Ex: drop, safe1, rush..."
                      className="flex-1 bg-graphite-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-loud-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="bg-white/10 hover:bg-loud-500 text-white hover:text-black text-xs font-bold py-2 px-3 rounded-xl transition-all cursor-pointer"
                    >
                      + Tag
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formTags.map((tag) => (
                      <span key={tag} className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                        #{tag}
                        <button type="button" onClick={() => handleRemoveTag(tag)} className="text-gray-400 hover:text-white">✕</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-graphite-800 rounded-2xl border border-white/5 h-fit self-end">
                  <div>
                    <span className="block text-xs font-bold text-white">Fixar no Topo do Caderno</span>
                    <span className="text-[10px] text-gray-400">Mantém a chamada sempre visível em destaque</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formPinned}
                    onChange={(e) => setFormPinned(e.target.checked)}
                    className="w-5 h-5 accent-loud-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-full border border-white/10 text-gray-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                className="btn-loud px-6 py-2.5 text-xs font-bold cursor-pointer"
              >
                Salvar Anotação Tática
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachNotebook;
