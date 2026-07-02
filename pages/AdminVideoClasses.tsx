import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, addDoc, deleteDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { VideoClass } from '../types';
import { useAuth } from '../components/FirebaseProvider';
import { Plus, Trash2, Edit2, PlayCircle, Save, X, Video } from 'lucide-react';

const AdminVideoClasses: React.FC = () => {
  const { isAdmin } = useAuth();
  const [classes, setClasses] = useState<VideoClass[]>([]);
  const [title, setTitle] = useState('');
  const [youtubeId, setYoutubeId] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editYoutubeId, setEditYoutubeId] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const fetchClasses = async () => {
    const q = query(collection(db, 'videoClasses'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const data: VideoClass[] = [];
    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() } as VideoClass);
    });
    setClasses(data);
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !youtubeId) return;

    setLoading(true);
    try {
      const cleanId = extractYoutubeId(youtubeId);
      await addDoc(collection(db, 'videoClasses'), {
        title,
        youtubeId: cleanId,
        description,
        category,
        createdAt: serverTimestamp()
      });
      setTitle('');
      setYoutubeId('');
      setDescription('');
      setCategory('');
      fetchClasses();
    } catch (error) {
      console.error("Error adding document: ", error);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Certeza que deseja deletar esta aula?")) {
      await deleteDoc(doc(db, 'videoClasses', id));
      fetchClasses();
    }
  };

  const handleEditClick = (item: VideoClass) => {
    setEditingId(item.id!);
    setEditTitle(item.title);
    setEditYoutubeId(item.youtubeId);
    setEditDescription(item.description || '');
    setEditCategory(item.category || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditYoutubeId('');
    setEditDescription('');
    setEditCategory('');
  };

  const handleUpdate = async (id: string) => {
    if (!editTitle || !editYoutubeId) return;
    try {
      const cleanId = extractYoutubeId(editYoutubeId);
      await updateDoc(doc(db, 'videoClasses', id), {
        title: editTitle,
        youtubeId: cleanId,
        description: editDescription,
        category: editCategory,
        updatedAt: serverTimestamp()
      });
      setEditingId(null);
      fetchClasses();
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const extractYoutubeId = (urlOrId: string) => {
    const trimmed = urlOrId.trim();
    if (!trimmed) return '';
    
    // Regular expression that matches almost any YouTube URL structure (watch, embed, shorts, live, youtu.be, etc.)
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
    const match = trimmed.match(regex);
    if (match && match[1]) {
      return match[1];
    }

    // Secondary parsing for mobile/shorts/live
    try {
      const parsed = new URL(trimmed);
      const paths = parsed.pathname.split('/').filter(Boolean);
      if (parsed.hostname.includes('youtu.be') && paths[0]) {
        return paths[0];
      }
      if (parsed.hostname.includes('youtube.com')) {
        if (parsed.searchParams.get('v')) {
          return parsed.searchParams.get('v')!;
        }
        if (paths.includes('shorts') || paths.includes('live') || paths.includes('embed')) {
          const idx = paths.findIndex(p => p === 'shorts' || p === 'live' || p === 'embed');
          if (idx !== -1 && paths[idx + 1]) {
            return paths[idx + 1];
          }
        }
      }
    } catch (e) {
      // Ignore
    }

    // Check if it's already a clean 11 character ID, possibly with query params pasted
    const cleanId = trimmed.split(/[?#&]/)[0].trim();
    return cleanId;
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-3xl font-display font-bold text-white mb-4">Acesso Restrito</h2>
        <p className="text-premium-muted">Apenas administradores podem gerenciar aulas.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-4xl md:text-5xl font-display font-bold text-white uppercase tracking-tight flex items-center justify-center gap-4">
          <Video className="text-loud-500" size={40} /> Admin: <span className="text-loud-500">Videoaulas</span>
        </h2>
        <p className="text-premium-muted">Gerencie o acervo de videoaulas (Sala de Aula).</p>
      </div>

      {/* Formulario de Adição */}
      <div className="bg-graphite-800 p-8 rounded-3xl border border-white/5 space-y-6">
        <h3 className="font-display font-bold text-xl text-white">Adicionar Nova Aula</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da Aula"
              className="w-full bg-graphite-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-loud-500 outline-none"
              required
            />
            <div className="space-y-2">
              <input 
                type="text" 
                value={youtubeId} 
                onChange={(e) => setYoutubeId(extractYoutubeId(e.target.value))}
                placeholder="ID do Video (ex: dQw4w9WgXcQ) ou Link"
                className="w-full bg-graphite-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-loud-500 outline-none"
                required
              />
              <p className="text-xs text-premium-muted">
                Dica: Verifique se o vídeo não é privado e se permite incorporação nas configurações do YouTube.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Módulo/Categoria (ex: Básico)"
              className="w-full bg-graphite-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-loud-500 outline-none"
            />
            <input 
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição ou Tópicos da Aula"
              className="w-full bg-graphite-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-loud-500 outline-none"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-loud-500 hover:bg-loud-600 text-black font-bold uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Adicionando...' : <><Plus size={20} /> Adicionar Videoaula</>}
          </button>
        </form>
      </div>

      {/* Lista de Aulas */}
      <div className="space-y-4">
        <h3 className="font-display font-bold text-xl text-white">Aulas Existentes</h3>
        {classes.length === 0 ? (
          <p className="text-premium-muted text-center py-8">Nenhuma aula cadastrada ainda.</p>
        ) : (
          <div className="space-y-4">
            {classes.map((item) => (
              <div key={item.id} className="bg-graphite-800 rounded-2xl border border-white/5 overflow-hidden flex flex-col md:flex-row group">
                <div className="w-full md:w-64 bg-graphite-900 flex-shrink-0 relative">
                  <img 
                    src={`https://img.youtube.com/vi/${extractYoutubeId(item.youtubeId)}/hqdefault.jpg`} 
                    alt={item.title} 
                    className="w-full h-full object-cover aspect-video"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle size={40} className="text-white" />
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-grow">
                  {editingId === item.id ? (
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        value={editTitle} 
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Título da Aula"
                        className="w-full bg-graphite-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-loud-500 outline-none"
                      />
                      <input 
                        type="text" 
                        value={editYoutubeId} 
                        onChange={(e) => setEditYoutubeId(extractYoutubeId(e.target.value))}
                        placeholder="ID do Video"
                        className="w-full bg-graphite-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-loud-500 outline-none"
                      />
                      <input 
                        type="text" 
                        value={editCategory} 
                        onChange={(e) => setEditCategory(e.target.value)}
                        placeholder="Categoria/Módulo"
                        className="w-full bg-graphite-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-loud-500 outline-none"
                      />
                      <input 
                        type="text" 
                        value={editDescription} 
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Descrição"
                        className="w-full bg-graphite-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-loud-500 outline-none"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button 
                          onClick={handleCancelEdit}
                          className="p-2 text-premium-muted hover:text-white rounded-lg transition-colors"
                        >
                          <X size={18} />
                        </button>
                        <button 
                          onClick={() => handleUpdate(item.id!)}
                          className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
                        >
                          <Save size={18} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start h-full">
                      <div className="space-y-2">
                         <div className="flex items-center gap-2">
                            {item.category && <span className="text-[10px] font-bold text-graphite-900 bg-loud-500 px-2 py-1 rounded-md uppercase tracking-widest">{item.category}</span>}
                            <h3 className="font-display font-bold text-lg text-white uppercase tracking-tight">{item.title}</h3>
                         </div>
                         {item.description && <p className="text-sm text-premium-muted">{item.description}</p>}
                         <p className="text-xs text-premium-muted pt-2">Youtube ID: <span className="text-white font-mono">{item.youtubeId}</span></p>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleEditClick(item)}
                          className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => item.id && handleDelete(item.id)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVideoClasses;
