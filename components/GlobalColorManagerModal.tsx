import React, { useState } from 'react';
import { 
  Palette, X, Check, RefreshCw, Sparkles, Copy, 
  Layers, Shield, Eye, Sliders, CheckCircle2, ArrowRight, Image as ImageIcon
} from 'lucide-react';
import { useBrandTheme } from '../context/BrandThemeContext';
import { DEFAULT_BRAND_PRESETS } from '../constants/brandingConstants';
import { BrandThemePresetId, BrandColorPalette } from '../types';

export const GlobalColorManagerModal: React.FC = () => {
  const { 
    isColorManagerOpen, 
    closeColorManager, 
    brandProfile, 
    setPreset, 
    setCustomColors,
    resetToDefaultBrand,
    openLogoManager
  } = useBrandTheme();

  const [activeTab, setActiveTab] = useState<'presets' | 'custom' | 'preview'>('presets');
  const [copiedNotification, setCopiedNotification] = useState(false);

  if (!isColorManagerOpen) return null;

  const { colors, selectedPresetId, teamName } = brandProfile;

  const handleColorChange = (key: keyof BrandColorPalette, value: string) => {
    setCustomColors({ [key]: value });
  };

  const handleCopyCss = () => {
    const cssVars = `/* JHAN ESPORTS BRANDING THEME */
:root {
  --brand-primary: ${colors.primary};
  --brand-secondary: ${colors.secondary};
  --brand-accent: ${colors.accent};
  --brand-bg: ${colors.background};
  --brand-card: ${colors.cardBackground};
  --brand-text: ${colors.textContrast};
}`;
    navigator.clipboard.writeText(cssVars);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-graphite-900 border border-white/15 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        
        {/* MODAL HEADER */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-graphite-950/60">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-all"
              style={{ backgroundColor: `${colors.primary}20`, border: `1px solid ${colors.primary}50` }}
            >
              <Palette style={{ color: colors.primary }} size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-xl text-white tracking-wide uppercase">
                  Global Color & Theme Manager
                </h3>
                <span 
                  className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                  style={{ backgroundColor: `${colors.primary}25`, color: colors.primary, border: `1px solid ${colors.primary}40` }}
                >
                  {selectedPresetId === 'custom' ? 'Custom Pro' : selectedPresetId.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Gerencie as cores primárias, contrastes e identidade visual ativa para toda a plataforma e relatórios executivos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                closeColorManager();
                openLogoManager();
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-graphite-800 text-gray-300 hover:text-white hover:bg-graphite-700 transition-all border border-white/10"
            >
              <ImageIcon size={14} />
              <span>Gerenciar Logos</span>
            </button>
            <button 
              onClick={closeColorManager}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex border-b border-white/10 bg-graphite-950/40 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'presets'
                ? 'border-loud-500 text-white bg-white/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
            style={{ borderColor: activeTab === 'presets' ? colors.primary : 'transparent' }}
          >
            <Sparkles size={14} style={{ color: activeTab === 'presets' ? colors.primary : 'currentColor' }} />
            <span>Presets Oficiais ({DEFAULT_BRAND_PRESETS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'custom'
                ? 'border-loud-500 text-white bg-white/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
            style={{ borderColor: activeTab === 'custom' ? colors.primary : 'transparent' }}
          >
            <Sliders size={14} style={{ color: activeTab === 'custom' ? colors.primary : 'currentColor' }} />
            <span>Personalizador Hex / RGB</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'preview'
                ? 'border-loud-500 text-white bg-white/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
            style={{ borderColor: activeTab === 'preview' ? colors.primary : 'transparent' }}
          >
            <Eye size={14} style={{ color: activeTab === 'preview' ? colors.primary : 'currentColor' }} />
            <span>Simulador de Componentes</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">

          {/* TAB 1: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  Selecione a identidade de uma organização de ponta:
                </p>
                <button
                  onClick={resetToDefaultBrand}
                  className="flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-white transition-colors"
                >
                  <RefreshCw size={12} />
                  <span>Restaurar LOUD Padrão</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {DEFAULT_BRAND_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => setPreset(preset.id)}
                      className={`relative flex flex-col p-4 rounded-2xl text-left transition-all border group ${
                        isSelected 
                          ? 'ring-2 shadow-xl scale-[1.02]' 
                          : 'bg-graphite-950/80 hover:bg-graphite-800/80 hover:border-white/20'
                      }`}
                      style={{
                        backgroundColor: isSelected ? `${preset.colors.cardBackground}` : undefined,
                        borderColor: isSelected ? preset.colors.primary : 'rgba(255,255,255,0.08)',
                        boxShadow: isSelected ? `0 10px 25px -5px ${preset.colors.primary}25` : undefined
                      }}
                    >
                      {/* Top row */}
                      <div className="flex items-center justify-between w-full mb-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full shadow" 
                            style={{ backgroundColor: preset.colors.primary }}
                          />
                          <span className="font-display font-bold text-sm text-white truncate max-w-[130px]">
                            {preset.name}
                          </span>
                        </div>
                        {isSelected && (
                          <div 
                            className="w-5 h-5 rounded-full flex items-center justify-center text-graphite-950 font-black text-xs"
                            style={{ backgroundColor: preset.colors.primary }}
                          >
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      {/* Color swatches preview bar */}
                      <div className="flex h-3 w-full rounded-lg overflow-hidden border border-white/10 mb-3">
                        <div className="flex-1" style={{ backgroundColor: preset.colors.primary }} title="Primária" />
                        <div className="flex-1" style={{ backgroundColor: preset.colors.secondary }} title="Secundária" />
                        <div className="flex-1" style={{ backgroundColor: preset.colors.accent }} title="Accent" />
                        <div className="flex-1" style={{ backgroundColor: preset.colors.background }} title="Fundo" />
                      </div>

                      {/* Details */}
                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                        <span>TAG: {preset.teamTag}</span>
                        <span style={{ color: preset.colors.primary }}>{preset.colors.primary}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM COLOR PICKER */}
          {activeTab === 'custom' && (
            <div className="space-y-6">
              <div className="bg-graphite-950/60 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">Criador de Paleta Pro</h4>
                  <p className="text-xs text-gray-400">Ajuste os valores hexadecimais para refletir a sua guilda ou equipe personalizada.</p>
                </div>
                <button
                  onClick={handleCopyCss}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-graphite-800 hover:bg-graphite-700 text-xs font-bold text-gray-200 border border-white/10 transition-all"
                >
                  {copiedNotification ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  <span>{copiedNotification ? 'Copiado!' : 'Copiar Variáveis CSS'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* PRIMARY COLOR */}
                <div className="bg-graphite-950 p-4 rounded-2xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.primary }} />
                      <span>Cor Primária (Destaque Principal)</span>
                    </label>
                    <span className="text-xs font-mono text-gray-400">{colors.primary}</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Usada em botões principais, títulos, bordas ativas e ícones。</p>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color"
                      value={colors.primary}
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      className="w-12 h-10 rounded-xl bg-transparent border border-white/20 cursor-pointer"
                    />
                    <input 
                      type="text"
                      value={colors.primary}
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      className="flex-1 bg-graphite-800 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-white/30"
                      placeholder="#00ff66"
                    />
                  </div>
                </div>

                {/* SECONDARY COLOR */}
                <div className="bg-graphite-950 p-4 rounded-2xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.secondary }} />
                      <span>Cor Secundária (Gradientes)</span>
                    </label>
                    <span className="text-xs font-mono text-gray-400">{colors.secondary}</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Composição de gradientes em barras de progresso e headers。</p>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color"
                      value={colors.secondary}
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      className="w-12 h-10 rounded-xl bg-transparent border border-white/20 cursor-pointer"
                    />
                    <input 
                      type="text"
                      value={colors.secondary}
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      className="flex-1 bg-graphite-800 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-white/30"
                      placeholder="#00cc52"
                    />
                  </div>
                </div>

                {/* ACCENT COLOR */}
                <div className="bg-graphite-950 p-4 rounded-2xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.accent }} />
                      <span>Cor de Realce (Glow / Highlights)</span>
                    </label>
                    <span className="text-xs font-mono text-gray-400">{colors.accent}</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Brilho nos KPIs, tags de MVP e estatísticas recordes。</p>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color"
                      value={colors.accent}
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      className="w-12 h-10 rounded-xl bg-transparent border border-white/20 cursor-pointer"
                    />
                    <input 
                      type="text"
                      value={colors.accent}
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      className="flex-1 bg-graphite-800 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-white/30"
                      placeholder="#00ff88"
                    />
                  </div>
                </div>

                {/* BACKGROUND COLOR */}
                <div className="bg-graphite-950 p-4 rounded-2xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: colors.background }} />
                      <span>Fundo da Aplicação & Relatórios</span>
                    </label>
                    <span className="text-xs font-mono text-gray-400">{colors.background}</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Base escura profunda para maximizar o contraste dos dados。</p>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color"
                      value={colors.background}
                      onChange={(e) => handleColorChange('background', e.target.value)}
                      className="w-12 h-10 rounded-xl bg-transparent border border-white/20 cursor-pointer"
                    />
                    <input 
                      type="text"
                      value={colors.background}
                      onChange={(e) => handleColorChange('background', e.target.value)}
                      className="flex-1 bg-graphite-800 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-white/30"
                      placeholder="#0a0d12"
                    />
                  </div>
                </div>

                {/* CARD BACKGROUND */}
                <div className="bg-graphite-950 p-4 rounded-2xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: colors.cardBackground }} />
                      <span>Superfície dos Cards & Painéis</span>
                    </label>
                    <span className="text-xs font-mono text-gray-400">{colors.cardBackground}</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Contêineres de partidas, jogadores e estatísticas。</p>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color"
                      value={colors.cardBackground}
                      onChange={(e) => handleColorChange('cardBackground', e.target.value)}
                      className="w-12 h-10 rounded-xl bg-transparent border border-white/20 cursor-pointer"
                    />
                    <input 
                      type="text"
                      value={colors.cardBackground}
                      onChange={(e) => handleColorChange('cardBackground', e.target.value)}
                      className="flex-1 bg-graphite-800 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-white/30"
                      placeholder="#121820"
                    />
                  </div>
                </div>

                {/* TEXT CONTRAST */}
                <div className="bg-graphite-950 p-4 rounded-2xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: colors.textContrast }} />
                      <span>Contraste de Texto Principal</span>
                    </label>
                    <span className="text-xs font-mono text-gray-400">{colors.textContrast}</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Cor do texto e números de pontuação。</p>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color"
                      value={colors.textContrast}
                      onChange={(e) => handleColorChange('textContrast', e.target.value)}
                      className="w-12 h-10 rounded-xl bg-transparent border border-white/20 cursor-pointer"
                    />
                    <input 
                      type="text"
                      value={colors.textContrast}
                      onChange={(e) => handleColorChange('textContrast', e.target.value)}
                      className="flex-1 bg-graphite-800 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-white/30"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: LIVE PREVIEW SIMULATOR */}
          {activeTab === 'preview' && (
            <div className="space-y-6">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Visualização ao vivo de como a sua paleta é renderizada nos cards e relatórios:
              </p>

              <div 
                className="p-6 rounded-3xl border transition-all space-y-6 shadow-2xl"
                style={{ 
                  backgroundColor: colors.background,
                  borderColor: colors.border
                }}
              >
                {/* Header preview */}
                <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: `${colors.primary}30` }}>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg"
                      style={{ 
                        backgroundColor: colors.primary, 
                        color: colors.background === '#ffffff' || colors.background === '#f8fafc' ? '#ffffff' : '#000000' 
                      }}
                    >
                      {teamName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-display font-black text-lg uppercase tracking-wider" style={{ color: colors.textContrast }}>
                        {teamName}
                      </h4>
                      <p className="text-xs" style={{ color: colors.mutedText }}>
                        Relatório Executivo & Estatísticas Competitivas
                      </p>
                    </div>
                  </div>

                  <span 
                    className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider"
                    style={{ 
                      backgroundColor: `${colors.primary}20`,
                      color: colors.primary,
                      border: `1px solid ${colors.primary}50`
                    }}
                  >
                    1º LUGAR BOOYAH
                  </span>
                </div>

                {/* KPI cards preview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div 
                    className="p-3.5 rounded-2xl border transition-all"
                    style={{ 
                      backgroundColor: colors.cardBackground, 
                      borderColor: `${colors.primary}25` 
                    }}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.mutedText }}>Pontos Totais</span>
                    <p className="font-display font-black text-2xl" style={{ color: colors.primary }}>94 PTS</p>
                  </div>

                  <div 
                    className="p-3.5 rounded-2xl border transition-all"
                    style={{ 
                      backgroundColor: colors.cardBackground, 
                      borderColor: `${colors.secondary}25` 
                    }}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.mutedText }}>Abates (Kills)</span>
                    <p className="font-display font-black text-2xl" style={{ color: colors.secondary }}>48 KILLS</p>
                  </div>

                  <div 
                    className="p-3.5 rounded-2xl border transition-all"
                    style={{ 
                      backgroundColor: colors.cardBackground, 
                      borderColor: `${colors.accent}25` 
                    }}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.mutedText }}>Média / Queda</span>
                    <p className="font-display font-black text-2xl" style={{ color: colors.accent }}>15.6</p>
                  </div>

                  <div 
                    className="p-3.5 rounded-2xl border transition-all"
                    style={{ 
                      backgroundColor: colors.cardBackground, 
                      borderColor: 'rgba(255,255,255,0.1)' 
                    }}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.mutedText }}>Vitórias (Booyahs)</span>
                    <p className="font-display font-black text-2xl" style={{ color: colors.textContrast }}>3x 🏆</p>
                  </div>
                </div>

                {/* Interactive button sample */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button 
                    className="px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg transition-transform hover:scale-105"
                    style={{ 
                      backgroundColor: colors.primary, 
                      color: '#09090b',
                      boxShadow: `0 8px 20px -4px ${colors.primary}40`
                    }}
                  >
                    Botão de Ação Primária
                  </button>

                  <button 
                    className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all"
                    style={{ 
                      backgroundColor: 'transparent',
                      color: colors.primary,
                      borderColor: colors.primary
                    }}
                  >
                    Botão Contorno (Outline)
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-white/10 bg-graphite-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <CheckCircle2 size={16} style={{ color: colors.primary }} />
            <span>As alterações são aplicadas e salvas automaticamente em tempo real.</span>
          </div>

          <button
            onClick={closeColorManager}
            className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-white text-graphite-950 hover:bg-gray-200 transition-all cursor-pointer shadow-lg"
          >
            Concluir & Aplicar
          </button>
        </div>

      </div>
    </div>
  );
};
