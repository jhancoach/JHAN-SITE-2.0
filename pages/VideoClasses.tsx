import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { VideoClass } from '../types';
import { PlayCircle, Video, Search, X, BookOpen, Clock } from 'lucide-react';

const VideoClasses: React.FC<{ onNavigate?: (path: string) => void }> = () => {
  const [classes, setClasses] = useState<VideoClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Todas');
  const [activeVideo, setActiveVideo] = useState<VideoClass | null>(null);

  const fetchClasses = async () => {
    try {
      const q = query(collection(db, 'videoClasses'), orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(q);
      const data: VideoClass[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as VideoClass);
      });
      setClasses(data);
      if (data.length > 0) {
        setActiveVideo(data[0]);
      }
    } catch (error) {
      console.error("Error fetching video classes: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const categories = ['Todas', ...Array.from(new Set(classes.map(c => c.category).filter(Boolean)))];

  const getCleanYoutubeId = (urlOrId: string) => {
    if (!urlOrId) return '';
    const trimmed = urlOrId.trim();
    try {
      const url = new URL(trimmed);
      if (url.searchParams.get('v')) return url.searchParams.get('v')!;
      if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2];
      if (url.pathname.startsWith('/embed/')) return url.pathname.split('/')[2];
      if (url.pathname.startsWith('/live/')) return url.pathname.split('/')[2];
      if (url.hostname.includes('youtu.be')) return url.pathname.slice(1);
    } catch (e) {
      // ignore
    }
    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([^"&?/\s]{11})/);
    if (match) return match[1];
    
    // If it's a full URL that failed parsing, maybe we can find v=... manually
    const vMatch = trimmed.match(/[?&]v=([^"&?/\s]{11})/);
    if (vMatch) return vMatch[1];

    // Otherwise, assume it's an ID
    return trimmed.split(/[?#&]/)[0]; // Remove query params if they just pasted ID with some random stuff
  };

  const filteredClasses = classes.filter(item => {
    const matchesFilter = activeCategory === 'Todas' || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-loud-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
      {/* Player Section (Main View) */}
      <div className="lg:w-2/3 space-y-6">
        {activeVideo ? (
          <div className="space-y-6">
            <div className="bg-graphite-900 border-2 border-white/5 rounded-3xl overflow-hidden shadow-2xl relative" style={{ paddingTop: '56.25%' }}>
              <iframe
                title={activeVideo.title}
                src={`https://www.youtube.com/embed/${getCleanYoutubeId(activeVideo.youtubeId)}?autoplay=1`}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            
            <div className="bg-graphite-800 border border-white/5 p-8 rounded-3xl shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                {activeVideo.category && (
                  <span className="text-xs font-bold text-graphite-900 bg-loud-500 px-3 py-1 rounded-md uppercase tracking-widest">
                    {activeVideo.category}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-premium-muted"><Clock size={14} /> Aula</span>
              </div>
              <h1 className="text-3xl font-display font-bold text-white uppercase tracking-tight mb-4">
                {activeVideo.title}
              </h1>
              {activeVideo.description && (
                <div className="prose prose-invert prose-p:text-premium-muted">
                  <p>{activeVideo.description}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-graphite-800 border border-white/5 rounded-3xl p-12 text-center h-full flex flex-col items-center justify-center min-h-[400px]">
            <Video size={64} className="text-premium-muted mb-4 opacity-50" />
            <h2 className="text-2xl font-display font-bold text-white mb-2">Nenhuma aula selecionada</h2>
            <p className="text-premium-muted">Selecione uma aula no menu ao lado para começar.</p>
          </div>
        )}
      </div>

      {/* Playlist / Sidebar */}
      <div className="lg:w-1/3 bg-graphite-800 border border-white/5 rounded-3xl overflow-hidden h-[800px] flex flex-col shadow-lg">
        <div className="p-6 border-b border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-loud-500/10 text-loud-500">
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-white uppercase">Conteúdo do Curso</h2>
              <p className="text-sm text-premium-muted">{filteredClasses.length} aula(s)</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-premium-muted" size={16} />
            <input 
                type="text" 
                placeholder="Pesquisar aula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-graphite-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-loud-500 transition-all text-white"
            />
            {searchTerm && (
                <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-premium-muted hover:text-white"
                >
                    <X size={14} />
                </button>
            )}
          </div>

          {categories.length > 1 && (
             <select 
               value={activeCategory} 
               onChange={(e) => setActiveCategory(e.target.value)}
               className="w-full bg-graphite-900 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-loud-500 text-white appearance-none cursor-pointer"
             >
               {categories.map(cat => (
                 <option key={cat as string} value={cat as string}>{cat}</option>
               ))}
             </select>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {filteredClasses.length > 0 ? (
            filteredClasses.map((item, index) => {
              const isActive = activeVideo?.id === item.id;
              return (
                <button 
                  key={item.id}
                  onClick={() => setActiveVideo(item)}
                  className={`w-full text-left p-3 rounded-2xl flex gap-4 transition-all group border ${isActive ? 'bg-loud-500/10 border-loud-500/30' : 'bg-transparent border-transparent hover:bg-graphite-700/50'}`}
                >
                  <div className="w-32 flex-shrink-0 relative rounded-xl overflow-hidden aspect-video bg-graphite-900">
                    <img 
                      src={`https://img.youtube.com/vi/${getCleanYoutubeId(item.youtubeId)}/mqdefault.jpg`} 
                      alt="" 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    {isActive ? (
                      <div className="absolute inset-0 bg-loud-500/20 flex items-center justify-center backdrop-blur-[2px]">
                        <PlayCircle size={24} className="text-white drop-shadow-md" fill="currentColor" />
                      </div>
                    ) : (
                      <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-bold text-white">
                        <Video size={10} className="inline mr-1" />
                        AULA
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center py-1">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-loud-500' : 'text-premium-muted'}`}>
                      Aula {index + 1} • {item.category || 'Geral'}
                    </span>
                    <h4 className={`font-bold mt-1 line-clamp-2 leading-tight ${isActive ? 'text-white' : 'text-premium-muted group-hover:text-white'}`}>
                      {item.title}
                    </h4>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-center py-12 px-4">
              <p className="text-premium-muted text-sm">Nenhuma aula encontrada para esta busca.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoClasses;
