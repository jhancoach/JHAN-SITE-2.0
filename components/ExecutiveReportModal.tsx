import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, Download, Sparkles, Image as ImageIcon, CheckCircle2, 
  X, Palette, Eye, Crown, Crosshair, MapPin, ShieldAlert, Award,
  Upload, Layers, Share2, Printer, Check, Copy, AlertCircle, RefreshCw,
  Sliders, Lock, Globe, Building, QrCode
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CoachNote, PDFClassification, PDFLayoutStyle } from '../types';
import { ScannedMatchResult } from './ScoreboardImageScanner';
import { useBrandTheme } from '../context/BrandThemeContext';
import { DEFAULT_BRAND_PRESETS } from '../constants/brandingConstants';

export interface PostTrainingReportData {
  teamName: string;
  coachName?: string;
  date: string;
  sessionType: 'treino' | 'competicao' | 'scrim';
  lineupName?: string;
  teamLogo?: string | null;
  // Stats
  collective: {
    totalMatches: number;
    totalPoints: number;
    totalKills: number;
    avgPoints: string;
    avgKills: string;
    booyahs: number;
  };
  mapBreakdown: {
    name: string;
    matches: number;
    points: number;
    kills: number;
    avgPoints: string;
  }[];
  players: {
    name: string;
    matches: number;
    kills: number;
    deaths: number;
    assists: number;
    damage: number;
    knocks: number;
    kd: string;
    damageAvg: string;
  }[];
  // Scanned Match Details / Prints
  scannedMatches?: ScannedMatchResult[];
  // Coach Notes included in report
  coachNotes?: CoachNote[];
  // Coach Evaluation text
  coachEvaluation?: string;
  highlights?: {
    mvpKills?: string;
    mvpDamage?: string;
    bestMap?: string;
    focusNextSession?: string;
  };
}

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: PostTrainingReportData;
  availableCoachNotes?: CoachNote[];
  onUpdateReportData?: (newData: Partial<PostTrainingReportData>) => void;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  reportData: initialReportData,
  availableCoachNotes = [],
}) => {
  const { 
    brandProfile, 
    openColorManager, 
    openLogoManager, 
    setCustomColors, 
    autoDetectBrandFromTeam, 
    setPreset,
    setActiveLogo
  } = useBrandTheme();

  // Branding Customization State
  const [layoutStyle, setLayoutStyle] = useState<PDFLayoutStyle>(brandProfile.pdfBranding.layoutStyle || 'executive_dark');
  const [classification, setClassification] = useState<PDFClassification>(brandProfile.pdfBranding.classification || 'CONFIDENCIAL');
  const [customClassification, setCustomClassification] = useState(brandProfile.pdfBranding.customClassificationText || '');
  const [showWatermark, setShowWatermark] = useState(brandProfile.pdfBranding.showWatermark);
  const [watermarkText, setWatermarkText] = useState(
    brandProfile.pdfBranding.watermarkText || `${brandProfile.teamName} • PERFORMANCE REPORT`
  );
  const [showCoachSignature, setShowCoachSignature] = useState(brandProfile.pdfBranding.showCoachSignature);
  const [coachTitle, setCoachTitle] = useState(brandProfile.pdfBranding.coachTitle || 'Head Coach & Performance Analyst');
  const [coachLicense, setCoachLicense] = useState(brandProfile.pdfBranding.coachLicenseOrId || 'JHAN ANALYTICS #2026');
  const [organizationTagline, setOrganizationTagline] = useState(
    brandProfile.pdfBranding.organizationTagline || 'Divisão Profissional Free Fire • Elite Performance'
  );

  // Local editable color overrides
  const [primaryHex, setPrimaryHex] = useState(brandProfile.colors.primary);
  const [secondaryHex, setSecondaryHex] = useState(brandProfile.colors.secondary);
  const [accentHex, setAccentHex] = useState(brandProfile.colors.accent);
  const [bgHex, setBgHex] = useState(layoutStyle === 'corporate_light' ? '#ffffff' : brandProfile.colors.background);
  const [cardBgHex, setCardBgHex] = useState(layoutStyle === 'corporate_light' ? '#f8fafc' : brandProfile.colors.cardBackground);

  // Team & Content State
  const [teamName, setTeamName] = useState(initialReportData.teamName || brandProfile.teamName);
  const [coachName, setCoachName] = useState(initialReportData.coachName || 'Coach Principal');
  const [lineupName, setLineupName] = useState(initialReportData.lineupName || 'Line Titular A');
  const [teamLogo, setTeamLogo] = useState<string | null>(initialReportData.teamLogo || brandProfile.activeLogoUrl || null);
  const [sessionType, setSessionType] = useState<'treino' | 'competicao' | 'scrim'>(initialReportData.sessionType || 'treino');
  
  const [coachFeedback, setCoachFeedback] = useState(
    initialReportData.coachEvaluation || 
    'Treino consistente com boa adaptação na Safe 3. Atenção para os split drops no Kalahari e rotações atrasadas em Purgatório.'
  );
  const [focusNext, setFocusNext] = useState('Melhorar timing de chegada na Safe 2 e controle de granadas');
  
  // Selected notes to include in PDF
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>(
    availableCoachNotes.slice(0, 3).map(n => n.id)
  );

  // Options
  const [includePrints, setIncludePrints] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [activeSideTab, setActiveSideTab] = useState<'branding' | 'content' | 'notes'>('branding');

  // Generation status
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const reportContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync background when layout style toggles
  useEffect(() => {
    if (layoutStyle === 'corporate_light') {
      setBgHex('#ffffff');
      setCardBgHex('#f8fafc');
    } else {
      setBgHex(brandProfile.colors.background);
      setCardBgHex(brandProfile.colors.cardBackground);
    }
  }, [layoutStyle, brandProfile.colors]);

  if (!isOpen) return null;

  // Selected notes array
  const includedCoachNotes = availableCoachNotes.filter(n => selectedNoteIds.includes(n.id));

  // Smart Auto-Branding Matcher Action
  const handleSmartAutoBrand = () => {
    autoDetectBrandFromTeam(teamName);
    const lower = teamName.toLowerCase();
    const foundPreset = DEFAULT_BRAND_PRESETS.find(p => 
      lower.includes(p.id) || lower.includes(p.name.toLowerCase()) || lower.includes(p.teamTag.toLowerCase())
    );

    if (foundPreset) {
      setPrimaryHex(foundPreset.colors.primary);
      setSecondaryHex(foundPreset.colors.secondary);
      setAccentHex(foundPreset.colors.accent);
      if (layoutStyle !== 'corporate_light') {
        setBgHex(foundPreset.colors.background);
        setCardBgHex(foundPreset.colors.cardBackground);
      }
      if (foundPreset.logoUrl && !teamLogo) {
        setTeamLogo(foundPreset.logoUrl);
      }
      setWatermarkText(`${foundPreset.name.toUpperCase()} • PERFORMANCE & SCOUT`);
    } else {
      setWatermarkText(`${teamName.toUpperCase()} • RELATÓRIO OFICIAL`);
    }
  };

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const url = event.target.result as string;
          setTeamLogo(url);
          setActiveLogo(url);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Find MVP & top performers
  const sortedByKills = [...initialReportData.players].sort((a, b) => Number(b.kills) - Number(a.kills));
  const mvpPlayer = sortedByKills[0];
  const sortedByDamage = [...initialReportData.players].sort((a, b) => Number(b.damage) - Number(a.damage));
  const topDamagePlayer = sortedByDamage[0];
  const bestMap = [...initialReportData.mapBreakdown].sort((a, b) => Number(b.points) - Number(a.points))[0];

  // 1-Click WhatsApp / Discord Clipboard Summary
  const handleCopyClipboardSummary = () => {
    const sessionLabel = sessionType === 'competicao' ? '🏆 COMPETIÇÃO OFICIAL' : sessionType === 'scrim' ? '⚔️ SCRIM PRO' : '🎯 SESSÃO DE TREINO';
    
    let text = `*📊 RELATÓRIO EXECUTIVO - ${teamName.toUpperCase()}*\n`;
    text += `*Modalidade:* ${sessionLabel} | *Data:* ${initialReportData.date}\n`;
    text += `*Lineup:* ${lineupName} | *Coach:* ${coachName}\n`;
    text += `------------------------------------\n`;
    text += `*📈 RESULTADOS COLETIVOS:*\n`;
    text += `• Total de Quedas: ${initialReportData.collective.totalMatches}\n`;
    text += `• Pontos Totais: *${initialReportData.collective.totalPoints} pts* (Média: ${initialReportData.collective.avgPoints}/queda)\n`;
    text += `• Total de Abates: *${initialReportData.collective.totalKills} kills* (Média: ${initialReportData.collective.avgKills}/queda)\n`;
    text += `• Booyahs: *${initialReportData.collective.booyahs}x 🏆*\n`;
    text += `------------------------------------\n`;
    text += `*⭐ DESTAQUES DA SESSÃO:*\n`;
    if (mvpPlayer) text += `• 🥇 MVP de Kills: *${mvpPlayer.name}* (${mvpPlayer.kills} kills, K/D: ${mvpPlayer.kd})\n`;
    if (topDamagePlayer) text += `• 💥 Top Dano: *${topDamagePlayer.name}* (${topDamagePlayer.damage} dmg)\n`;
    if (bestMap) text += `• 🗺️ Melhor Mapa: *${bestMap.name}* (${bestMap.points} pts / ${bestMap.kills} kills)\n`;
    text += `------------------------------------\n`;
    text += `*👥 DESEMPENHO INDIVIDUAL:*\n`;
    initialReportData.players.forEach(p => {
      text += `• *${p.name}*: ${p.kills}K | ${p.deaths}D | ${p.damage} dmg | K/D: ${p.kd}\n`;
    });
    text += `------------------------------------\n`;
    text += `*📝 PARECER TÁTICO DO COACH:*\n`;
    text += `"${coachFeedback}"\n\n`;
    text += `*🎯 FOCO DO PRÓXIMO BLOCO:*\n`;
    text += `"${focusNext}"\n`;
    text += `------------------------------------\n`;
    text += `_Gerado via Jhan Medeiros eSports Analytics_ 🚀`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  // Generate and Download PDF
  const handleDownloadPdf = async () => {
    const reportElement = reportContainerRef.current;
    if (!reportElement) return;

    setIsGeneratingPdf(true);
    setPdfSuccess(false);

    try {
      // 1. Capture element to high-res canvas
      const canvas = await html2canvas(reportElement, {
        scale: 2.2, // High resolution for vector-like text
        useCORS: true,
        allowTaint: true,
        backgroundColor: bgHex,
        logging: false,
        windowWidth: 1200
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // 2. Initialize PDF in A4 portrait format (210 x 297 mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const calculatedHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // If content fits on one page, render single page; otherwise multi-page slice
      if (calculatedHeight <= pdfHeight) {
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, calculatedHeight);
      } else {
        let heightLeft = calculatedHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, calculatedHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position = heightLeft - calculatedHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, calculatedHeight);
          heightLeft -= pdfHeight;
        }
      }

      // 3. Save File with standardized name
      const safeTeam = teamName.replace(/\s+/g, '_').toUpperCase();
      const safeDate = initialReportData.date.replace(/\//g, '-');
      pdf.save(`RELATORIO_EXECUTIVO_${safeTeam}_${safeDate}.pdf`);

      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 4000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Houve um erro ao processar o PDF. Tente novamente.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const isLight = layoutStyle === 'corporate_light';
  const textColor = isLight ? '#0f172a' : '#ffffff';
  const mutedTextColor = isLight ? '#475569' : '#9ca3af';
  const tableHeaderBg = isLight ? '#e2e8f0' : `${primaryHex}15`;
  const tableRowAlt = isLight ? '#f1f5f9' : 'rgba(255,255,255,0.02)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-graphite-900 border border-white/15 rounded-3xl w-full max-w-7xl h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        
        {/* MODAL TOP HEADER */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-graphite-950/70">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-all"
              style={{ backgroundColor: `${primaryHex}20`, border: `1px solid ${primaryHex}40` }}
            >
              <FileText size={22} style={{ color: primaryHex }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-lg sm:text-xl text-white tracking-wide uppercase">
                  Smart PDF Branding & Relatório Executivo
                </h2>
                <span 
                  className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block"
                  style={{ backgroundColor: `${primaryHex}25`, color: primaryHex, border: `1px solid ${primaryHex}40` }}
                >
                  Pronto para Exportação
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Documento de alto nível para comissão técnica, diretoria e patrocinadores com branding inteligente.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 1-Click WhatsApp / Discord Clipboard */}
            <button
              onClick={handleCopyClipboardSummary}
              className="flex items-center gap-1.5 bg-graphite-800 hover:bg-graphite-700 text-gray-200 hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition-all border border-white/10 cursor-pointer"
              title="Copiar texto formatado com emojis para WhatsApp e Discord"
            >
              {copiedSummary ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              <span>{copiedSummary ? 'Copiado WhatsApp!' : 'Copiar Resumo'}</span>
            </button>

            {/* Smart Auto Brand */}
            <button
              onClick={handleSmartAutoBrand}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg"
              style={{ 
                backgroundColor: `${primaryHex}20`,
                color: primaryHex,
                border: `1px solid ${primaryHex}60`
              }}
              title="Detecta o time e alinha cores, watermark e cabeçalhos automaticamente"
            >
              <Sparkles size={14} />
              <span>Smart Branding</span>
            </button>

            {/* Export PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xl hover:scale-105 disabled:opacity-50 cursor-pointer"
              style={{ 
                backgroundColor: primaryHex,
                color: isLight ? '#ffffff' : '#09090b',
                boxShadow: `0 10px 25px -5px ${primaryHex}50`
              }}
            >
              {isGeneratingPdf ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Gerando PDF...</span>
                </>
              ) : pdfSuccess ? (
                <>
                  <Check size={16} />
                  <span>PDF Baixado!</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Exportar PDF (A4)</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* MODAL MAIN CONTENT */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* LEFT: BRANDING & CUSTOMIZATION CONTROLS */}
          <div className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-white/10 bg-graphite-950/60 p-4 sm:p-5 overflow-y-auto custom-scrollbar flex flex-col gap-5 flex-shrink-0">
            
            {/* SUB-TABS NAVIGATION */}
            <div className="flex bg-graphite-900 p-1 rounded-xl border border-white/10 text-xs font-bold">
              <button
                onClick={() => setActiveSideTab('branding')}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center uppercase tracking-wider ${
                  activeSideTab === 'branding' ? 'bg-white/15 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                🎨 Identidade
              </button>
              <button
                onClick={() => setActiveSideTab('content')}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center uppercase tracking-wider ${
                  activeSideTab === 'content' ? 'bg-white/15 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                📝 Parecer
              </button>
              <button
                onClick={() => setActiveSideTab('notes')}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center uppercase tracking-wider ${
                  activeSideTab === 'notes' ? 'bg-white/15 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                📌 Notas ({selectedNoteIds.length})
              </button>
            </div>

            {/* TAB: BRANDING CONTROLS */}
            {activeSideTab === 'branding' && (
              <div className="space-y-5">
                
                {/* 1. Layout Style Preset */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders size={14} style={{ color: primaryHex }} />
                    <span>Estilo Visual do Documento</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setLayoutStyle('executive_dark')}
                      className={`p-2 rounded-xl text-center border transition-all text-[11px] font-bold ${
                        layoutStyle === 'executive_dark' 
                          ? 'bg-white/10 border-white/40 text-white shadow' 
                          : 'bg-graphite-900 border-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      ⚡ Dark eSports
                    </button>

                    <button
                      type="button"
                      onClick={() => setLayoutStyle('corporate_light')}
                      className={`p-2 rounded-xl text-center border transition-all text-[11px] font-bold ${
                        layoutStyle === 'corporate_light' 
                          ? 'bg-white/10 border-white/40 text-white shadow' 
                          : 'bg-graphite-900 border-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      📄 Clean Light
                    </button>

                    <button
                      type="button"
                      onClick={() => setLayoutStyle('sponsor_grid')}
                      className={`p-2 rounded-xl text-center border transition-all text-[11px] font-bold ${
                        layoutStyle === 'sponsor_grid' 
                          ? 'bg-white/10 border-white/40 text-white shadow' 
                          : 'bg-graphite-900 border-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      🏆 Sponsor Pro
                    </button>
                  </div>
                </div>

                {/* 2. Quick Palette Presets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Palette size={14} style={{ color: primaryHex }} />
                      <span>Paleta da Equipe</span>
                    </label>
                    <button
                      type="button"
                      onClick={openColorManager}
                      className="text-[10px] font-bold text-gray-400 hover:text-white underline"
                    >
                      Abrir Color Manager
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {DEFAULT_BRAND_PRESETS.slice(0, 8).map(preset => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setPreset(preset.id);
                          setPrimaryHex(preset.colors.primary);
                          setSecondaryHex(preset.colors.secondary);
                          setAccentHex(preset.colors.accent);
                          if (layoutStyle !== 'corporate_light') {
                            setBgHex(preset.colors.background);
                            setCardBgHex(preset.colors.cardBackground);
                          }
                          if (preset.logoUrl && !teamLogo) {
                            setTeamLogo(preset.logoUrl);
                          }
                        }}
                        className="flex flex-col items-center p-2 rounded-xl border border-white/10 bg-graphite-900 hover:bg-graphite-800 transition-all text-center group"
                      >
                        <div 
                          className="w-5 h-5 rounded-full mb-1 shadow"
                          style={{ backgroundColor: preset.colors.primary }}
                        />
                        <span className="text-[9px] font-bold text-gray-300 truncate w-full group-hover:text-white">
                          {preset.teamTag}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Live Color Swatches Pickers */}
                <div className="space-y-2 bg-graphite-900 p-3.5 rounded-2xl border border-white/10">
                  <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block">
                    Ajuste Fino de Cores (Hex)
                  </span>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[9px] text-gray-400 block mb-1">Primária</span>
                      <div className="flex items-center gap-1.5">
                        <input 
                          type="color" 
                          value={primaryHex}
                          onChange={(e) => setPrimaryHex(e.target.value)}
                          className="w-7 h-7 rounded-lg bg-transparent border border-white/20 cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-gray-300">{primaryHex}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] text-gray-400 block mb-1">Secundária</span>
                      <div className="flex items-center gap-1.5">
                        <input 
                          type="color" 
                          value={secondaryHex}
                          onChange={(e) => setSecondaryHex(e.target.value)}
                          className="w-7 h-7 rounded-lg bg-transparent border border-white/20 cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-gray-300">{secondaryHex}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] text-gray-400 block mb-1">Destaque</span>
                      <div className="flex items-center gap-1.5">
                        <input 
                          type="color" 
                          value={accentHex}
                          onChange={(e) => setAccentHex(e.target.value)}
                          className="w-7 h-7 rounded-lg bg-transparent border border-white/20 cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-gray-300">{accentHex}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Team Logo & Emblem */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon size={14} style={{ color: primaryHex }} />
                      <span>Emblema / Logo da Equipe</span>
                    </label>
                    <button
                      type="button"
                      onClick={openLogoManager}
                      className="text-[10px] font-bold text-gray-400 hover:text-white underline"
                    >
                      Biblioteca de Logos
                    </button>
                  </div>

                  <div className="flex items-center gap-3 bg-graphite-900 p-3 rounded-2xl border border-white/10">
                    <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center p-1.5 overflow-hidden flex-shrink-0">
                      {teamLogo ? (
                        <img 
                          src={teamLogo} 
                          alt="Logo" 
                          className="w-full h-full object-contain" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <ImageIcon size={20} className="text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleLogoUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-all"
                        >
                          <Upload size={12} />
                          <span>Carregar</span>
                        </button>
                        {teamLogo && (
                          <button
                            type="button"
                            onClick={() => setTeamLogo(null)}
                            className="px-2 py-1.5 text-xs text-red-400 hover:text-red-300 font-bold"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Classification Stamp & Watermark */}
                <div className="space-y-3 bg-graphite-900 p-3.5 rounded-2xl border border-white/10">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert size={14} style={{ color: primaryHex }} />
                      <span>Classificação do Documento</span>
                    </label>
                    <select
                      value={classification}
                      onChange={(e) => setClassification(e.target.value as PDFClassification)}
                      className="w-full bg-graphite-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 font-bold uppercase"
                    >
                      <option value="CONFIDENCIAL">🔒 Confidencial • Diretoria</option>
                      <option value="USO INTERNO">🛡️ Uso Interno • Coaching Staff</option>
                      <option value="DIRETORIA">👑 Relatório Executivo Oficial</option>
                      <option value="PÚBLICO">🌐 Divulgação Geral / Torcida</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-gray-300 font-bold">Marca D'Água de Segurança</span>
                    <input 
                      type="checkbox"
                      checked={showWatermark}
                      onChange={(e) => setShowWatermark(e.target.checked)}
                      className="w-4 h-4 rounded accent-loud-500 cursor-pointer"
                    />
                  </div>

                  {showWatermark && (
                    <input 
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="Texto da marca d'água..."
                      className="w-full bg-graphite-800 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/30 uppercase"
                    />
                  )}
                </div>

              </div>
            )}

            {/* TAB: CONTENT & PARECER */}
            {activeSideTab === 'content' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Nome da Equipe</label>
                  <input 
                    type="text" 
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full bg-graphite-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold uppercase focus:outline-none focus:border-white/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Slogan / Categoria da Equipe</label>
                  <input 
                    type="text" 
                    value={organizationTagline}
                    onChange={(e) => setOrganizationTagline(e.target.value)}
                    className="w-full bg-graphite-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Lineup / Squad</label>
                    <input 
                      type="text" 
                      value={lineupName}
                      onChange={(e) => setLineupName(e.target.value)}
                      className="w-full bg-graphite-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Coach Responsável</label>
                    <input 
                      type="text" 
                      value={coachName}
                      onChange={(e) => setCoachName(e.target.value)}
                      className="w-full bg-graphite-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Parecer Técnico Geral do Treinador</label>
                  <textarea 
                    rows={4}
                    value={coachFeedback}
                    onChange={(e) => setCoachFeedback(e.target.value)}
                    className="w-full bg-graphite-900 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white/30 leading-relaxed"
                    placeholder="Escreva a avaliação tática, pontos fortes e pontos a corrigir..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Meta / Foco para a Próxima Sessão</label>
                  <input 
                    type="text" 
                    value={focusNext}
                    onChange={(e) => setFocusNext(e.target.value)}
                    className="w-full bg-graphite-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
                    placeholder="Ex: Melhorar split drop e sincronismo na Safe 4..."
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-graphite-900 rounded-xl border border-white/10">
                  <span className="text-xs text-gray-300 font-bold">Assinatura do Treinador no Rodapé</span>
                  <input 
                    type="checkbox"
                    checked={showCoachSignature}
                    onChange={(e) => setShowCoachSignature(e.target.checked)}
                    className="w-4 h-4 rounded accent-loud-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-graphite-900 rounded-xl border border-white/10">
                  <span className="text-xs text-gray-300 font-bold">Incluir Prints OCR Escaneados</span>
                  <input 
                    type="checkbox"
                    checked={includePrints}
                    onChange={(e) => setIncludePrints(e.target.checked)}
                    className="w-4 h-4 rounded accent-loud-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* TAB: COACH TACTICAL NOTES */}
            {activeSideTab === 'notes' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-300">
                    Selecione as notas do Caderno:
                  </p>
                  <span className="text-[10px] text-gray-400">{selectedNoteIds.length} selecionadas</span>
                </div>

                {availableCoachNotes.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-500 bg-graphite-900 rounded-2xl border border-white/5">
                    Nenhuma anotação tática salva no momento. Crie anotações no Caderno do Coach para incluí-las aqui.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                    {availableCoachNotes.map((note) => {
                      const isSelected = selectedNoteIds.includes(note.id);
                      return (
                        <div 
                          key={note.id}
                          onClick={() => {
                            setSelectedNoteIds(prev => 
                              isSelected ? prev.filter(id => id !== note.id) : [...prev, note.id]
                            );
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer text-left flex items-start gap-2.5 ${
                            isSelected 
                              ? 'bg-white/10 border-white/30 text-white' 
                              : 'bg-graphite-900 border-white/5 text-gray-400 hover:text-white'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-0.5 rounded accent-loud-500"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs truncate">{note.title}</p>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                              <span>🗺️ {note.map}</span>
                              {note.safeZone && <span>• 🎯 {note.safeZone}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* RIGHT: LIVE EXECUTIVE PDF PREVIEW SHEET */}
          <div className="flex-1 bg-graphite-950 p-3 sm:p-6 overflow-y-auto custom-scrollbar flex items-start justify-center">
            
            {/* A4 PAPER CONTAINER */}
            <div 
              ref={reportContainerRef}
              className="w-full max-w-[800px] rounded-2xl shadow-2xl p-6 sm:p-10 relative overflow-hidden transition-all duration-300"
              style={{ 
                backgroundColor: bgHex,
                color: textColor,
                border: isLight ? '1px solid #e2e8f0' : `1px solid ${primaryHex}35`,
                minHeight: '1100px'
              }}
            >
              
              {/* WATERMARK BACKGROUND */}
              {showWatermark && (
                <div 
                  className="absolute inset-0 pointer-events-none flex items-center justify-center select-none overflow-hidden"
                  style={{ opacity: isLight ? 0.03 : 0.04 }}
                >
                  <p 
                    className="font-display font-black text-6xl sm:text-7xl uppercase tracking-widest text-center transform -rotate-25 whitespace-nowrap"
                    style={{ color: primaryHex }}
                  >
                    {watermarkText}
                  </p>
                </div>
              )}

              {/* TOP BRANDING HEADER BAR */}
              <div 
                className="flex items-center justify-between pb-5 border-b mb-6 relative z-10"
                style={{ borderColor: isLight ? '#e2e8f0' : `${primaryHex}35` }}
              >
                {/* Team Info & Emblem */}
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center p-2 shadow-lg overflow-hidden flex-shrink-0"
                    style={{ 
                      backgroundColor: isLight ? '#f1f5f9' : `${cardBgHex}`,
                      border: `1.5px solid ${primaryHex}40` 
                    }}
                  >
                    {teamLogo ? (
                      <img 
                        src={teamLogo} 
                        alt="Logo do Time" 
                        className="w-full h-full object-contain filter drop-shadow" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div 
                        className="font-display font-black text-2xl"
                        style={{ color: primaryHex }}
                      >
                        {teamName.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h1 
                        className="font-display font-black text-2xl tracking-tight uppercase"
                        style={{ color: textColor }}
                      >
                        {teamName}
                      </h1>
                      <span 
                        className="text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                        style={{ 
                          backgroundColor: `${primaryHex}20`,
                          color: primaryHex,
                          border: `1px solid ${primaryHex}40`
                        }}
                      >
                        {sessionType === 'competicao' ? 'Competição Oficial' : sessionType === 'scrim' ? 'Scrim Pro' : 'Treino Tático'}
                      </span>
                    </div>

                    <p className="text-xs mt-0.5" style={{ color: mutedTextColor }}>
                      {organizationTagline}
                    </p>
                  </div>
                </div>

                {/* Security Stamp & Date */}
                <div className="text-right flex flex-col items-end">
                  <span 
                    className="text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest flex items-center gap-1.5 shadow"
                    style={{ 
                      backgroundColor: isLight ? '#0f172a' : `${primaryHex}20`,
                      color: isLight ? '#ffffff' : primaryHex,
                      border: isLight ? 'none' : `1px solid ${primaryHex}50`
                    }}
                  >
                    <Lock size={11} />
                    <span>{classification}</span>
                  </span>

                  <div className="text-[11px] font-mono mt-1.5" style={{ color: mutedTextColor }}>
                    <span>Data: <strong>{initialReportData.date}</strong></span>
                  </div>
                </div>
              </div>

              {/* COLLECTIVE KPIS OVERVIEW (4-BLOCKS) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 relative z-10">
                <div 
                  className="p-4 rounded-2xl border transition-all"
                  style={{ 
                    backgroundColor: cardBgHex,
                    borderColor: isLight ? '#e2e8f0' : `${primaryHex}25`
                  }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: mutedTextColor }}>
                    Pontuação Total
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <p className="font-display font-black text-3xl" style={{ color: primaryHex }}>
                      {initialReportData.collective.totalPoints}
                    </p>
                    <span className="text-xs font-bold" style={{ color: mutedTextColor }}>PTS</span>
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: mutedTextColor }}>
                    Média: {initialReportData.collective.avgPoints}/queda
                  </span>
                </div>

                <div 
                  className="p-4 rounded-2xl border transition-all"
                  style={{ 
                    backgroundColor: cardBgHex,
                    borderColor: isLight ? '#e2e8f0' : `${secondaryHex}25`
                  }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: mutedTextColor }}>
                    Total de Abates
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <p className="font-display font-black text-3xl" style={{ color: secondaryHex }}>
                      {initialReportData.collective.totalKills}
                    </p>
                    <span className="text-xs font-bold" style={{ color: mutedTextColor }}>KILLS</span>
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: mutedTextColor }}>
                    Média: {initialReportData.collective.avgKills}/queda
                  </span>
                </div>

                <div 
                  className="p-4 rounded-2xl border transition-all"
                  style={{ 
                    backgroundColor: cardBgHex,
                    borderColor: isLight ? '#e2e8f0' : `${accentHex}25`
                  }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: mutedTextColor }}>
                    Booyahs (Vitórias)
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <p className="font-display font-black text-3xl" style={{ color: accentHex }}>
                      {initialReportData.collective.booyahs}
                    </p>
                    <span className="text-xs font-bold" style={{ color: mutedTextColor }}>x 🏆</span>
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: mutedTextColor }}>
                    Taxa: {initialReportData.collective.totalMatches > 0 ? ((initialReportData.collective.booyahs / initialReportData.collective.totalMatches) * 100).toFixed(0) : 0}% vitórias
                  </span>
                </div>

                <div 
                  className="p-4 rounded-2xl border transition-all"
                  style={{ 
                    backgroundColor: cardBgHex,
                    borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'
                  }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: mutedTextColor }}>
                    Quedas Realizadas
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <p className="font-display font-black text-3xl" style={{ color: textColor }}>
                      {initialReportData.collective.totalMatches}
                    </p>
                    <span className="text-xs font-bold" style={{ color: mutedTextColor }}>MAPAS</span>
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: mutedTextColor }}>
                    Line: {lineupName}
                  </span>
                </div>
              </div>

              {/* HIGHLIGHTS STRIP */}
              <div 
                className="p-3.5 rounded-2xl border mb-6 flex flex-wrap items-center justify-between gap-3 relative z-10"
                style={{ 
                  backgroundColor: isLight ? '#f1f5f9' : `${primaryHex}10`,
                  borderColor: isLight ? '#cbd5e1' : `${primaryHex}30`
                }}
              >
                <div className="flex items-center gap-2">
                  <Crown size={18} style={{ color: primaryHex }} />
                  <span className="text-xs font-bold">
                    MVP de Abates: <strong style={{ color: primaryHex }}>{mvpPlayer?.name || 'N/A'}</strong> ({mvpPlayer?.kills || 0} kills • K/D: {mvpPlayer?.kd || '0.00'})
                  </span>
                </div>

                {topDamagePlayer && (
                  <div className="flex items-center gap-2 text-xs">
                    <Crosshair size={16} style={{ color: secondaryHex }} />
                    <span>Top Dano: <strong>{topDamagePlayer.name}</strong> ({topDamagePlayer.damage.toLocaleString()} DMG)</span>
                  </div>
                )}

                {bestMap && (
                  <div className="flex items-center gap-2 text-xs">
                    <MapPin size={16} style={{ color: accentHex }} />
                    <span>Melhor Mapa: <strong>{bestMap.name}</strong> ({bestMap.points} pts)</span>
                  </div>
                )}
              </div>

              {/* SECTION 1: MAP PERFORMANCE BREAKDOWN */}
              <div className="mb-6 relative z-10">
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="font-display font-black text-sm uppercase tracking-wider flex items-center gap-2" style={{ color: primaryHex }}>
                    <MapPin size={16} />
                    <span>Desempenho Coletivo por Mapa</span>
                  </h3>
                </div>

                <div className="rounded-xl overflow-hidden border" style={{ borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)' }}>
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr style={{ backgroundColor: tableHeaderBg, color: textColor }}>
                        <th className="p-2.5 font-bold uppercase tracking-wider">Mapa</th>
                        <th className="p-2.5 font-bold uppercase tracking-wider text-center">Quedas</th>
                        <th className="p-2.5 font-bold uppercase tracking-wider text-center">Abates</th>
                        <th className="p-2.5 font-bold uppercase tracking-wider text-center">Pontuação</th>
                        <th className="p-2.5 font-bold uppercase tracking-wider text-center">Média Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {initialReportData.mapBreakdown.map((map, idx) => (
                        <tr 
                          key={map.name} 
                          style={{ 
                            backgroundColor: idx % 2 === 0 ? 'transparent' : tableRowAlt,
                            borderTop: isLight ? '1px solid #f1f5f9' : '1px solid rgba(255,255,255,0.04)' 
                          }}
                        >
                          <td className="p-2.5 font-bold">{map.name}</td>
                          <td className="p-2.5 text-center font-mono">{map.matches}</td>
                          <td className="p-2.5 text-center font-bold" style={{ color: secondaryHex }}>{map.kills}</td>
                          <td className="p-2.5 text-center font-black" style={{ color: primaryHex }}>{map.points} pts</td>
                          <td className="p-2.5 text-center font-mono">{map.avgPoints}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 2: INDIVIDUAL PLAYER PERFORMANCE */}
              <div className="mb-6 relative z-10">
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="font-display font-black text-sm uppercase tracking-wider flex items-center gap-2" style={{ color: secondaryHex }}>
                    <Award size={16} />
                    <span>Tabela Individual de Atletas (K/D & Dano Médio)</span>
                  </h3>
                </div>

                <div className="rounded-xl overflow-hidden border" style={{ borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)' }}>
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr style={{ backgroundColor: tableHeaderBg, color: textColor }}>
                        <th className="p-2.5 font-bold uppercase tracking-wider">Atleta</th>
                        <th className="p-2.5 font-bold uppercase tracking-wider text-center">Quedas</th>
                        <th className="p-2.5 font-bold uppercase tracking-wider text-center">Kills</th>
                        <th className="p-2.5 font-bold uppercase tracking-wider text-center">Mortes</th>
                        <th className="p-2.5 font-bold uppercase tracking-wider text-center">Assists</th>
                        <th className="p-2.5 font-bold uppercase tracking-wider text-center">Dano Total</th>
                        <th className="p-2.5 font-bold uppercase tracking-wider text-center">Dano Médio</th>
                        <th className="p-2.5 font-bold uppercase tracking-wider text-center">K/D Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {initialReportData.players.map((p, idx) => (
                        <tr 
                          key={p.name + idx} 
                          style={{ 
                            backgroundColor: idx % 2 === 0 ? 'transparent' : tableRowAlt,
                            borderTop: isLight ? '1px solid #f1f5f9' : '1px solid rgba(255,255,255,0.04)' 
                          }}
                        >
                          <td className="p-2.5 font-black flex items-center gap-1.5">
                            {idx === 0 && <Crown size={12} style={{ color: primaryHex }} />}
                            <span>{p.name}</span>
                          </td>
                          <td className="p-2.5 text-center font-mono">{p.matches}</td>
                          <td className="p-2.5 text-center font-bold" style={{ color: primaryHex }}>{p.kills}</td>
                          <td className="p-2.5 text-center font-mono" style={{ color: mutedTextColor }}>{p.deaths}</td>
                          <td className="p-2.5 text-center font-mono">{p.assists}</td>
                          <td className="p-2.5 text-center font-mono font-bold">{p.damage.toLocaleString()}</td>
                          <td className="p-2.5 text-center font-mono">{p.damageAvg}</td>
                          <td className="p-2.5 text-center font-black" style={{ color: Number(p.kd) >= 2 ? primaryHex : textColor }}>
                            {p.kd}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 3: COACH EVALUATION & STRATEGIC FEEDBACK */}
              <div 
                className="p-5 rounded-2xl border mb-6 relative z-10 space-y-3"
                style={{ 
                  backgroundColor: cardBgHex,
                  borderColor: isLight ? '#cbd5e1' : `${primaryHex}30`
                }}
              >
                <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)' }}>
                  <h4 className="font-display font-black text-xs uppercase tracking-wider flex items-center gap-2" style={{ color: primaryHex }}>
                    <ShieldAlert size={14} />
                    <span>Parecer Tático do Treinador ({coachName})</span>
                  </h4>
                  <span className="text-[10px] font-mono" style={{ color: mutedTextColor }}>{coachTitle}</span>
                </div>

                <p className="text-xs leading-relaxed italic" style={{ color: textColor }}>
                  "{coachFeedback}"
                </p>

                {focusNext && (
                  <div 
                    className="p-3 rounded-xl border flex items-center gap-2 text-xs font-bold"
                    style={{ 
                      backgroundColor: isLight ? '#f1f5f9' : `${secondaryHex}10`,
                      borderColor: isLight ? '#e2e8f0' : `${secondaryHex}30`
                    }}
                  >
                    <Crosshair size={14} style={{ color: secondaryHex }} />
                    <span>Foco Principal Próximo Bloco: <span style={{ color: secondaryHex }}>{focusNext}</span></span>
                  </div>
                )}
              </div>

              {/* SECTION 4: SELECTED COACH TACTICAL NOTES */}
              {includeNotes && includedCoachNotes.length > 0 && (
                <div className="mb-6 relative z-10 space-y-3">
                  <h4 className="font-display font-black text-xs uppercase tracking-wider flex items-center gap-2" style={{ color: accentHex }}>
                    <Layers size={14} />
                    <span>Orientações Táticas Salvas do Caderno ({includedCoachNotes.length})</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {includedCoachNotes.map(note => (
                      <div 
                        key={note.id}
                        className="p-3 rounded-xl border text-xs space-y-1.5"
                        style={{ 
                          backgroundColor: cardBgHex,
                          borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)' 
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <strong className="truncate block" style={{ color: textColor }}>{note.title}</strong>
                          <span 
                            className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase"
                            style={{ backgroundColor: `${primaryHex}15`, color: primaryHex }}
                          >
                            {note.map}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-[11px] leading-relaxed" style={{ color: mutedTextColor }}>
                          {note.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 5: SCANNED OCR PRINTS PROOF (OPTIONAL) */}
              {includePrints && initialReportData.scannedMatches && initialReportData.scannedMatches.length > 0 && (
                <div className="mb-6 relative z-10 space-y-2">
                  <h4 className="font-display font-black text-xs uppercase tracking-wider flex items-center gap-2" style={{ color: textColor }}>
                    <ImageIcon size={14} style={{ color: primaryHex }} />
                    <span>Comprovação Visual OCR (Prints Escaneados)</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {initialReportData.scannedMatches.slice(0, 4).map((m, idx) => (
                      <div 
                        key={m.id || idx}
                        className="rounded-xl overflow-hidden border p-1.5 flex flex-col items-center text-center"
                        style={{ 
                          backgroundColor: cardBgHex,
                          borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)' 
                        }}
                      >
                        {m.originalImageUrl ? (
                          <img 
                            src={m.originalImageUrl} 
                            alt={`Print ${idx+1}`} 
                            className="w-full h-20 object-cover rounded-lg mb-1" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-20 bg-black/40 rounded-lg flex items-center justify-center mb-1 text-gray-500">
                            <ImageIcon size={20} />
                          </div>
                        )}
                        <span className="text-[10px] font-bold uppercase truncate w-full" style={{ color: textColor }}>
                          Queda #{idx+1} • {m.mapName}
                        </span>
                        <span className="text-[9px] font-black" style={{ color: primaryHex }}>
                          {m.rank ? `${m.rank}º Lugar` : `${m.totalPoints || 0} pts`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FOOTER & COACH SIGNATURE BLOCK */}
              <div 
                className="pt-6 border-t mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs relative z-10"
                style={{ borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)' }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs"
                    style={{ backgroundColor: `${primaryHex}20`, color: primaryHex }}
                  >
                    JM
                  </div>
                  <div>
                    <span className="font-bold block" style={{ color: textColor }}>JHAN MEDEIROS ESPORTS ANALYTICS</span>
                    <span className="text-[10px]" style={{ color: mutedTextColor }}>Sistema Oficial de Performance & Metodologia Competitiva</span>
                  </div>
                </div>

                {showCoachSignature && (
                  <div className="text-center sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0">
                    <div className="w-44 border-b pb-1 mb-1 mx-auto sm:ml-auto" style={{ borderColor: isLight ? '#94a3b8' : 'rgba(255,255,255,0.3)' }}>
                      <span className="font-display font-bold text-xs" style={{ color: textColor }}>{coachName}</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider block" style={{ color: mutedTextColor }}>
                      {coachTitle} • {coachLicense}
                    </span>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
