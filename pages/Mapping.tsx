
import React, { useState, useRef, useEffect } from 'react';
import { 
  Map as MapIcon, Plus, Download, Printer, Share2, 
  Trash2, Copy, Move, RefreshCw, Type, Image as ImageIcon,
  PenTool, MousePointer, ZoomIn, ZoomOut, FileText, ArrowRight, Eraser, Edit2, Upload,
  Settings, Check, X, Layers, Palette, Maximize
} from 'lucide-react';
import { MAPPING_MAPS } from '../constants';
import { downloadDivAsImage } from '../utils';

// --- TYPES ---

type LabelType = 'text' | 'logo';
type ColorType = 'white' | 'yellow' | 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'black';
type ArrowStyle = 'line' | 'simple' | 'filled';

interface MapLabel {
  id: number;
  type: LabelType;
  content: string;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  color: ColorType;
  borderColor: 'black' | 'white' | 'none';
  borderWidth: 'sm' | 'md' | 'lg';
  scale: number;
}

interface DrawingPath {
  id: number;
  type: 'freehand' | 'line' | 'arrow';
  arrowStyle: ArrowStyle;
  points: { x: number; y: number }[]; // Percentages
  color: ColorType;
  strokeWidth: number;
}

interface MapState {
  labels: MapLabel[];
  drawings: DrawingPath[];
  notes: string;
}

// Default state structure
const defaultMapState: MapState = {
  labels: [],
  drawings: [],
  notes: ''
};

const COLORS: { id: ColorType, hex: string }[] = [
  { id: 'white', hex: '#ffffff' },
  { id: 'yellow', hex: '#eab308' },
  { id: 'red', hex: '#ef4444' },
  { id: 'blue', hex: '#3b82f6' },
  { id: 'green', hex: '#22c55e' },
  { id: 'purple', hex: '#a855f7' },
  { id: 'orange', hex: '#f97316' },
  { id: 'black', hex: '#000000' },
];

const STROKE_WIDTHS = [2, 4, 6, 8, 12];

