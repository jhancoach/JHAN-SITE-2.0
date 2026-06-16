import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy, updateDoc } from 'firebase/firestore';
import { Resource } from '../types';
import { useAuth } from '../components/FirebaseProvider';
import { Plus, Trash2, ExternalLink, Image as ImageIcon, Tag, Save, Edit2, X } from 'lucide-react';

const AdminTeamLogos: React.FC = () => {
  const { isAdmin } = useAuth();
  const [teamLogos, setTeamLogos] = useState<Resource[]>([]);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const fetchTeamLogos = async () => {
    const q = query(collection(db, 'teamLogos'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
    setTeamLogos(data);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchTeamLogos();
    }
  }, [isAdmin]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !imageUrl) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'teamLogos'), {
        name,
        imageUrl,
        category,
        createdAt: serverTimestamp()
      });
      setName('');
      setImageUrl('');
      setCategory('');
      fetchTeamLogos();
    } catch (error) {
      console.error("Error adding document: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir?')) return;
    try {
      await deleteDoc(doc(db, 'teamLogos', id));
      fetchTeamLogos();
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  const handleEditClick = (item: Resource) => {
    setEditingId(item.id!);
    setEditName(item.name);
    setEditImageUrl(item.imageUrl);
    setEditCategory(item.category || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditImageUrl('');
    setEditCategory('');
  };

  const handleUpdate = async (id: string) => {
    if (!editName || !editImageUrl) return;
    try {
      await updateDoc(doc(db, 'teamLogos', id), {
        name: editName,
        imageUrl: editImageUrl,
        category: editCategory,
        updatedAt: serverTimestamp()
      });
      setEditingId(null);
      fetchTeamLogos();
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="text-4xl font-display font-black text-red-500 uppercase mb-4 tracking-tighter">Acesso Negado</h1>
        <p className="text-premium-muted">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/10 pb-8">
        <div>
          <h1 className="text-5xl font-display font-black text-white uppercase tracking-tighter italic">Gerenciar <span className="text-loud-500">Logos de Times</span></h1>
          <p className="text-premium-muted mt-2">Adicione ou remova logos de times que aparecerão no site.</p>
        </div>
      </div>

      {/* Instructions Card */}
      <div className="bg-graphite-800/50 rounded-3xl border border-white/5 p-6 border-l-4 border-l-loud-500">
        <h3 className="text-loud-500 font-bold uppercase tracking-widest text-sm mb-2 flex items-center gap-2">
          <ImageIcon size={16} /> Como Adicionar Imagens/Arquivos
        </h3>
        <div className="text-premium-muted text-sm leading-relaxed">
          O sistema utiliza links diretos. Para "upar" uma nova imagem:
          <ol className="list-decimal ml-5 mt-2 space-y-1">
            <li>Acesse um site de hospedagem (ex: <a href="https://imgbb.com" target="_blank" rel="noreferrer" className="text-loud-500 underline">ImgBB</a>).</li>
            <li>Faça o upload do seu arquivo ou imagem.</li>
            <li>Copie o <strong>Link Direto</strong> (aquele que termina em .jpg, .png, etc).</li>
            <li>Cole o link no campo "URL da Imagem" abaixo.</li>
          </ol>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-graphite-800 rounded-3xl border border-white/5 p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <Plus size={120} />
        </div>
        <form onSubmit={handleAdd} className="space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-loud-500 uppercase tracking-widest flex items-center gap-2">
                <Tag size={12} /> Nome do Time
              </label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: LOUD"
                className="w-full bg-graphite-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-loud-500 outline-none transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-loud-500 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={12} /> URL da Imagem (ImgBB)
              </label>
              <input 
                type="url" 
                value={imageUrl} 
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://i.ibb.co/..."
                className="w-full bg-graphite-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-loud-500 outline-none transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-loud-500 uppercase tracking-widest flex items-center gap-2">
                <Tag size={12} /> Divisão/Grupo (Opcional)
              </label>
              <input 
                type="text" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Série A"
                className="w-full bg-graphite-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-loud-500 outline-none transition-all"
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full md:w-auto bg-loud-500 hover:bg-loud-600 text-graphite-900 font-bold px-8 py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-loud-500/20"
          >
            {loading ? 'Salvando...' : <><Save size={20} /> Adicionar Logo</>}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamLogos.map((item) => (
          <div key={item.id} className="bg-graphite-800 rounded-3xl border border-white/5 overflow-hidden group hover:border-loud-500/50 transition-all flex flex-col">
            <div className="aspect-video relative overflow-hidden bg-black/20">
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <a href={item.imageUrl} target="_blank" rel="noreferrer" className="p-3 bg-loud-500 text-graphite-900 rounded-full hover:scale-110 transition-transform">
                   <ExternalLink size={20} />
                 </a>
              </div>
            </div>
            <div className="p-6 flex flex-col flex-grow">
              {editingId === item.id ? (
                <div className="space-y-4">
                  <input 
                    type="text" 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Nome"
                    className="w-full bg-graphite-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-loud-500 outline-none"
                  />
                  <input 
                    type="url" 
                    value={editImageUrl} 
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    placeholder="URL da Imagem"
                    className="w-full bg-graphite-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-loud-500 outline-none"
                  />
                  <input 
                    type="text" 
                    value={editCategory} 
                    onChange={(e) => setEditCategory(e.target.value)}
                    placeholder="Divisão/Grupo"
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
                <div className="flex justify-between items-start mb-4">
                  <div>
                     <h3 className="font-display font-bold text-lg text-white uppercase tracking-tight">{item.name}</h3>
                     {item.category && <span className="text-[10px] font-bold text-loud-500 uppercase tracking-widest">{item.category}</span>}
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
    </div>
  );
};

export default AdminTeamLogos;
