import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Resource } from '../types';
import { useAuth } from '../components/FirebaseProvider';
import { Plus, Trash2, ExternalLink, Image as ImageIcon, Tag, Save } from 'lucide-react';

const AdminResources: React.FC = () => {
  const { isAdmin } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchResources = async () => {
    const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
    setResources(data);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchResources();
    }
  }, [isAdmin]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !imageUrl) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'resources'), {
        name,
        imageUrl,
        category,
        createdAt: serverTimestamp()
      });
      setName('');
      setImageUrl('');
      setCategory('');
      fetchResources();
    } catch (error) {
      console.error("Error adding document: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir?')) return;
    try {
      await deleteDoc(doc(db, 'resources', id));
      fetchResources();
    } catch (error) {
      console.error("Error deleting document: ", error);
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
          <h1 className="text-5xl font-display font-black text-white uppercase tracking-tighter italic">Gerenciar <span className="text-gold-500">Recursos</span></h1>
          <p className="text-premium-muted mt-2">Adicione ou remova links de download que aparecerão no site.</p>
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
              <label className="text-xs font-bold text-gold-500 uppercase tracking-widest flex items-center gap-2">
                <Tag size={12} /> Nome do Recurso
              </label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Planilha de Scout"
                className="w-full bg-graphite-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold-500 outline-none transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gold-500 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={12} /> URL da Imagem (ImgBB)
              </label>
              <input 
                type="url" 
                value={imageUrl} 
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://i.ibb.co/..."
                className="w-full bg-graphite-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold-500 outline-none transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gold-500 uppercase tracking-widest flex items-center gap-2">
                <Tag size={12} /> Categoria (Opcional)
              </label>
              <input 
                type="text" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Planilhas"
                className="w-full bg-graphite-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold-500 outline-none transition-all"
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full md:w-auto bg-gold-500 hover:bg-gold-600 text-graphite-900 font-bold px-8 py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-gold-500/20"
          >
            {loading ? 'Salvando...' : <><Save size={20} /> Adicionar Recurso</>}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((item) => (
          <div key={item.id} className="bg-graphite-800 rounded-3xl border border-white/5 overflow-hidden group hover:border-gold-500/50 transition-all flex flex-col">
            <div className="aspect-video relative overflow-hidden bg-black/20">
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <a href={item.imageUrl} target="_blank" rel="noreferrer" className="p-3 bg-gold-500 text-graphite-900 rounded-full hover:scale-110 transition-transform">
                   <ExternalLink size={20} />
                 </a>
              </div>
            </div>
            <div className="p-6 flex flex-col flex-grow">
              <div className="flex justify-between items-start mb-4">
                <div>
                   <h3 className="font-display font-bold text-lg text-white uppercase tracking-tight">{item.name}</h3>
                   {item.category && <span className="text-[10px] font-bold text-gold-500 uppercase tracking-widest">{item.category}</span>}
                </div>
                <button 
                  onClick={() => item.id && handleDelete(item.id)}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminResources;