const Mapping: React.FC = () => {
  // Global State
  const [selectedMap, setSelectedMap] = useState<string>(Object.keys(MAPPING_MAPS)[0]);
  const [data, setData] = useState<Record<string, MapState>>(() => {
    const initial: Record<string, MapState> = {};
    Object.keys(MAPPING_MAPS).forEach(key => initial[key] = { ...defaultMapState });
    return initial;
  });

  // Presentation / Export State
  const [presentationTitle, setPresentationTitle] = useState('Análise Tática');
  const [presentationSubtitle, setPresentationSubtitle] = useState('Estratégias e Rotações');
  const [watermarkText, setWatermarkText] = useState('@jhanmedeiros');
  const [showWatermark, setShowWatermark] = useState(true);
  const [showBorder, setShowBorder] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Tools State
  const [zoom, setZoom] = useState(1);
  const [activeTool, setActiveTool] = useState<'move' | 'draw' | 'arrow' | 'eraser'>('move');
  
  // Style State
  const [selectedColor, setSelectedColor] = useState<ColorType>('white');
  const [selectedStrokeWidth, setSelectedStrokeWidth] = useState(4);
  const [selectedArrowStyle, setSelectedArrowStyle] = useState<ArrowStyle>('filled');
  const [selectedTextBorder, setSelectedTextBorder] = useState<'black' | 'white' | 'none'>('black');
  
  // Inputs
  const [inputType, setInputType] = useState<LabelType>('text');
  const [inputText, setInputText] = useState('');
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);
  
  // Interactive State
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number, y: number }[]>([]);
  const [isDraggingLabel, setIsDraggingLabel] = useState<number | null>(null);

  // --- HELPERS ---

  const getCurrentMapData = () => data[selectedMap];

  const updateCurrentMap = (updates: Partial<MapState>) => {
    setData(prev => ({
      ...prev,
      [selectedMap]: { ...prev[selectedMap], ...updates }
    }));
  };

  const getPercentageCoords = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  // --- ACTIONS: LABELS ---

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedLogo(ev.target?.result as string);
        setInputType('logo');
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const addLabel = () => {
    if (inputType === 'text' && !inputText.trim()) return;
    if (inputType === 'logo' && !uploadedLogo) return;

    const currentLabels = getCurrentMapData().labels;
    if (currentLabels.length >= 25) {
      alert("Limite de itens por mapa atingido.");
      return;
    }

    const newLabel: MapLabel = {
      id: Date.now(),
      type: inputType,
      content: inputType === 'text' ? inputText.trim() : uploadedLogo!,
      x: 50,
      y: 50,
      color: selectedColor,
      borderColor: selectedTextBorder,
      borderWidth: 'md',
      scale: 1
    };

    updateCurrentMap({ labels: [...currentLabels, newLabel] });
    if (inputType === 'text') setInputText('');
  };

  const updateLabel = (id: number, updates: Partial<MapLabel>) => {
      const labels = getCurrentMapData().labels.map(l => l.id === id ? { ...l, ...updates } : l);
      updateCurrentMap({ labels });
  };

  const deleteLabel = (id: number) => {
    updateCurrentMap({ labels: getCurrentMapData().labels.filter(l => l.id !== id) });
  };

  const copyLabelsToMap = (targetMap: string) => {
      if (targetMap === selectedMap) return;
      if (!confirm(`Copiar todos os nomes de ${selectedMap} para ${targetMap}? Isso substituirá os nomes existentes lá.`)) return;
      
      const currentLabels = getCurrentMapData().labels;
      // Deep copy labels with new IDs to avoid reference issues
      const newLabels = currentLabels.map((l, idx) => ({ ...l, id: Date.now() + idx }));
      
      setData(prev => ({
          ...prev,
          [targetMap]: {
              ...prev[targetMap],
              labels: newLabels
          }
      }));
      alert(`Nomes copiados para ${targetMap}!`);
  };

  // --- ACTIONS: DRAWING & INTERACTION ---

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      // Prevent scrolling on mobile while drawing
      if ((isDrawing || isDraggingLabel !== null) && e.cancelable) {
          e.preventDefault(); 
      }

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const coords = getPercentageCoords(clientX, clientY);

      if (isDraggingLabel !== null) {
        updateCurrentMap({
          labels: getCurrentMapData().labels.map(l => l.id === isDraggingLabel ? { ...l, x: coords.x, y: coords.y } : l)
        });
      } else if (isDrawing) {
        setCurrentPath(prev => [...prev, coords]);
      }
    };

    const handleUp = () => {
      if (isDraggingLabel !== null) setIsDraggingLabel(null);
      
      if (isDrawing) {
        setIsDrawing(false);
        if (currentPath.length > 1) {
          const newDrawing: DrawingPath = {
            id: Date.now(),
            type: activeTool === 'draw' ? 'freehand' : 'arrow',
            arrowStyle: activeTool === 'draw' ? 'line' : selectedArrowStyle, // Freehand is always line
            points: currentPath,
            color: selectedColor,
            strokeWidth: selectedStrokeWidth
          };
          updateCurrentMap({ drawings: [...getCurrentMapData().drawings, newDrawing] });
        }
        setCurrentPath([]);
      }
    };

    if (isDraggingLabel !== null || isDrawing) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDraggingLabel, isDrawing, currentPath, activeTool, selectedColor, selectedMap, data, selectedStrokeWidth, selectedArrowStyle]);

  const startInteraction = (e: React.MouseEvent | React.TouchEvent, type: 'draw' | 'drag', id?: number) => {
    // Only block standard touch actions if we are drawing or moving
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (type === 'drag' && id) {
        setIsDraggingLabel(id);
    } else if (type === 'draw') {
        if (activeTool === 'move' || activeTool === 'eraser') return;
        setIsDrawing(true);
        setCurrentPath([getPercentageCoords(clientX, clientY)]);
    }
  };

  const deleteDrawing = (id: number) => {
    if (activeTool === 'eraser') {
      updateCurrentMap({ drawings: getCurrentMapData().drawings.filter(d => d.id !== id) });
    }
  };

  const clearDrawings = () => {
      if(confirm('Limpar apenas os desenhos deste mapa? Os nomes permanecerão.')) {
          updateCurrentMap({ drawings: [] });
      }
  };

  // --- EXPORT (PDF) ---

  const generatePDF = async () => {
    setIsExporting(true);
    // Give React time to render the hidden container
    setTimeout(async () => {
        try {
            const { jsPDF } = (window as any).jspdf;
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [1920, 1080]
            });

            // 1. Render Cover Page
            const coverNode = document.getElementById('pdf-cover');
            if (coverNode) {
                const coverCanvas = await (window as any).html2canvas(coverNode, { scale: 1, backgroundColor: '#09090b', useCORS: true });
                pdf.addImage(coverCanvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 1920, 1080);
            }

            // 2. Render Maps
            const mapNodes = document.querySelectorAll('.map-export-node');
            // Convert NodeList to Array to use for...of loop with async/await
            for (let i = 0; i < mapNodes.length; i++) {
                const node = mapNodes[i] as HTMLElement;
                pdf.addPage([1920, 1080], 'landscape');
                
                // Important: Use high scale but then fit to PDF page size
                const canvas = await (window as any).html2canvas(node, {
                    scale: 1, // Already 1920x1080 in DOM
                    backgroundColor: '#09090b',
                    useCORS: true,
                    logging: false
                });
                pdf.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 1920, 1080);
            }

            pdf.save('Apresentacao_Tatica_JhanMedeiros.pdf');
        } catch (error) {
            console.error(error);
            alert("Erro ao gerar PDF.");
        } finally {
            setIsExporting(false);
        }
    }, 1500);
  };

  // --- RENDERERS ---

  const renderArrowHead = (p1: {x: number, y: number}, p2: {x: number, y: number}, color: string, filled: boolean) => {
      // Calculate angle
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const angle = Math.atan2(dy, dx);
      
      // Arrow head size (in percentage roughly)
      const headLen = 1.5; 

      const x1 = p2.x - headLen * Math.cos(angle - Math.PI / 6);
      const y1 = p2.y - headLen * Math.sin(angle - Math.PI / 6);
      const x2 = p2.x - headLen * Math.cos(angle + Math.PI / 6);
      const y2 = p2.y - headLen * Math.sin(angle + Math.PI / 6);

      const points = `${p2.x},${p2.y} ${x1},${y1} ${x2},${y2}`;

      return (
          <polygon 
            points={points}
            fill={filled ? color : 'none'}
            stroke={color}
            strokeWidth="0.4"
            style={{ vectorEffect: 'non-scaling-stroke' }}
          />
      );
  };

  const renderMapCanvas = (mapKey: string, isExport: boolean) => {
      const mapState = data[mapKey];
      const mapImg = MAPPING_MAPS[mapKey];

      return (
          <div className={`relative w-full h-full bg-black overflow-hidden ${isExport && showBorder ? 'border-[20px] border-gray-900' : ''}`}>
              <img src={mapImg} className="w-full h-full object-cover pointer-events-none select-none" />
              
              {/* SVG Layer */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
                  {mapState.drawings.map(d => {
                      const pointsStr = d.points.map(p => `${p.x},${p.y}`).join(' ');
                      const colorHex = COLORS.find(c => c.id === d.color)?.hex || '#fff';
                      
                      // For eraser interaction, we draw a wider invisible line behind
                      return (
                          <g key={d.id} onClick={() => deleteDrawing(d.id)} style={{ pointerEvents: activeTool === 'eraser' && !isExport ? 'stroke' : 'none', cursor: activeTool === 'eraser' ? 'crosshair' : 'default' }}>
                              {/* Hit area for eraser */}
                              {!isExport && <polyline points={pointsStr} fill="none" stroke="transparent" strokeWidth="20" style={{ vectorEffect: 'non-scaling-stroke' }} />}
                              
                              {/* Visible line */}
                              <polyline 
                                points={pointsStr}
                                fill="none"
                                stroke={colorHex}
                                strokeWidth={d.strokeWidth * (isExport ? 0.3 : 0.3)} // Adjust scale for SVG coord system
                                style={{ vectorEffect: 'non-scaling-stroke' }}
                              />
                              
                              {/* Arrow Head */}
                              {d.type === 'arrow' && d.points.length > 1 && 
                                renderArrowHead(
                                    d.points[d.points.length - 2], 
                                    d.points[d.points.length - 1], 
                                    colorHex, 
                                    d.arrowStyle === 'filled'
                                )
                              }
                          </g>
                      )
                  })}
                  
                  {/* Current Drawing Preview */}
                  {isDrawing && selectedMap === mapKey && !isExport && (
                      <polyline 
                        points={currentPath.map(p => `${p.x},${p.y}`).join(' ')}
                        fill="none"
                        stroke={COLORS.find(c => c.id === selectedColor)?.hex || '#fff'}
                        strokeWidth={selectedStrokeWidth * 0.3}
                        style={{ vectorEffect: 'non-scaling-stroke' }}
                      />
                  )}
              </svg>

              {/* HTML Layer (Labels) */}
              {mapState.labels.map(label => {
                  const colorHex = COLORS.find(c => c.id === label.color)?.hex;
                  const borderStyle = label.borderColor === 'black' ? '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' 
                                    : label.borderColor === 'white' ? '2px 2px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff' 
                                    : 'none';

                  return (
                      <div
                        key={label.id}
                        style={{ 
                            top: `${label.y}%`, 
                            left: `${label.x}%`,
                            transform: 'translate(-50%, -50%)',
                            zIndex: 20
                        }}
                        className="absolute group select-none flex items-center"
                      >
                          {/* Drag Handle (Mobile Friendly) - Only visible in move mode */}
                          {!isExport && activeTool === 'move' && (
                              <div 
                                onMouseDown={(e) => startInteraction(e, 'drag', label.id)}
                                onTouchStart={(e) => startInteraction(e, 'drag', label.id)}
                                className="absolute -top-6 left-1/2 -translate-x-1/2 bg-brand-500 text-black p-1 rounded-full cursor-move opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-md"
                              >
                                  <Move size={12} />
                              </div>
                          )}

                          {label.type === 'text' ? (
                              <input 
                                value={label.content}
                                onChange={(e) => updateLabel(label.id, { content: e.target.value })}
                                disabled={isExport || activeTool !== 'move'}
                                className="bg-transparent font-black uppercase whitespace-nowrap text-center outline-none"
                                style={{ 
                                    color: colorHex,
                                    textShadow: borderStyle,
                                    fontSize: isExport ? '32px' : '16px', // Scale for export
                                    width: `${label.content.length + 1}ch`
                                }}
                              />
                          ) : (
                              <img 
                                src={label.content}
                                className="rounded-full border-2 border-white shadow-lg object-cover pointer-events-none"
                                style={{ 
                                    width: isExport ? '100px' : '50px', 
                                    height: isExport ? '100px' : '50px' 
                                }}
                              />
                          )}
                      </div>
                  )
              })}

              {/* Watermark */}
              {isExport && showWatermark && (
                  <div className="absolute bottom-4 right-6 z-50 bg-black/50 px-3 py-1 rounded backdrop-blur-sm">
                      <p className="text-white/80 font-bold uppercase tracking-widest text-xl">{watermarkText}</p>
                  </div>
              )}

              {/* Title Overlay (For Export) */}
              {isExport && (
                  <div className="absolute top-6 left-6 z-50">
                      <h2 className="text-5xl font-black text-white drop-shadow-lg uppercase italic">{mapKey}</h2>
                      {mapState.notes && (
                          <div className="mt-4 bg-black/80 border-l-4 border-brand-500 p-4 max-w-2xl rounded-r-xl backdrop-blur-md">
                              <p className="text-white text-xl leading-snug">{mapState.notes}</p>
                          </div>
                      )}
                  </div>
              )}
          </div>
      )
  };

  return (
    <div className="animate-fade-in pb-20 select-none">
      <div className="max-w-[1600px] mx-auto space-y-4 px-2 md:px-4">
        
        {/* Header & Main Toolbar */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-center sticky top-20 z-40">
           <div className="text-center xl:text-left">
              <h1 className="text-2xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-yellow-200">
                Mapeamento Tático
              </h1>
           </div>

           {/* Toolbar Controls */}
           <div className="flex flex-wrap justify-center gap-3">
              {/* Tool Mode */}
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                 <button onClick={() => setActiveTool('move')} className={`p-2 rounded-md ${activeTool === 'move' ? 'bg-white dark:bg-gray-700 text-brand-500 shadow' : 'text-gray-500'}`} title="Mover (Use o manípulo)">
                    <Move size={20} />
                 </button>
                 <button onClick={() => setActiveTool('draw')} className={`p-2 rounded-md ${activeTool === 'draw' ? 'bg-white dark:bg-gray-700 text-brand-500 shadow' : 'text-gray-500'}`} title="Desenho Livre">
                    <PenTool size={20} />
                 </button>
                 <button onClick={() => setActiveTool('arrow')} className={`p-2 rounded-md ${activeTool === 'arrow' ? 'bg-white dark:bg-gray-700 text-brand-500 shadow' : 'text-gray-500'}`} title="Criar Setas">
                    <ArrowRight size={20} />
                 </button>
                 <button onClick={() => setActiveTool('eraser')} className={`p-2 rounded-md ${activeTool === 'eraser' ? 'bg-white dark:bg-gray-700 text-red-500 shadow' : 'text-gray-500'}`} title="Borracha (Clique na linha)">
                    <Eraser size={20} />
                 </button>
              </div>

              {/* Style Controls */}
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg px-3">
                  {/* Colors */}
                  <div className="flex -space-x-1">
                    {COLORS.map(c => (
                        <button
                        key={c.id}
                        onClick={() => setSelectedColor(c.id)}
                        className={`w-5 h-5 rounded-full border border-gray-600 ${selectedColor === c.id ? 'ring-2 ring-brand-500 z-10 scale-125' : 'hover:scale-110 hover:z-10'}`}
                        style={{ backgroundColor: c.hex }}
                        />
                    ))}
                  </div>
                  
                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

                  {/* Stroke Width */}
                  <input 
                    type="range" min="1" max="15" 
                    value={selectedStrokeWidth} 
                    onChange={(e) => setSelectedStrokeWidth(parseInt(e.target.value))}
                    className="w-16 accent-brand-500"
                    title="Espessura da linha"
                  />

                  {/* Arrow Style */}
                  <div className="flex border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
                      <button onClick={() => setSelectedArrowStyle('line')} className={`p-1 ${selectedArrowStyle === 'line' ? 'bg-brand-500 text-black' : ''}`} title="Linha"><i className="block w-4 h-0.5 bg-current"></i></button>
                      <button onClick={() => setSelectedArrowStyle('simple')} className={`p-1 ${selectedArrowStyle === 'simple' ? 'bg-brand-500 text-black' : ''}`} title="Seta Simples"><ArrowRight size={14}/></button>
                      <button onClick={() => setSelectedArrowStyle('filled')} className={`p-1 ${selectedArrowStyle === 'filled' ? 'bg-brand-500 text-black' : ''}`} title="Seta Cheia"><ArrowRight size={14} fill="currentColor"/></button>
                  </div>
              </div>

              {/* Zoom */}
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                 <button onClick={() => setZoom(Math.max(1, zoom - 0.25))} className="p-2 text-gray-500 hover:text-white"><ZoomOut size={18} /></button>
                 <span className="p-2 text-xs font-bold w-10 text-center" onDoubleClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</span>
                 <button onClick={() => setZoom(Math.min(4, zoom + 0.25))} className="p-2 text-gray-500 hover:text-white"><ZoomIn size={18} /></button>
              </div>
           </div>

           {/* Export */}
           <div className="flex gap-2">
              <button 
                onClick={() => downloadDivAsImage('mapping-canvas', `mapa-${selectedMap}`)}
                className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-xl"
                title="Baixar Mapa Atual (PNG)"
              >
                 <Download size={20} />
              </button>
              <button 
                onClick={generatePDF} 
                className="bg-brand-500 hover:bg-brand-600 text-gray-900 px-4 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20"
              >
                 <FileText size={20} /> Baixar PDF
              </button>
           </div>
        </div>

        {/* Map Selection Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {Object.keys(MAPPING_MAPS).map((mapName) => (
            <button
              key={mapName}
              onClick={() => setSelectedMap(mapName)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-sm transition-all border-2 ${
                selectedMap === mapName 
                ? 'bg-gray-900 border-brand-500 text-white' 
                : 'bg-white dark:bg-gray-800 border-transparent text-gray-500'
              }`}
            >
              {mapName}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
           {/* CANVAS CONTAINER */}
           <div className="flex-1 flex flex-col gap-4">
               <div className="bg-gray-950 rounded-2xl border border-gray-800 relative overflow-hidden shadow-2xl h-[500px] md:h-[650px] flex flex-col">
                  {/* Status Bar */}
                  <div className="absolute top-4 left-4 z-30 flex gap-2 pointer-events-none">
                      <span className="bg-black/70 backdrop-blur px-3 py-1 rounded text-xs text-white/90 border-l-2 border-brand-500 uppercase font-bold">
                          {activeTool === 'move' ? 'Modo: Mover' : activeTool === 'draw' ? 'Modo: Desenhar' : activeTool === 'arrow' ? 'Modo: Setas' : 'Modo: Apagar'}
                      </span>
                  </div>

                  {/* Canvas Scroll Area */}
                  <div 
                    className="flex-1 overflow-auto custom-scrollbar relative flex items-center justify-center bg-gray-900/50 touch-none"
                    style={{ touchAction: activeTool === 'move' ? 'auto' : 'none' }} // Disable browser scroll on canvas when drawing
                  >
                     <div 
                        id="mapping-canvas"
                        ref={canvasRef}
                        className="relative transition-transform duration-200 origin-center bg-black"
                        style={{ 
                            width: '1280px', 
                            height: '720px', 
                            transform: `scale(${zoom})`,
                            cursor: activeTool === 'draw' || activeTool === 'arrow' ? 'crosshair' : 'default'
                        }}
                        onMouseDown={(e) => startInteraction(e, 'draw')}
                        onTouchStart={(e) => startInteraction(e, 'draw')}
                     >
                        {renderMapCanvas(selectedMap, false)}
                     </div>
                  </div>
               </div>
               
               {/* Quick Map Actions */}
               <div className="flex flex-wrap gap-2 justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                   <div className="flex gap-2">
                       <button onClick={clearDrawings} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1">
                           <Eraser size={14} /> Limpar Desenhos
                       </button>
                       <button onClick={() => updateCurrentMap({ labels: [], drawings: [], notes: '' })} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1">
                           <Trash2 size={14} /> Limpar Tudo
                       </button>
                   </div>
                   
                   {/* Copy Names Dropdown */}
                   <div className="flex items-center gap-2">
                       <span className="text-xs text-gray-500 font-bold uppercase">Copiar nomes para:</span>
                       <select 
                          className="bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm outline-none cursor-pointer"
                          onChange={(e) => {
                              if(e.target.value) {
                                  copyLabelsToMap(e.target.value);
                                  e.target.value = ''; // reset
                              }
                          }}
                        >
                           <option value="">Selecionar Mapa...</option>
                           {Object.keys(MAPPING_MAPS).filter(m => m !== selectedMap).map(m => (
                               <option key={m} value={m}>{m}</option>
                           ))}
                       </select>
                   </div>
               </div>
           </div>

           {/* SIDEBAR */}
           <div className="w-full lg:w-80 flex flex-col gap-4">
              
              {/* Add Item Panel */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
                 <h3 className="font-bold text-xs uppercase text-gray-500 mb-2">Adicionar Item</h3>
                 <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                    <button onClick={() => setInputType('text')} className={`flex-1 py-1.5 text-xs font-bold rounded ${inputType === 'text' ? 'bg-white dark:bg-gray-700 shadow text-brand-500' : 'text-gray-500'}`}>Texto</button>
                    <button onClick={() => setInputType('logo')} className={`flex-1 py-1.5 text-xs font-bold rounded ${inputType === 'logo' ? 'bg-white dark:bg-gray-700 shadow text-brand-500' : 'text-gray-500'}`}>Logo</button>
                 </div>

                 {inputType === 'text' ? (
                    <div className="space-y-2">
                       <div className="flex gap-2">
                           <input 
                              value={inputText}
                              onChange={(e) => setInputText(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && addLabel()}
                              placeholder="Nome..."
                              className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500"
                           />
                           <button onClick={addLabel} className="bg-brand-500 text-gray-900 p-2 rounded-lg hover:bg-brand-600"><Plus size={18}/></button>
                       </div>
                       
                       {/* Text Border Settings */}
                       <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-2 rounded-lg">
                           <span className="text-xs text-gray-500">Borda:</span>
                           <div className="flex gap-1">
                               <button onClick={() => setSelectedTextBorder('none')} className={`px-2 py-0.5 text-xs rounded border ${selectedTextBorder === 'none' ? 'bg-gray-300 dark:bg-gray-600 border-gray-400' : 'border-transparent'}`}>Sem</button>
                               <button onClick={() => setSelectedTextBorder('black')} className={`px-2 py-0.5 text-xs rounded border bg-black text-white ${selectedTextBorder === 'black' ? 'border-brand-500' : 'border-transparent'}`}>Preta</button>
                               <button onClick={() => setSelectedTextBorder('white')} className={`px-2 py-0.5 text-xs rounded border bg-white text-black ${selectedTextBorder === 'white' ? 'border-brand-500' : 'border-transparent'}`}>Branca</button>
                           </div>
                       </div>
                    </div>
                 ) : (
                    <div>
                        <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            {uploadedLogo ? <img src={uploadedLogo} className="h-16 object-contain" /> : <div className="text-center text-gray-500"><Upload className="mx-auto mb-1" size={16}/><span className="text-xs">Upload</span></div>}
                            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                        </label>
                        <button onClick={addLabel} disabled={!uploadedLogo} className="w-full mt-2 bg-brand-500 hover:bg-brand-600 text-gray-900 py-2 rounded-lg font-bold text-sm">Adicionar Logo</button>
                    </div>
                 )}
              </div>

              {/* Notes */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col h-40">
                  <h3 className="font-bold text-gray-500 uppercase text-xs mb-2">Anotações ({selectedMap})</h3>
                  <textarea 
                    className="flex-1 w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs resize-none outline-none focus:border-brand-500"
                    placeholder="Estratégias..."
                    value={getCurrentMapData().notes}
                    onChange={(e) => updateCurrentMap({ notes: e.target.value })}
                  />
              </div>

              {/* Export Settings */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
                  <h3 className="font-bold text-gray-500 uppercase text-xs">Configuração da Apresentação</h3>
                  <input 
                    type="text" placeholder="Título da Capa" 
                    value={presentationTitle} onChange={(e) => setPresentationTitle(e.target.value)}
                    className="w-full text-xs p-2 rounded bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
                  />
                  <div className="flex items-center justify-between">
                      <span className="text-xs">Marca d'água</span>
                      <button onClick={() => setShowWatermark(!showWatermark)} className={`w-8 h-4 rounded-full ${showWatermark ? 'bg-brand-500' : 'bg-gray-600'} relative transition-colors`}>
                          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${showWatermark ? 'left-4.5' : 'left-0.5'}`}></div>
                      </button>
                  </div>
                  {showWatermark && (
                      <input 
                        type="text" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)}
                        className="w-full text-xs p-2 rounded bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
                      />
                  )}
                  <div className="flex items-center justify-between">
                      <span className="text-xs">Borda na Imagem</span>
                      <button onClick={() => setShowBorder(!showBorder)} className={`w-8 h-4 rounded-full ${showBorder ? 'bg-brand-500' : 'bg-gray-600'} relative transition-colors`}>
                          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${showBorder ? 'left-4.5' : 'left-0.5'}`}></div>
                      </button>
                  </div>
              </div>

           </div>
        </div>
      </div>

      {/* HIDDEN CONTAINER FOR HIGH-RES EXPORT */}
      {isExporting && (
          <div id="pdf-export-container" className="fixed top-0 left-0 bg-black z-[9999]" style={{ width: '1920px', height: '1080px', visibility: 'hidden' }}>
              
              {/* COVER PAGE */}
              <div id="pdf-cover" className="w-[1920px] h-[1080px] bg-gray-950 flex flex-col items-center justify-center relative overflow-hidden border-[20px] border-gray-900">
                  <div className="absolute inset-0 bg-[url('https://i.ibb.co/mCS1fCxY/Whats-App-Image-2025-10-26-at-08-14-03.jpg')] opacity-10 bg-cover bg-center blur-sm"></div>
                  <div className="z-10 text-center space-y-6">
                      <h1 className="text-8xl font-black text-brand-500 uppercase tracking-tighter drop-shadow-2xl">{presentationTitle}</h1>
                      <div className="h-2 w-64 bg-white mx-auto rounded-full"></div>
                      <h2 className="text-5xl text-white font-thin uppercase tracking-widest">{presentationSubtitle}</h2>
                  </div>
                  <div className="absolute bottom-10 text-gray-500 font-mono text-xl uppercase">Gerado por Jhan Medeiros Analytics</div>
              </div>

              {/* MAPS */}
              {Object.keys(MAPPING_MAPS).map(mapKey => (
                  <div key={mapKey} className="map-export-node w-[1920px] h-[1080px] bg-gray-900 relative overflow-hidden">
                      {renderMapCanvas(mapKey, true)}
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

export default Mapping;
