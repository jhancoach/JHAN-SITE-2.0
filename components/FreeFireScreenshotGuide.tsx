import React, { useState } from 'react';
import { 
  Camera, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Info, 
  Copy, 
  Check, 
  Smartphone, 
  Layers, 
  Flame, 
  HelpCircle,
  Eye,
  Maximize2,
  X,
  Image as ImageIcon
} from 'lucide-react';

interface FreeFireScreenshotGuideProps {
  onLoadExampleData?: () => void;
  customExampleImage?: string;
  onCustomExampleUpload?: (file: File) => void;
}

export const FreeFireScreenshotGuide: React.FC<FreeFireScreenshotGuideProps> = ({ 
  onLoadExampleData,
  customExampleImage: externalCustomImage,
  onCustomExampleUpload 
}) => {
  const [activeTab, setActiveTab] = useState<'screen1' | 'screen2' | 'dodont'>('screen1');
  const [displayMode, setDisplayMode] = useState<'image' | 'interactive'>('image');
  const [copied, setCopied] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [localCustomImage, setLocalCustomImage] = useState<string | null>(null);

  const activeExampleImage = externalCustomImage || localCustomImage || "/freefire_example_print.jpg";

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLocalCustomImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      if (onCustomExampleUpload) {
        onCustomExampleUpload(file);
      }
    }
  };

  const copyGuideToClipboard = () => {
    const text = `📢 GUIA DE ENVIO DE PRINTS - LOUD / FREE FIRE 🎮
--------------------------------------------------
Para registrar suas estatísticas corretamente no sistema:

1. 📸 TIRE O PRINT DA TELA PÓS-PARTIDA:
   - Espere aparecer a tela final do "BOOYAH!" com a tabela do Squad.
   - Tire print nativo do celular em tela cheia horizontal.

2. 🔍 INFORMAÇÕES QUE DEVEM APARECER NO PRINT:
   ✅ Mapa (Solara, Bermuda, Purgatório, Alpine, etc.)
   ✅ Colocação (#1 Booyah, #2, #3, etc.)
   ✅ Tabela com os 4 jogadores (Nick, Kills, Assists, Dano DMG e Ressurgimento)

3. ⚠️ EVITE:
   ❌ Não corte as bordas do print.
   ❌ Não tire foto de outro celular (tire print direto do jogo).
   ❌ Não envie prints do lobby ou tela de carregamento.
--------------------------------------------------`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="bg-graphite-900 border border-loud-500/30 rounded-2xl p-4 sm:p-6 text-gray-300 space-y-5 shadow-2xl relative overflow-hidden">
      {/* Lightbox Modal for Full Size Screenshot */}
      {isZoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fade-in">
          <div className="relative max-w-5xl w-full bg-graphite-900 border border-loud-500/40 rounded-2xl overflow-hidden shadow-2xl p-2 sm:p-4">
            <div className="flex items-center justify-between pb-3 px-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="bg-loud-500 text-gray-900 text-xs font-black px-2.5 py-0.5 rounded uppercase">
                  Exemplo Oficial
                </span>
                <span className="text-white font-bold text-sm">
                  Print de Tela Inteira Pós-Partida (Booyah #3 - Solara)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-3 relative rounded-xl overflow-hidden border border-white/10 bg-black">
              <img
                src={activeExampleImage}
                alt="Exemplo Oficial de Print Free Fire"
                className="w-full h-auto object-contain max-h-[75vh]"
              />
            </div>

            <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400 px-2 pt-2 border-t border-white/10">
              <p className="flex items-center gap-1.5 text-loud-400 font-medium">
                <CheckCircle2 size={15} />
                <span>Formatos Suportados pelo OCR e IA: BR Ranqueado, CS Ranqueado, Salas LBFF / FFWS.</span>
              </p>
              {onLoadExampleData && (
                <button
                  type="button"
                  onClick={() => {
                    setIsZoomOpen(false);
                    onLoadExampleData();
                  }}
                  className="bg-loud-500 text-gray-900 hover:bg-loud-400 text-xs font-black px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <Sparkles size={14} />
                  <span>Carregar este Exemplo no Leitor</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Background glow accent */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-loud-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-loud-500 text-gray-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Camera size={12} /> Guia Visual Oficial
            </span>
            <span className="text-xs text-gray-400">Padrão Garena Free Fire</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center gap-2">
            Como Tirar o Print Certo da Tela Certa
          </h3>
          <p className="text-xs text-gray-400">
            Veja a imagem de exemplo oficial e saiba exatamente quais dados o leitor OCR extrai das suas partidas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onLoadExampleData && (
            <button
              type="button"
              onClick={onLoadExampleData}
              className="bg-loud-500/20 hover:bg-loud-500/30 text-loud-400 border border-loud-500/40 text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Sparkles size={14} />
              <span>Testar com Este Exemplo</span>
            </button>
          )}

          <button
            type="button"
            onClick={copyGuideToClipboard}
            className="bg-graphite-800 hover:bg-graphite-700 text-gray-200 border border-white/10 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            title="Copiar texto para enviar no WhatsApp ou Discord do time"
          >
            {copied ? <Check size={14} className="text-loud-400" /> : <Copy size={14} />}
            <span>{copied ? 'Copiado para o Time!' : 'Copiar Guia (Whats/Discord)'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-black/40 rounded-xl border border-white/5 relative z-10">
        <button
          type="button"
          onClick={() => setActiveTab('screen1')}
          className={`flex-1 min-w-[140px] px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'screen1'
              ? 'bg-loud-500 text-gray-900 shadow-md font-black'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Smartphone size={14} />
          <span>Tela 1: Resumo do Booyah (Ideal)</span>
          <span className="bg-black/20 text-[9px] px-1.5 py-0.5 rounded font-mono">Mais Rápida</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('screen2')}
          className={`flex-1 min-w-[140px] px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'screen2'
              ? 'bg-loud-500 text-gray-900 shadow-md font-black'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers size={14} />
          <span>Tela 2: Estatísticas Detalhadas</span>
          <span className="bg-black/20 text-[9px] px-1.5 py-0.5 rounded font-mono">Colunas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dodont')}
          className={`flex-1 min-w-[140px] px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'dodont'
              ? 'bg-loud-500 text-gray-900 shadow-md font-black'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <CheckCircle2 size={14} />
          <span>O que Fazer & O que Evitar</span>
          <span className="bg-black/20 text-[9px] px-1.5 py-0.5 rounded font-mono">Dicas</span>
        </button>
      </div>

      {/* Tab 1: Screen 1 (Resumo Pós-Partida / Booyah) */}
      {activeTab === 'screen1' && (
        <div className="space-y-4 relative z-10 animate-fade-in">
          {/* Key explanation */}
          <div className="bg-loud-500/10 border border-loud-500/30 rounded-xl p-3.5 text-xs text-gray-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Info size={18} className="text-loud-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white mb-0.5">
                  Esta é a tela principal pós-partida exibida assim que a queda termina.
                </p>
                <p className="text-gray-400">
                  Tire um print nativo do celular quando aparecer a pontuação, o <b>Emblema do Booyah</b> e a <b>Tabela do Squad</b> com os Kills, Assists, Dano e Ressurgimento.
                </p>
              </div>
            </div>

            {/* Display Switcher */}
            <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setDisplayMode('image')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  displayMode === 'image'
                    ? 'bg-loud-500 text-gray-900 font-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ImageIcon size={13} />
                <span>Imagem de Exemplo</span>
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('interactive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  displayMode === 'interactive'
                    ? 'bg-loud-500 text-gray-900 font-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Layers size={13} />
                <span>Mapeamento dos Pontos</span>
              </button>
            </div>
          </div>

          {/* Real Image & Pixel-Perfect Free Fire UI View */}
          {displayMode === 'image' && (
            <div className="space-y-3">
              {/* Exact 1:1 Pixel-Perfect Replica of User's Free Fire Screenshot */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-loud-500/50 bg-[#0c0d14] shadow-2xl p-4 sm:p-6 font-sans select-none text-white">
                {/* Background Garage Theme Styling */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#141824] via-[#090a10] to-[#050608] opacity-90 pointer-events-none" />
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm sm:text-base font-extrabold tracking-wider text-white uppercase drop-shadow">
                        BR RANQUEADO
                      </h4>
                      <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase">
                        SOLARA
                      </p>
                    </div>

                    {/* Top Center Booyah Emblem */}
                    <div className="text-center transform -translate-y-1">
                      <div className="relative inline-flex flex-col items-center justify-center">
                        {/* Gold Wing Crest */}
                        <div className="w-16 sm:w-20 h-14 sm:h-16 bg-gradient-to-b from-amber-300 via-yellow-500 to-amber-700 clip-path-hexagon flex items-center justify-center shadow-lg shadow-amber-500/30 border border-amber-200/50 p-1">
                          <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tighter">
                            3
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm font-black text-amber-300 tracking-widest uppercase mt-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] italic">
                          BOOYAH!
                        </span>
                      </div>
                    </div>

                    {/* Top Right Controls */}
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-gray-300">
                        🎁
                      </div>
                      <div className="w-7 h-7 rounded bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 font-black text-xs">
                        ⚠️
                      </div>
                    </div>
                  </div>

                  {/* Main Player Table */}
                  <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/60 shadow-xl">
                    <table className="w-full text-left text-xs font-sans">
                      <thead>
                        <tr className="text-[10px] sm:text-xs font-extrabold text-gray-300 border-b border-white/10 bg-white/5 uppercase tracking-wider">
                          <th className="py-2.5 px-3 text-center">PONTUAÇÃO <span className="inline-block bg-white/20 text-white rounded-full w-3.5 h-3.5 text-[9px] text-center ml-0.5">?</span></th>
                          <th className="py-2.5 px-3">APELIDO</th>
                          <th className="py-2.5 px-3 text-center">K</th>
                          <th className="py-2.5 px-3 text-center">A</th>
                          <th className="py-2.5 px-3 text-center">DMG</th>
                          <th className="py-2.5 px-3 text-center">RESSURGIMENTO</th>
                          <th className="py-2.5 px-3 text-center">TEMPO DE SOBREVIVÊNCIA</th>
                          <th className="py-2.5 px-3 text-center">CONQUISTAS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 font-mono text-xs sm:text-sm">
                        {/* Row 1: Nickz LOUD */}
                        <tr className="bg-black/40 hover:bg-white/5 transition-colors">
                          <td className="py-2 px-3 text-center">
                            <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-amber-400 to-yellow-600 text-black font-black text-xs rounded-md shadow border border-amber-200">
                              15.0
                            </span>
                          </td>
                          <td className="py-2 px-3 font-sans">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-md bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-base">
                                🥷
                              </div>
                              <div>
                                <div className="font-extrabold text-white text-xs sm:text-sm flex items-center gap-1">
                                  <span className="bg-amber-500 text-black text-[9px] font-black px-1 rounded">PRO</span>
                                  <span>Nickz LOUD</span>
                                </div>
                                <span className="text-[10px] text-gray-400 font-medium block">TEAM OPAM</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center font-black text-amber-400 text-base">23</td>
                          <td className="py-2 px-3 text-center font-bold text-gray-200">6</td>
                          <td className="py-2 px-3 text-center font-bold text-white">16980</td>
                          <td className="py-2 px-3 text-center font-bold text-gray-200">1</td>
                          <td className="py-2 px-3 text-center font-medium text-gray-300">14'35"</td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="bg-amber-500/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.5 rounded text-[10px]">🔥 MVP</span>
                              <span className="bg-blue-500/20 text-blue-300 border border-blue-400/40 px-1.5 py-0.5 rounded text-[10px]">💥 16k</span>
                            </div>
                          </td>
                        </tr>

                        {/* Row 2: choro7 fé! */}
                        <tr className="bg-black/40 hover:bg-white/5 transition-colors">
                          <td className="py-2 px-3 text-center">
                            <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-amber-400 to-yellow-600 text-black font-black text-xs rounded-md shadow border border-amber-200">
                              15.0
                            </span>
                          </td>
                          <td className="py-2 px-3 font-sans">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-md bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-base">
                                🌸
                              </div>
                              <div>
                                <div className="font-extrabold text-white text-xs sm:text-sm">
                                  choro7 fé!
                                </div>
                                <span className="text-[10px] text-gray-400 font-medium block">@joao7psico'</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center font-black text-amber-400 text-base">12</td>
                          <td className="py-2 px-3 text-center font-bold text-gray-200">9</td>
                          <td className="py-2 px-3 text-center font-bold text-white">4651</td>
                          <td className="py-2 px-3 text-center font-bold text-gray-200">2</td>
                          <td className="py-2 px-3 text-center font-medium text-gray-300">14'35"</td>
                          <td className="py-2 px-3 text-center">
                            <span className="bg-blue-500/20 text-blue-300 border border-blue-400/40 px-1.5 py-0.5 rounded text-[10px]">🤝 Assist</span>
                          </td>
                        </tr>

                        {/* Row 3: LOUD JOKER */}
                        <tr className="bg-black/40 hover:bg-white/5 transition-colors">
                          <td className="py-2 px-3 text-center">
                            <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-amber-400 to-yellow-600 text-black font-black text-xs rounded-md shadow border border-amber-200">
                              13.2
                            </span>
                          </td>
                          <td className="py-2 px-3 font-sans">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-md bg-yellow-500/20 border border-yellow-400/40 flex items-center justify-center text-base">
                                🐥
                              </div>
                              <div>
                                <div className="font-extrabold text-white text-xs sm:text-sm flex items-center gap-1">
                                  <span className="bg-amber-500 text-black text-[9px] font-black px-1 rounded">PRO</span>
                                  <span>LOUD JOKER</span>
                                </div>
                                <span className="text-[10px] text-gray-400 font-medium block">JOKERZINHOS</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center font-black text-amber-400 text-base">7</td>
                          <td className="py-2 px-3 text-center font-bold text-gray-200">3</td>
                          <td className="py-2 px-3 text-center font-bold text-white">2863</td>
                          <td className="py-2 px-3 text-center font-bold text-gray-200">2</td>
                          <td className="py-2 px-3 text-center font-medium text-gray-300">14'35"</td>
                          <td className="py-2 px-3 text-center">
                            <span className="bg-purple-500/20 text-purple-300 border border-purple-400/40 px-1.5 py-0.5 rounded text-[10px]">🛡️ Support</span>
                          </td>
                        </tr>

                        {/* Row 4: LOUD JHAN (SELECTED / HIGHLIGHTED BAR IN VIVID BLUE) */}
                        <tr className="bg-[#0072bc] hover:bg-[#0082d6] text-white font-bold transition-colors shadow-lg">
                          <td className="py-2.5 px-3 text-center">
                            <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-slate-700 text-white font-black text-xs rounded-md shadow border border-slate-500">
                              11.3
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-sans">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-md bg-emerald-500/30 border border-emerald-300/50 flex items-center justify-center text-base">
                                🟩
                              </div>
                              <div>
                                <div className="font-black text-white text-xs sm:text-sm tracking-wide">
                                  LOUD JHAN
                                </div>
                                <span className="text-[10px] text-cyan-100 font-medium block">SQUAD LOUD</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center font-black text-white text-base">4</td>
                          <td className="py-2.5 px-3 text-center font-black text-white">4</td>
                          <td className="py-2.5 px-3 text-center font-black text-white">1777</td>
                          <td className="py-2.5 px-3 text-center font-black text-white">0</td>
                          <td className="py-2.5 px-3 text-center font-black text-white">14'35"</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="bg-white/20 text-white border border-white/40 px-1.5 py-0.5 rounded text-[10px] font-bold">🎯 Squad</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    {/* Left ID */}
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-400 font-mono">
                      <span>📊</span>
                      <span>2090079783537920000#J42261C087C1271</span>
                    </div>

                    {/* Center Yellow ESTATÍSTICAS Button */}
                    <div>
                      <button
                        type="button"
                        onClick={onLoadExampleData}
                        className="bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs sm:text-sm px-6 py-2 rounded shadow-lg uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                      >
                        <span>ESTATÍSTICAS</span>
                        <span className="bg-black text-yellow-400 px-1.5 py-0.5 rounded text-[10px]">📊</span>
                      </button>
                    </div>

                    {/* Right White VOLTAR Button */}
                    <div>
                      <span className="bg-white text-black font-bold text-xs px-5 py-1.5 rounded uppercase tracking-wider shadow">
                        VOLTAR
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-gray-400 px-1">
                <p className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-loud-400" />
                  <span>Réplica exata da tela original do Free Fire. Este modelo é lido 100% pelo leitor OCR.</span>
                </p>
                {onLoadExampleData && (
                  <button
                    type="button"
                    onClick={onLoadExampleData}
                    className="text-loud-400 hover:text-loud-300 font-bold flex items-center gap-1 underline cursor-pointer"
                  >
                    <Sparkles size={13} />
                    <span>Carregar Dados Deste Print Exato</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Graphic Mockup of Free Fire Post-Match Screen with Interactive Callouts */}
          {displayMode === 'interactive' && (
            <div className="bg-gradient-to-b from-[#161a29] via-[#0e111d] to-[#090b12] border-2 border-loud-500/40 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden font-sans">
              {/* Top decorative bar */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                {/* Callout 1: Map & Mode */}
                <div className="relative group">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-loud-500 text-gray-900 text-xs font-black flex items-center justify-center shadow-lg animate-pulse">
                      1
                    </span>
                    <div>
                      <span className="text-[11px] font-bold text-gray-400 block tracking-wider uppercase">BR RANQUEADO</span>
                      <span className="text-base sm:text-lg font-black text-loud-400 tracking-widest">SOLARA</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-loud-300 mt-1 font-mono flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-loud-400" />
                    Ponto 1: Modo e Nome do Mapa
                  </div>
                </div>

                {/* Callout 2: Booyah Rank Badge */}
                <div className="text-center relative">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-b from-amber-500/20 to-amber-600/5 border border-amber-500/40 px-4 py-1.5 rounded-xl shadow-lg">
                    <span className="w-6 h-6 rounded-full bg-amber-400 text-gray-900 text-xs font-black flex items-center justify-center">
                      2
                    </span>
                    <div>
                      <div className="text-sm sm:text-base font-black text-amber-300 uppercase tracking-widest flex items-center justify-center gap-1">
                        <Flame size={15} className="text-amber-400" />
                        3 BOOYAH!
                      </div>
                      <span className="text-[10px] text-gray-300 font-medium">Classificação #3 (8 pts LBFF)</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-amber-300/80 mt-1 font-mono">
                    Ponto 2: Emblema e Posição Final
                  </div>
                </div>

                {/* Right indicators */}
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block font-mono">Duração</span>
                  <span className="text-xs font-bold text-white font-mono">14'35"</span>
                </div>
              </div>

              {/* Callout 3: Squad Table */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-loud-500 text-gray-900 text-xs font-black flex items-center justify-center">
                      3
                    </span>
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      Ponto 3: Tabela Completa dos 4 Jogadores (K, A, DMG, Ressurgimento)
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">4 Linhas Obrigatórias</span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/50">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[10px] font-black text-gray-400 bg-white/5 border-b border-white/10 uppercase">
                        <th className="py-2 px-3 text-center text-amber-400">Pontuação</th>
                        <th className="py-2 px-3">Apelido (Nick)</th>
                        <th className="py-2 px-3 text-center text-loud-400">K (Kills)</th>
                        <th className="py-2 px-3 text-center text-blue-400">A (Assists)</th>
                        <th className="py-2 px-3 text-right text-cyan-400">DMG (Dano)</th>
                        <th className="py-2 px-3 text-center text-pink-400">Ressurgimento</th>
                        <th className="py-2 px-3 text-right text-gray-400">Sobrevivência</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      <tr className="hover:bg-white/5">
                        <td className="py-2 px-3 text-center font-black text-amber-400 bg-amber-500/10">15.0</td>
                        <td className="py-2 px-3 font-bold text-white font-sans">
                          Nickz LOUD <span className="text-[10px] text-gray-400 font-normal block sm:inline">TEAM OPAM</span>
                        </td>
                        <td className="py-2 px-3 text-center font-black text-loud-400 text-sm bg-loud-500/10">23</td>
                        <td className="py-2 px-3 text-center text-blue-300">6</td>
                        <td className="py-2 px-3 text-right font-bold text-cyan-300">16.980</td>
                        <td className="py-2 px-3 text-center text-pink-400">1</td>
                        <td className="py-2 px-3 text-right text-gray-400 text-[11px]">14'35"</td>
                      </tr>
                      <tr className="hover:bg-white/5">
                        <td className="py-2 px-3 text-center font-black text-amber-400 bg-amber-500/10">15.0</td>
                        <td className="py-2 px-3 font-bold text-white font-sans">
                          choro7 fé! <span className="text-[10px] text-gray-400 font-normal block sm:inline">@joao7psico'</span>
                        </td>
                        <td className="py-2 px-3 text-center font-black text-loud-400 text-sm bg-loud-500/10">12</td>
                        <td className="py-2 px-3 text-center text-blue-300">9</td>
                        <td className="py-2 px-3 text-right font-bold text-cyan-300">4.651</td>
                        <td className="py-2 px-3 text-center text-pink-400">2</td>
                        <td className="py-2 px-3 text-right text-gray-400 text-[11px]">14'35"</td>
                      </tr>
                      <tr className="hover:bg-white/5">
                        <td className="py-2 px-3 text-center font-black text-amber-400 bg-amber-500/10">13.2</td>
                        <td className="py-2 px-3 font-bold text-white font-sans">
                          LOUD JOKER <span className="text-[10px] text-gray-400 font-normal block sm:inline">JOKERZINHOS</span>
                        </td>
                        <td className="py-2 px-3 text-center font-black text-loud-400 text-sm bg-loud-500/10">7</td>
                        <td className="py-2 px-3 text-center text-blue-300">3</td>
                        <td className="py-2 px-3 text-right font-bold text-cyan-300">2.863</td>
                        <td className="py-2 px-3 text-center text-pink-400">2</td>
                        <td className="py-2 px-3 text-right text-gray-400 text-[11px]">14'35"</td>
                      </tr>
                      <tr className="hover:bg-white/5">
                        <td className="py-2 px-3 text-center font-black text-gray-400 bg-gray-500/10">11.3</td>
                        <td className="py-2 px-3 font-bold text-white font-sans">LOUD JHAN</td>
                        <td className="py-2 px-3 text-center font-black text-loud-400 text-sm bg-loud-500/10">4</td>
                        <td className="py-2 px-3 text-center text-blue-300">4</td>
                        <td className="py-2 px-3 text-right font-bold text-cyan-300">1.777</td>
                        <td className="py-2 px-3 text-center text-pink-400">0</td>
                        <td className="py-2 px-3 text-right text-gray-400 text-[11px]">14'35"</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Callout 4: Footer & Match ID */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3 border-t border-white/10 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-loud-500 text-gray-900 text-[10px] font-black flex items-center justify-center">
                    4
                  </span>
                  <span className="text-gray-400 font-mono">
                    ID: <span className="text-gray-200">2090079783537920000#J42261C087C1271</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-lg font-bold text-[10px] uppercase">
                    ESTATÍSTICAS 📊
                  </span>
                  <span className="bg-white/10 text-gray-300 px-3 py-1 rounded-lg font-bold text-[10px] uppercase">
                    VOLTAR
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Screen 2 (Estatísticas Detalhadas / Colunas Coloridas) */}
      {activeTab === 'screen2' && (
        <div className="space-y-4 relative z-10 animate-fade-in">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3.5 text-xs text-gray-300 flex items-start gap-3">
            <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white mb-0.5">
                Esta tela abre quando você clica no botão amarelo "ESTATÍSTICAS 📊" no rodapé pós-partida.
              </p>
              <p className="text-gray-400">
                Ela contém todas as 8 colunas detalhadas de dano real, knockdowns, cura e taxa de headshot (capa).
              </p>
            </div>
          </div>

          {/* Visual Column Mapping Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-black/50 p-3.5 rounded-xl border border-orange-500/40 space-y-1 text-center">
              <span className="inline-block px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 font-black text-[10px] uppercase">
                1. Coluna Laranja
              </span>
              <p className="font-bold text-white text-xs">Jogador + K/D/A</p>
              <p className="text-[10px] text-gray-400 font-mono">Ex: "23/1/6" (Kills/Mortes/Assists)</p>
            </div>

            <div className="bg-black/50 p-3.5 rounded-xl border border-blue-500/40 space-y-1 text-center">
              <span className="inline-block px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-black text-[10px] uppercase">
                2. Coluna Azul
              </span>
              <p className="font-bold text-white text-xs">DMG (Dano Total)</p>
              <p className="text-[10px] text-gray-400 font-mono">Ex: 16.980, 4.651</p>
            </div>

            <div className="bg-black/50 p-3.5 rounded-xl border border-emerald-500/40 space-y-1 text-center">
              <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-black text-[10px] uppercase">
                3. Coluna Verde
              </span>
              <p className="font-bold text-white text-xs">Dano Real</p>
              <p className="text-[10px] text-gray-400 font-mono">Ex: 4.939, 1.765</p>
            </div>

            <div className="bg-black/50 p-3.5 rounded-xl border border-purple-500/40 space-y-1 text-center">
              <span className="inline-block px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-black text-[10px] uppercase">
                4. Coluna Lilás
              </span>
              <p className="font-bold text-white text-xs">Derrubados (Knocks)</p>
              <p className="text-[10px] text-gray-400 font-mono">Ex: 24, 11, 7, 4</p>
            </div>

            <div className="bg-black/50 p-3.5 rounded-xl border border-cyan-500/40 space-y-1 text-center">
              <span className="inline-block px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-black text-[10px] uppercase">
                5. Coluna Ciano
              </span>
              <p className="font-bold text-white text-xs">Cura Total</p>
              <p className="text-[10px] text-gray-400 font-mono">Ex: 1020, 935 HP</p>
            </div>

            <div className="bg-black/50 p-3.5 rounded-xl border border-yellow-500/40 space-y-1 text-center">
              <span className="inline-block px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-black text-[10px] uppercase">
                6. Coluna Amarela
              </span>
              <p className="font-bold text-white text-xs">Levantados (Revives)</p>
              <p className="text-[10px] text-gray-400 font-mono">Ex: 0, 1, 2</p>
            </div>

            <div className="bg-black/50 p-3.5 rounded-xl border border-pink-500/40 space-y-1 text-center">
              <span className="inline-block px-2 py-0.5 rounded bg-pink-500/20 text-pink-400 font-black text-[10px] uppercase">
                7. Coluna Rosa
              </span>
              <p className="font-bold text-white text-xs">Ressurgimentos</p>
              <p className="text-[10px] text-gray-400 font-mono">Ex: 1, 2, 2, 0</p>
            </div>

            <div className="bg-black/50 p-3.5 rounded-xl border border-white/40 space-y-1 text-center">
              <span className="inline-block px-2 py-0.5 rounded bg-white/20 text-white font-black text-[10px] uppercase">
                8. Coluna Branca
              </span>
              <p className="font-bold text-white text-xs">% Headshot (Capa)</p>
              <p className="text-[10px] text-gray-400 font-mono">Ex: "39.13%", "25.00%"</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Do's and Don'ts */}
      {activeTab === 'dodont' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 animate-fade-in">
          {/* O QUE FAZER ✅ */}
          <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
              <CheckCircle2 size={18} />
              <span>COMO TIRAR O PRINT CERTO ✅</span>
            </div>
            <ul className="space-y-2.5 text-xs text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">1.</span>
                <span><b>Print Nativo em Tela Cheia:</b> Tire a captura de tela direta do aparelho (ex: Power + Volume Menos) na horizontal.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">2.</span>
                <span><b>Mantenha a Imagem Completa:</b> Certifique-se de que o cabeçalho (Mapa e Booyah) e a tabela dos 4 jogadores aparecem inteiros.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">3.</span>
                <span><b>Qualidade Nítida:</b> Envie o arquivo original da galeria (PNG ou JPG sem compressão excessiva).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">4.</span>
                <span><b>Envio em Lote:</b> Você pode selecionar múltiplos prints de todas as quedas do dia de uma vez só!</span>
              </li>
            </ul>
          </div>

          {/* O QUE EVITAR ❌ */}
          <div className="bg-rose-950/30 border border-rose-500/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-rose-400 font-black text-sm">
              <XCircle size={18} />
              <span>O QUE EVITAR / ERROS COMUNS ❌</span>
            </div>
            <ul className="space-y-2.5 text-xs text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">1.</span>
                <span><b>Fotos Torta de Outro Celular:</b> Evite fotografar a tela de outro smartphone com a câmera (reflexos e distorções prejudicam o OCR).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">2.</span>
                <span><b>Prints Cortados:</b> Não recorte o print manualmente cortando o nome do mapa ou o K/A/DMG dos jogadores.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">3.</span>
                <span><b>Tela de Lobby ou Carregamento:</b> Não envie fotos do lobby ou do avião, pois não possuem a tabela com os abates.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">4.</span>
                <span><b>Prints com Menus Sobrepostos:</b> Evite tirar o print enquanto o chat ou o menu de amigos estiver aberto na frente da tabela.</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
