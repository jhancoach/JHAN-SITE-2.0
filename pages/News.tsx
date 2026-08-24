import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { SiteUpdate } from '../types';
import { SITE_UPDATES_DATA } from '../constants';
import { 
  Sparkles, 
  Flame, 
  CheckCircle2, 
  ArrowRight, 
  Search, 
  Plus, 
  Trash2, 
  Layers, 
  Trophy, 
  ScanLine, 
  LayoutGrid, 
  GraduationCap, 
  Users, 
  Download, 
  Calendar, 
  Tag, 
  ExternalLink,
  MessageSquare,
  ShieldAlert,
  Compass,
  BellRing
} from 'lucide-react';

interface NewsProps {
  onNavigate?: (path: string) => void;
}

export const News: React.FC<NewsProps> = ({ onNavigate }) => {
  const [updates, setUpdates] = useState<SiteUpdate[]>(SITE_UPDATES_DATA);
  const [selectedTag, setSelectedTag] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Admin form state
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTag, setNewTag] = useState<'NOVO' | 'MELHORIA' | 'DESTAQUE' | 'CORREÇÃO' | 'IMPORTANTE'>('NOVO');
  const [newVersion, setNewVersion] = useState('v' + (new Date().getFullYear() % 100) + '.' + (new Date().getMonth() + 1) + '.0');
  const [newDescription, setNewDescription] = useState('');
  const [newDetailsText, setNewDetailsText] = useState('');
  const [newLinkPath, setNewLinkPath] = useState('/jogo');
  const [newLinkText, setNewLinkText] = useState('Acessar Ferramenta');
  const [newFeatured, setNewFeatured] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch from Firestore or fallback to predefined
  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const q = query(collection(db, 'siteUpdates'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const fetched: SiteUpdate[] = [];
          snap.forEach((docItem) => {
            fetched.push({ id: docItem.id, ...docItem.data() } as SiteUpdate);
          });
          
          // Merge with predefined if needed, removing duplicates by id
          const existingIds = new Set(fetched.map(item => item.id));
          const merged = [...fetched, ...SITE_UPDATES_DATA.filter(item => !existingIds.has(item.id))];
          setUpdates(merged);
        } else {
          setUpdates(SITE_UPDATES_DATA);
        }
      } catch (err) {
        console.warn('Usando dados locais de novidades:', err);
        setUpdates(SITE_UPDATES_DATA);
      } finally {
        setLoading(false);
      }
    };

    fetchUpdates();
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin === '2026' || adminPin === 'jhan2026' || adminPin === 'admin') {
      setAdminAuthenticated(true);
      setErrorMsg('');
    } else {
      setErrorMsg('Senha administrativa incorreta.');
    }
  };

  const handleCreateUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      setErrorMsg('Preencha o título e a descrição da novidade.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const detailsArray = newDetailsText
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);

      const updatePayload: Omit<SiteUpdate, 'id'> = {
        title: newTitle.trim(),
        tag: newTag,
        version: newVersion.trim() || 'v2.8.0',
        date: new Date().toLocaleDateString('pt-BR'),
        description: newDescription.trim(),
        details: detailsArray.length > 0 ? detailsArray : undefined,
        linkPath: newLinkPath.trim() || undefined,
        linkText: newLinkText.trim() || undefined,
        featured: newFeatured,
        author: 'Jhan Medeiros',
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'siteUpdates'), updatePayload);
      
      const createdItem: SiteUpdate = {
        id: docRef.id,
        ...updatePayload
      };

      setUpdates(prev => [createdItem, ...prev]);
      setSuccessMsg('Novidade publicada com sucesso!');
      
      // Reset form
      setNewTitle('');
      setNewDescription('');
      setNewDetailsText('');
      setNewFeatured(false);
    } catch (err: any) {
      console.error('Erro ao salvar novidade:', err);
      setErrorMsg('Falha ao salvar no Firestore. Verifique sua conexão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUpdate = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta atualização?')) return;
    try {
      await deleteDoc(doc(db, 'siteUpdates', id));
      setUpdates(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Erro ao deletar:', err);
      // If it is a local static one, just filter from state
      setUpdates(prev => prev.filter(item => item.id !== id));
    }
  };

  const getTagBadgeStyle = (tag: string) => {
    switch (tag) {
      case 'DESTAQUE':
        return 'bg-amber-500/20 text-amber-300 border-amber-400/40';
      case 'NOVO':
        return 'bg-loud-500/20 text-loud-400 border-loud-400/40';
      case 'MELHORIA':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40';
      case 'CORREÇÃO':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40';
      case 'IMPORTANTE':
        return 'bg-red-500/20 text-red-300 border-red-400/40';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-400/40';
    }
  };

  const getUpdateIcon = (iconName?: string, tag?: string) => {
    if (iconName === 'ScanLine' || tag === 'DESTAQUE') return <ScanLine className="text-loud-400" size={24} />;
    if (iconName === 'LayoutGrid') return <LayoutGrid className="text-cyan-400" size={24} />;
    if (iconName === 'Trophy') return <Trophy className="text-amber-400" size={24} />;
    if (iconName === 'GraduationCap') return <GraduationCap className="text-purple-400" size={24} />;
    if (iconName === 'Users') return <Users className="text-pink-400" size={24} />;
    if (iconName === 'Download') return <Download className="text-emerald-400" size={24} />;
    return <Sparkles className="text-loud-400" size={24} />;
  };

  // Filtered updates
  const tagsList = ['TODOS', 'DESTAQUE', 'NOVO', 'MELHORIA', 'IMPORTANTE', 'CORREÇÃO'];

  const filteredUpdates = updates.filter(item => {
    const matchesTag = selectedTag === 'TODOS' || item.tag === selectedTag;
    const matchesQuery = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.details && item.details.some(d => d.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesTag && matchesQuery;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-graphite-900 via-graphite-800 to-black border border-white/10 p-6 sm:p-10 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-loud-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-1/3 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-loud-500/10 border border-loud-500/30 text-loud-400 text-xs font-bold uppercase tracking-wider">
              <BellRing size={14} className="animate-pulse" />
              <span>Central de Novidades & Changelog</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              O que há de novo no <span className="text-loud-400">Jhan Medeiros Analytics</span>
            </h1>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              Acompanhe em primeira mão todas as atualizações, novos recursos de análise tática, leitores de prints por IA e ferramentas competitivas de Free Fire.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAdminOpen(!isAdminOpen)}
              className="bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all"
            >
              <Plus size={14} />
              <span>{isAdminOpen ? 'Fechar Painel Admin' : 'Postar Novidade (Admin)'}</span>
            </button>
            <a
              href="https://discord.gg/YU8uTRyz2Y"
              target="_blank"
              rel="noreferrer"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
            >
              <MessageSquare size={14} />
              <span>Sugerir no Discord</span>
            </a>
          </div>
        </div>
      </div>

      {/* Admin Quick Post Accordion */}
      {isAdminOpen && (
        <div className="bg-graphite-900 border-2 border-loud-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2 text-loud-400 font-bold text-sm">
              <Sparkles size={16} />
              <span>Painel de Publicação de Novidades</span>
            </div>
            <span className="text-xs text-gray-400 font-mono">Apenas administradores</span>
          </div>

          {!adminAuthenticated ? (
            <form onSubmit={handleAdminLogin} className="flex flex-col sm:flex-row gap-3 items-center">
              <input
                type="password"
                value={adminPin}
                onChange={e => setAdminPin(e.target.value)}
                placeholder="Digite a senha de admin..."
                className="bg-black/50 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-loud-400 w-full sm:w-80"
              />
              <button
                type="submit"
                className="bg-loud-500 hover:bg-loud-400 text-black font-black text-xs px-6 py-2.5 rounded-xl transition-all w-full sm:w-auto"
              >
                Acessar
              </button>
              {errorMsg && <p className="text-red-400 text-xs">{errorMsg}</p>}
            </form>
          ) : (
            <form onSubmit={handleCreateUpdate} className="space-y-4">
              {errorMsg && <p className="text-red-400 text-xs bg-red-500/10 p-2 rounded">{errorMsg}</p>}
              {successMsg && <p className="text-emerald-400 text-xs bg-emerald-500/10 p-2 rounded">{successMsg}</p>}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Título da Novidade</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Ex: Novo Leitor de Prints Free Fire 2.0"
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-loud-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Tag / Categoria</label>
                  <select
                    value={newTag}
                    onChange={e => setNewTag(e.target.value as any)}
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-loud-400"
                  >
                    <option value="NOVO">NOVO</option>
                    <option value="DESTAQUE">DESTAQUE</option>
                    <option value="MELHORIA">MELHORIA</option>
                    <option value="IMPORTANTE">IMPORTANTE</option>
                    <option value="CORREÇÃO">CORREÇÃO</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Versão</label>
                  <input
                    type="text"
                    value={newVersion}
                    onChange={e => setNewVersion(e.target.value)}
                    placeholder="v2.8.0"
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-loud-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Link de Ação (Rota)</label>
                  <input
                    type="text"
                    value={newLinkPath}
                    onChange={e => setNewLinkPath(e.target.value)}
                    placeholder="/jogo ou /quadro-tatico"
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-loud-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Texto do Botão</label>
                  <input
                    type="text"
                    value={newLinkText}
                    onChange={e => setNewLinkText(e.target.value)}
                    placeholder="Ex: Experimentar Agora"
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-loud-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Descrição Resumida</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Explique o que essa nova funcionalidade faz..."
                  className="w-full bg-black/60 border border-white/20 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-loud-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  Detalhes / Pontos (1 por linha)
                </label>
                <textarea
                  rows={3}
                  value={newDetailsText}
                  onChange={e => setNewDetailsText(e.target.value)}
                  placeholder="Ex:&#10;• Suporte ao novo mapa Solara&#10;• Exportação em alta resolução&#10;• Modo escuro otimizado"
                  className="w-full bg-black/60 border border-white/20 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-loud-400 font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newFeatured}
                    onChange={e => setNewFeatured(e.target.checked)}
                    className="rounded bg-black border-white/20 text-loud-500 focus:ring-0"
                  />
                  <span>Destacar no topo da página</span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-loud-500 hover:bg-loud-400 text-black font-black text-xs px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  <Plus size={16} />
                  <span>{isSubmitting ? 'Publicando...' : 'Publicar Novidade'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-graphite-900/60 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
        {/* Tag Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {tagsList.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedTag === tag
                  ? 'bg-loud-500 text-black shadow-lg shadow-loud-500/20'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Pesquisar novidade, mapa, recurso..."
            className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-loud-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Updates Feed */}
      <div className="space-y-6">
        {filteredUpdates.length === 0 ? (
          <div className="text-center py-16 bg-graphite-900/40 rounded-2xl border border-white/10 p-8 space-y-3">
            <Compass className="mx-auto text-gray-500 animate-spin" size={40} />
            <h3 className="text-white font-bold text-lg">Nenhuma novidade encontrada</h3>
            <p className="text-gray-400 text-xs max-w-md mx-auto">
              Nenhuma atualização corresponde aos filtros selecionados. Tente buscar por outros termos ou selecione a categoria "TODOS".
            </p>
          </div>
        ) : (
          filteredUpdates.map((item, idx) => (
            <div
              key={item.id || idx}
              className={`relative group rounded-2xl border transition-all duration-300 p-6 sm:p-8 bg-graphite-900/80 hover:bg-graphite-900 shadow-xl ${
                item.featured 
                  ? 'border-loud-500/60 ring-1 ring-loud-500/30' 
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              {/* Featured Badge if applicable */}
              {item.featured && (
                <div className="absolute -top-3 left-6 bg-gradient-to-r from-loud-500 to-emerald-400 text-black font-black text-[10px] uppercase tracking-widest px-3 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                  <Flame size={12} />
                  <span>Destaque Recente</span>
                </div>
              )}

              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Left Content */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-black/60 border border-white/15 flex items-center justify-center shrink-0 shadow-inner">
                    {getUpdateIcon(item.iconName, item.tag)}
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border tracking-wider uppercase ${getTagBadgeStyle(item.tag)}`}>
                        {item.tag}
                      </span>
                      <span className="text-xs font-mono text-loud-400 font-bold">
                        {item.version}
                      </span>
                      <span className="text-gray-500 text-xs">•</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={12} />
                        {item.date}
                      </span>
                      {item.author && (
                        <>
                          <span className="text-gray-500 text-xs">•</span>
                          <span className="text-xs text-gray-400">
                            Por <strong className="text-gray-300">{item.author}</strong>
                          </span>
                        </>
                      )}
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold text-white group-hover:text-loud-400 transition-colors">
                      {item.title}
                    </h2>

                    <p className="text-gray-300 text-sm leading-relaxed max-w-3xl">
                      {item.description}
                    </p>

                    {/* Bullet list details if present */}
                    {item.details && item.details.length > 0 && (
                      <div className="pt-2">
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-400">
                          {item.details.map((detail, dIdx) => (
                            <li key={dIdx} className="flex items-start gap-2">
                              <CheckCircle2 size={14} className="text-loud-400 shrink-0 mt-0.5" />
                              <span className="text-gray-300">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action / Button */}
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-3 shrink-0 pt-2 md:pt-0">
                  {item.linkPath && (
                    <button
                      type="button"
                      onClick={() => onNavigate ? onNavigate(item.linkPath!) : window.location.href = item.linkPath!}
                      className="bg-loud-500 hover:bg-loud-400 text-black font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg hover:scale-105 transition-all cursor-pointer"
                    >
                      <span>{item.linkText || 'Ver Ferramenta'}</span>
                      <ArrowRight size={14} />
                    </button>
                  )}

                  {adminAuthenticated && (
                    <button
                      type="button"
                      onClick={() => handleDeleteUpdate(item.id)}
                      className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 p-1 transition-colors"
                      title="Excluir novidade"
                    >
                      <Trash2 size={14} />
                      <span className="text-[10px]">Excluir</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Roadmap & Suggestions Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="bg-graphite-900/60 border border-white/10 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Flame size={18} />
            <span>O que estamos preparando a seguir? (Roadmap)</span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            Estamos desenvolvendo novidades constantes para elevar o nível analítico da comunidade Free Fire:
          </p>
          <ul className="space-y-2 text-xs text-gray-400">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span><strong>Calculadora de Rotas com Heatmap de Mortes:</strong> Visualização de densidade de confrontos por minuto.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span><strong>Exportação Automatizada de PDF Executivo:</strong> Relatório completo pós-campeonato em 1 clique.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-loud-400" />
              <span><strong>Comparador de Desempenho de Linhas (Line A vs Line B):</strong> Gráficos de dispersão e média de abates.</span>
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-indigo-950/40 to-graphite-900/80 border border-indigo-500/20 rounded-2xl p-6 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <MessageSquare size={18} />
              <span>Tem alguma sugestão de ferramenta ou melhoria?</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              O ecossistema é construído junto com técnicos, analistas e jogadores. Se você quer ver uma funcionalidade específica aqui, envie sua ideia!
            </p>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <a
              href="https://discord.gg/YU8uTRyz2Y"
              target="_blank"
              rel="noreferrer"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
            >
              <span>Entrar no Discord</span>
              <ExternalLink size={12} />
            </a>
            <a
              href="https://www.youtube.com/@jhanmedeiros"
              target="_blank"
              rel="noreferrer"
              className="bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
            >
              <span>Canal YouTube</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
