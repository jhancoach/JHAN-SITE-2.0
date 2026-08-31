import React, { useState, useRef } from 'react';
import { 
  Image as ImageIcon, Upload, Trash2, Check, Star, Search, X, 
  Sparkles, Download, ExternalLink, Plus, CheckCircle2, RefreshCw, Palette
} from 'lucide-react';
import { useBrandTheme } from '../context/BrandThemeContext';
import { TeamLogoItem } from '../types';

export const TeamLogoManagerModal: React.FC = () => {
  const { 
    isLogoManagerOpen, 
    closeLogoManager, 
    allLogos, 
    customLogos, 
    addCustomLogo, 
    deleteCustomLogo,
    brandProfile,
    setActiveLogo,
    autoDetectBrandFromTeam,
    openColorManager
  } = useBrandTheme();

  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [logoName, setLogoName] = useState('');
  const [logoCategory, setLogoCategory] = useState<TeamLogoItem['category']>('Meus Logos');
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isLogoManagerOpen) return null;

  const categories = ['Todos', 'LBFF & Pro League', 'FFWS Mundial', 'Emulador & Guildas', 'Meus Logos'];

  const filteredLogos = allLogos.filter(item => {
    const matchesCategory = activeCategory === 'Todos' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP, SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreviewImage(result);
      if (!logoName) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').toUpperCase();
        setLogoName(cleanName);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalUrl = uploadMode === 'file' ? previewImage : logoUrlInput.trim();
    if (!finalUrl || !logoName.trim()) {
      alert('Preencha o nome da equipe e adicione a imagem do logo.');
      return;
    }

    setIsUploading(true);
    try {
      const created = await addCustomLogo({
        name: logoName.trim().toUpperCase(),
        imageUrl: finalUrl,
        category: logoCategory
      } as any);

      // Auto set as active logo immediately
      setActiveLogo(created.imageUrl);
      autoDetectBrandFromTeam(created.name);

      setLogoName('');
      setLogoUrlInput('');
      setPreviewImage(null);
      setSuccessMessage(`Logo "${created.name}" salvo e definido como ativo!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error saving logo:', err);
      alert('Erro ao salvar o logo. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectActive = (logo: TeamLogoItem) => {
    setActiveLogo(logo.imageUrl);
    autoDetectBrandFromTeam(logo.name);
    setSuccessMessage(`Logo ativo alterado para ${logo.name}!`);
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-graphite-900 border border-white/15 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        
        {/* HEADER */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-graphite-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-loud-500/20 border border-loud-500/40 flex items-center justify-center text-loud-500 shadow-lg">
              <ImageIcon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-xl text-white tracking-wide uppercase">
                  Team Logo & Crest Manager
                </h3>
                <span className="bg-white/10 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {allLogos.length} Logos Disponíveis
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Biblioteca oficial e upload de emblemas das equipes. O logo ativo é refletido no PDF executivo, quadros táticos e cabeçalho.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                closeLogoManager();
                openColorManager();
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-graphite-800 text-gray-300 hover:text-white hover:bg-graphite-700 transition-all border border-white/10"
            >
              <Palette size={14} className="text-loud-500" />
              <span>Gerenciar Cores</span>
            </button>
            <button 
              onClick={closeLogoManager}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* NOTIFICATION TOAST */}
        {successMessage && (
          <div className="bg-loud-500/20 border-b border-loud-500/40 px-6 py-2.5 flex items-center gap-2 text-loud-400 text-xs font-bold animate-fade-in">
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ACTIVE LOGO BANNER & UPLOAD BAR */}
        <div className="p-6 border-b border-white/10 bg-graphite-950/40 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Active Logo Status Card */}
          <div className="bg-graphite-950 p-4 rounded-2xl border border-white/10 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center p-2 relative overflow-hidden flex-shrink-0">
              {brandProfile.activeLogoUrl ? (
                <img 
                  src={brandProfile.activeLogoUrl} 
                  alt="Logo Ativo" 
                  className="w-full h-full object-contain filter drop-shadow"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <ImageIcon size={28} className="text-gray-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-loud-500 uppercase tracking-widest block">Logo Ativo Global</span>
              <p className="font-bold text-sm text-white truncate">
                {brandProfile.activeLogoUrl 
                  ? (allLogos.find(l => l.imageUrl === brandProfile.activeLogoUrl)?.name || (brandProfile.teamName && !brandProfile.teamName.toLowerCase().includes('fluxo') ? brandProfile.teamName : 'LOUD')) 
                  : 'Nenhum Selecionado'}
              </p>
              {brandProfile.activeLogoUrl ? (
                <button
                  onClick={() => setActiveLogo(null)}
                  className="text-[10px] text-red-400 hover:text-red-300 font-bold mt-1 block cursor-pointer"
                >
                  Remover Logo Ativo
                </button>
              ) : (
                <span className="text-[10px] text-gray-500">Selecione um logo abaixo</span>
              )}
            </div>
          </div>

          {/* Quick Upload Form */}
          <form onSubmit={handleSaveLogo} className="md:col-span-2 bg-graphite-950 p-4 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Plus size={14} className="text-loud-500" />
                <span>Adicionar Novo Logo (Arquivo ou URL)</span>
              </span>
              <div className="flex gap-1 bg-graphite-800 p-0.5 rounded-lg border border-white/10 text-[10px]">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    uploadMode === 'file' ? 'bg-loud-500 text-graphite-950 shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Arquivo
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    uploadMode === 'url' ? 'bg-loud-500 text-graphite-950 shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Link URL
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-4">
                <input 
                  type="text" 
                  placeholder="Nome do Time (Ex: LOUD)"
                  value={logoName}
                  onChange={(e) => setLogoName(e.target.value)}
                  className="w-full bg-graphite-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-loud-500 uppercase font-bold"
                  required
                />
              </div>

              <div className="sm:col-span-5">
                {uploadMode === 'file' ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 bg-graphite-800 hover:bg-graphite-700 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-gray-300 hover:text-white transition-all truncate cursor-pointer"
                    >
                      <Upload size={14} className="text-loud-500 flex-shrink-0" />
                      <span className="truncate">{previewImage ? 'Imagem Selecionada' : 'Escolher Imagem (PNG/JPG)'}</span>
                    </button>
                  </div>
                ) : (
                  <input 
                    type="url" 
                    placeholder="https://exemplo.com/logo-loud.png"
                    value={logoUrlInput}
                    onChange={(e) => {
                      setLogoUrlInput(e.target.value);
                      setPreviewImage(e.target.value);
                    }}
                    className="w-full bg-graphite-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-loud-500"
                    required
                  />
                )}
              </div>

              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full bg-loud-500 hover:bg-loud-600 text-graphite-950 font-black px-3 py-2 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-loud-500/20"
                >
                  {isUploading ? 'Salvando...' : 'Salvar Logo'}
                </button>
              </div>
            </div>
          </form>

        </div>

        {/* SEARCH AND FILTERS */}
        <div className="p-6 pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          {/* Categories */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                  activeCategory === cat
                    ? 'bg-loud-500 text-graphite-950 shadow-lg shadow-loud-500/20 font-black'
                    : 'bg-graphite-950 text-gray-400 hover:text-white border border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text"
              placeholder="Buscar logo por nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-graphite-950 border border-white/10 rounded-full py-2 pl-9 pr-8 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-loud-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

        </div>

        {/* LOGOS GRID */}
        <div className="p-6 pt-3 overflow-y-auto custom-scrollbar flex-1">
          {filteredLogos.length === 0 ? (
            <div className="text-center py-20 text-gray-500 bg-graphite-950 rounded-2xl border border-white/5">
              <ImageIcon size={48} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-bold">Nenhum logo encontrado.</p>
              <p className="text-xs text-gray-600 mt-1">Tente outra busca ou faça o upload de um logo personalizado acima.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredLogos.map((item) => {
                const isActive = brandProfile.activeLogoUrl === item.imageUrl;
                return (
                  <div
                    key={item.id}
                    className={`group relative rounded-2xl p-3 flex flex-col items-center text-center transition-all border ${
                      isActive 
                        ? 'bg-loud-500/10 border-loud-500 ring-2 ring-loud-500/50 shadow-xl' 
                        : 'bg-graphite-950 hover:bg-graphite-800/90 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {/* Active badge */}
                    {isActive && (
                      <div className="absolute -top-2 -right-2 bg-loud-500 text-graphite-950 w-6 h-6 rounded-full flex items-center justify-center shadow-lg font-black z-10">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}

                    {/* Logo Image with transparent backdrop */}
                    <div className="w-full aspect-square rounded-xl bg-black/40 border border-white/5 p-3 mb-3 flex items-center justify-center relative overflow-hidden group-hover:bg-black/60 transition-colors">
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-contain filter drop-shadow transition-transform duration-300 group-hover:scale-110"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />

                      {/* Quick action buttons on hover */}
                      <div className="absolute inset-0 bg-graphite-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2 backdrop-blur-xs">
                        <button
                          onClick={() => handleSelectActive(item)}
                          className="w-full bg-loud-500 hover:bg-loud-600 text-graphite-950 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow"
                        >
                          Definir Ativo
                        </button>
                        
                        <div className="flex gap-1 w-full">
                          <a
                            href={item.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="flex-1 bg-white/10 hover:bg-white/20 text-white py-1 rounded-lg text-[10px] font-bold flex items-center justify-center"
                            title="Baixar imagem"
                          >
                            <Download size={12} />
                          </a>
                          {item.isCustom && (
                            <button
                              onClick={() => deleteCustomLogo(item.id)}
                              className="bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white px-2 py-1 rounded-lg text-[10px] font-bold transition-all"
                              title="Excluir logo personalizado"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Name & category */}
                    <p className="font-bold text-xs text-white truncate w-full uppercase" title={item.name}>
                      {item.name}
                    </p>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest truncate w-full mt-0.5">
                      {item.category}
                    </span>

                    {/* Set as Active Clickable Footer */}
                    <button
                      onClick={() => handleSelectActive(item)}
                      className={`mt-2 w-full py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                        isActive 
                          ? 'bg-loud-500 text-graphite-950 font-black' 
                          : 'bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white'
                      }`}
                    >
                      {isActive ? '✓ Em Uso' : 'Selecionar'}
                    </button>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-white/10 bg-graphite-950/80 flex items-center justify-between">
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Sparkles size={14} className="text-loud-500" />
            <span>Ao selecionar um logo, as cores e dados no PDF executivo são alinhados automaticamente.</span>
          </p>

          <button
            onClick={closeLogoManager}
            className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-white text-graphite-950 hover:bg-gray-200 transition-all cursor-pointer shadow-lg"
          >
            Fechar Gerenciador
          </button>
        </div>

      </div>
    </div>
  );
};
