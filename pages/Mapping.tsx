
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Map as MapIcon, Plus, Download, Trash2, Move, 
  Type, Image as ImageIcon, MousePointer, 
  Circle, Square, Minus, ArrowRight, Eraser, 
  PenTool, Save, FolderOpen, Check, X, Globe, PlusCircle,
  ZoomIn, ZoomOut, Maximize, Edit2, Palette,
  Eye, FileText, Printer, Share2, Archive, Lock
} from 'lucide-react';
import { MAPPING_MAPS } from '../constants';
import { jsPDF } from "jspdf";
import JSZip from "jszip";

// --- TYPES ---

type ToolType = 'select' | 'freehand' | 'line' | 'arrow' | 'circle' | 'circle-outline' | 'rect' | 'text' | 'eraser';

interface DrawElement {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  w?: number;
  h?: number;
  points?: {x: number, y: number}[];
  color: string;
  strokeWidth: number;
  text?: string;
  filled?: boolean;
}

interface ItemPosition {
    x: number;
    y: number;
}

interface ItemStyle {
    color: string;
    strokeColor: string;
    fontSizeScale: number; // multiplier relative to base size
}

interface MapItem {
  id: string;
  type: 'text' | 'logo';
  content: string;
  scale: number;
  style?: ItemStyle; // Style is optional for backward compatibility
  // Stores position for EACH map independently. 
  positions: Record<string, ItemPosition>; 
}

interface ProjectState {
  name: string;
  map: string; // Last active map
  drawings: Record<string, DrawElement[]>; // Drawings per map
  items: MapItem[]; // Global items list
}

// --- CONSTANTS ---

const DRAWING_COLORS = [
  '#ffffff', // White
  '#eab308', // Brand Yellow
  '#ef4444', // Red
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#000000', // Black
];

const NAME_COLORS = [
  { hex: '#ffffff', label: 'Branco' },
  { hex: '#ef4444', label: 'Vermelho' },
  { hex: '#eab308', label: 'Amarelo' },
  { hex: '#22c55e', label: 'Verde' },
  { hex: '#3b82f6', label: 'Azul' },
  { hex: '#ec4899', label: 'Rosa' },
  { hex: '#f97316', label: 'Laranja' },
  { hex: '#a855f7', label: 'Roxo' },
  { hex: '#06b6d4', label: 'Ciano' },
];

const STROKE_COLORS = [
  { hex: '#000000', label: 'Preto' },
  { hex: '#ffffff', label: 'Branco' },
  { hex: '#ef4444', label: 'Vermelho' },
  { hex: '#3b82f6', label: 'Azul' },
];

const ASPECT_RATIO = 16 / 9; 

const Mapping: React.FC = () => {
  // --- STATE ---
  
  // Canvas State
  const [currentMap, setCurrentMap] = useState<string>(''); 
  const [mapZoom, setMapZoom] = useState<number>(1);
  
  // Store drawings PER MAP key
  const [drawingsPerMap, setDrawingsPerMap] = useState<Record<string, DrawElement[]>>({});
  
  // Items are Global, but have coordinates inside them
  const [items, setItems] = useState<MapItem[]>([]); 

  // Tool State
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [selectedColor, setSelectedColor] = useState<string>('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  
  // Item Appearance State (Defaults for new items)
  const [nameColor, setNameColor] = useState<string>('#ffffff');
  const [nameStroke, setNameStroke] = useState<string>('#000000');
  const [nameSize, setNameSize] = useState<number>(1.5); // 1.5vw default
  
  // Inputs
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'text' | 'logo'>('text');
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);
  const [addToAllMaps, setAddToAllMaps] = useState(false); 

  // Project Management & Export
  const [projectName, setProjectName] = useState('');
  const [presentationTitle, setPresentationTitle] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false); // Functions as Project Control Panel
  const [savedProjects, setSavedProjects] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Refs for Interaction
  const canvasRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const activeToolRef = useRef(activeTool); 
  const currentShapeIdRef = useRef<string | null>(null); 
  const dragItemRef = useRef<{id: string, startX: number, startY: number} | null>(null);

  // Sync ref with state
  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  // --- INIT & UTILS ---

  useEffect(() => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('tactical_proj_'));
    setSavedProjects(keys.map(k => k.replace('tactical_proj_', '')));
  }, []);

  const getCurrentElements = () => {
      return currentMap ? (drawingsPerMap[currentMap] || []) : [];
  };

  const getCoords = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    // Calculations remain valid even with CSS transform scale because rect scales
    const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));
    return { x, y };
  }, []);

  // --- INTERACTION HANDLERS (GLOBAL) ---

  const handleGlobalMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!currentMap) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    const { x, y } = getCoords(clientX, clientY);

    if (activeToolRef.current === 'select' && dragItemRef.current) {
        if (e.cancelable) e.preventDefault();
        setItems(prev => prev.map(it => {
            if (it.id === dragItemRef.current?.id) {
                return {
                    ...it,
                    positions: {
                        ...it.positions,
                        [currentMap]: { x, y } 
                    }
                };
            }
            return it;
        }));
        return;
    }

    if (isDrawingRef.current) {
         if (e.cancelable) e.preventDefault();

         if (activeToolRef.current === 'eraser') {
            const eraserThreshold = 3 / mapZoom; 
            
            setDrawingsPerMap(prevMap => {
                const currentEls = prevMap[currentMap] || [];
                const filtered = currentEls.filter(el => {
                    if (el.type === 'freehand' && el.points) {
                        const isHit = el.points.some(p => Math.hypot(p.x - x, p.y - y) < eraserThreshold);
                        return !isHit;
                    }
                    const distStart = Math.hypot(el.x - x, el.y - y);
                    const centerX = el.x + (el.w || 0) / 2;
                    const centerY = el.y + (el.h || 0) / 2;
                    const distCenter = Math.hypot(centerX - x, centerY - y);
                    return distStart > eraserThreshold && distCenter > eraserThreshold; 
                });
                return { ...prevMap, [currentMap]: filtered };
            });

            setItems(prevItems => prevItems.map(item => {
                const pos = item.positions[currentMap];
                if (!pos) return item; 
                const dist = Math.hypot(pos.x - x, pos.y - y);
                if (dist < 5) {
                    const newPositions = { ...item.positions };
                    delete newPositions[currentMap];
                    return { ...item, positions: newPositions };
                }
                return item;
            }).filter(item => Object.keys(item.positions).length > 0)); 

            return;
         }

         const currentId = currentShapeIdRef.current;
         if (!currentId) return;

         setDrawingsPerMap(prevMap => {
             const currentEls = prevMap[currentMap] || [];
             const updatedEls = currentEls.map(el => {
                 if (el.id !== currentId) return el;

                 if (el.type === 'freehand') {
                     return { ...el, points: [...(el.points || []), {x, y}] };
                 } else {
                     return { ...el, w: x - el.x, h: y - el.y };
                 }
             });
             return { ...prevMap, [currentMap]: updatedEls };
         });
    }
  }, [getCoords, currentMap, mapZoom]);

  const handleGlobalUp = useCallback(() => {
    isDrawingRef.current = false;
    dragItemRef.current = null;
    currentShapeIdRef.current = null;
    
    window.removeEventListener('mousemove', handleGlobalMove);
    window.removeEventListener('mouseup', handleGlobalUp);
    window.removeEventListener('touchmove', handleGlobalMove);
    window.removeEventListener('touchend', handleGlobalUp);
  }, [handleGlobalMove]);

  const startInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!currentMap) return;
    if (activeTool === 'select') return;
    if (e.cancelable) e.preventDefault(); 

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const { x, y } = getCoords(clientX, clientY);

    if (activeTool === 'text') {
        const text = prompt("Digite o texto:");
        if (text) {
            const newEl: DrawElement = {
                id: Date.now().toString(),
                type: 'text',
                x, y,
                color: selectedColor,
                strokeWidth: 16,
                text
            };
            setDrawingsPerMap(prev => ({
                ...prev,
                [currentMap]: [...(prev[currentMap] || []), newEl]
            }));
        }
        return;
    }

    isDrawingRef.current = true;
    
    if (activeTool !== 'eraser') {
        const newId = Date.now().toString();
        currentShapeIdRef.current = newId;
        
        const newEl: DrawElement = {
            id: newId,
            type: activeTool,
            x, y,
            w: 0, h: 0,
            points: activeTool === 'freehand' ? [{x, y}] : undefined,
            color: selectedColor,
            strokeWidth: strokeWidth,
            filled: activeTool === 'circle'
        };

        setDrawingsPerMap(prev => ({
            ...prev,
            [currentMap]: [...(prev[currentMap] || []), newEl]
        }));
    }

    window.addEventListener('mousemove', handleGlobalMove, { passive: false });
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchmove', handleGlobalMove, { passive: false });
    window.addEventListener('touchend', handleGlobalUp);
  };

  // --- ACTIONS: ITEMS ---

  const addItem = () => {
    if (!currentMap) {
        alert("Selecione um mapa primeiro.");
        return;
    }
    if (newItemType === 'text' && !newItemName.trim()) return;
    if (newItemType === 'logo' && !uploadedLogo) return;

    if (items.length >= 25) {
        alert("Limite de itens atingido.");
        return;
    }

    const initialPositions: Record<string, ItemPosition> = {};
    if (addToAllMaps) {
        Object.keys(MAPPING_MAPS).forEach(mapKey => {
            initialPositions[mapKey] = { x: 50, y: 50 };
        });
    } else {
        initialPositions[currentMap] = { x: 50, y: 50 };
    }

    const newItem: MapItem = {
      id: Date.now().toString(),
      type: newItemType,
      content: newItemType === 'text' ? newItemName : uploadedLogo!,
      scale: 1,
      style: {
          color: nameColor,
          strokeColor: nameStroke,
          fontSizeScale: nameSize
      },
      positions: initialPositions
    };

    setItems(prev => [...prev, newItem]);
    if (newItemType === 'text') setNewItemName('');
  };

  const importItemToMap = (itemId: string) => {
      if (!currentMap) return;
      setItems(prev => prev.map(item => {
          if (item.id === itemId) {
              return {
                  ...item,
                  positions: {
                      ...item.positions,
                      [currentMap]: { x: 50, y: 50 } 
                  }
              };
          }
          return item;
      }));
  };

  const editItemName = (itemId: string, currentName: string) => {
      const newName = prompt("Editar nome:", currentName);
      if (newName !== null && newName.trim() !== "") {
          setItems(prev => prev.map(item => item.id === itemId ? { ...item, content: newName } : item));
      }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedLogo(ev.target?.result as string);
        setNewItemType('logo');
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const startDragItem = (e: React.MouseEvent | React.TouchEvent, id: string) => {
      if (activeTool !== 'select') return;
      e.stopPropagation(); 
      if (e.cancelable) e.preventDefault(); 
      dragItemRef.current = { id, startX: 0, startY: 0 };
      window.addEventListener('mousemove', handleGlobalMove, { passive: false });
      window.addEventListener('mouseup', handleGlobalUp);
      window.addEventListener('touchmove', handleGlobalMove, { passive: false });
      window.addEventListener('touchend', handleGlobalUp);
  };

  const deleteItem = (id: string, force = false) => {
      if (!currentMap) return;
      if (force || activeTool === 'eraser' || confirm("Remover este item deste mapa?")) {
          setItems(prev => prev.map(item => {
              if (item.id !== id) return item;
              const newPositions = { ...item.positions };
              delete newPositions[currentMap];
              return { ...item, positions: newPositions };
          }).filter(item => Object.keys(item.positions).length > 0)); 
      }
  };

  const resetItemPosition = (id: string) => {
    if (!currentMap) return;
    setItems(prev => prev.map(item => {
        if (item.id !== id) return item;
        return {
            ...item,
            positions: {
                ...item.positions,
                [currentMap]: { x: 50, y: 50 }
            }
        };
    }));
  };

  // --- ACTIONS: EXPORT & PREVIEW ---

  const canExport = () => {
    const textItems = items.filter(i => i.type === 'text' && !!i.positions[currentMap]);
    return textItems.length >= 2;
  };

  const generateCanvas = async (): Promise<HTMLCanvasElement | null> => {
      const element = document.getElementById('tactical-map');
      if (!element) return null;
      try {
          // Temporarily remove transform to capture full quality
          const originalTransform = element.style.transform;
          element.style.transform = 'none';
          
          const canvas = await (window as any).html2canvas(element, {
              backgroundColor: '#09090b',
              useCORS: true,
              scale: 2
          });
          
          element.style.transform = originalTransform;
          return canvas;
      } catch (err) {
          console.error(err);
          return null;
      }
  };

  const handlePreview = async () => {
      if (!canExport()) {
          alert("Adicione pelo menos 2 nomes de times para visualizar.");
          return;
      }
      setIsExporting(true);
      const canvas = await generateCanvas();
      if (canvas) {
          setPreviewImage(canvas.toDataURL('image/png'));
      }
      setIsExporting(false);
  };

  const handleDownloadImage = async () => {
      if (!canExport()) return;
      setIsExporting(true);
      const canvas = await generateCanvas();
      if (canvas) {
          const link = document.createElement('a');
          link.download = `mapa-${currentMap}-${new Date().getTime()}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
      }
      setIsExporting(false);
  };

  const handleDownloadPDF = async () => {
      if (!canExport()) return;
      setIsExporting(true);
      const canvas = await generateCanvas();
      
      if (canvas) {
          const doc = new jsPDF({ orientation: 'landscape' });
          
          // Cover Page
          if (presentationTitle) {
             doc.setFillColor(9, 9, 11); // Dark background
             doc.rect(0, 0, 297, 210, 'F');
             
             doc.setTextColor(234, 179, 8); // Brand Yellow
             doc.setFontSize(40);
             doc.setFont("helvetica", "bold");
             doc.text(presentationTitle.toUpperCase(), 148.5, 95, { align: 'center' });
             
             doc.setTextColor(255, 255, 255);
             doc.setFontSize(14);
             doc.setFont("helvetica", "normal");
             doc.text(`Mapa: ${currentMap}`, 148.5, 115, { align: 'center' });
             
             doc.addPage();
          }

          // Image Page
          const imgData = canvas.toDataURL('image/png');
          const imgProps = doc.getImageProperties(imgData);
          const pdfWidth = doc.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          
          doc.setFillColor(9, 9, 11);
          doc.rect(0, 0, 297, 210, 'F');
          
          // Center vertically
          const y = (210 - pdfHeight) / 2;
          doc.addImage(imgData, 'PNG', 0, y, pdfWidth, pdfHeight);
          
          doc.save(`${presentationTitle || 'apresentacao'}.pdf`);
      }
      setIsExporting(false);
  };

  const handleExportZIP = async () => {
      if (!canExport()) return;
      setIsExporting(true);
      
      const zip = new JSZip();
      
      // Add current map image
      const canvas = await generateCanvas();
      if (canvas) {
          const imgData = canvas.toDataURL('image/png').split(',')[1];
          zip.file(`${currentMap}.png`, imgData, { base64: true });
      }

      // Add Project Data
      const projectData = {
          name: projectName || 'Projeto Sem Nome',
          map: currentMap,
          drawings: drawingsPerMap,
          items: items,
          date: new Date().toISOString()
      };
      zip.file("projeto_dados.json", JSON.stringify(projectData, null, 2));

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${projectName || 'projeto'}.zip`;
      link.click();
      
      setIsExporting(false);
  };

  const handlePrint = async () => {
      if (!canExport()) return;
      setIsExporting(true);
      const canvas = await generateCanvas();
      if (canvas) {
          const win = window.open('', '_blank');
          if (win) {
              win.document.write(`
                <html>
                  <head><title>Imprimir Mapa</title></head>
                  <body style="margin:0; display:flex; justify-content:center; align-items:center; height:100vh; background: #000;">
                    <img src="${canvas.toDataURL()}" style="max-width:100%; max-height:100%;" />
                    <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
                  </body>
                </html>
              `);
              win.document.close();
          }
      }
      setIsExporting(false);
  };

  // --- ACTIONS: PROJECTS ---

  const saveProject = () => {
      if (!projectName.trim()) {
          alert("Digite um nome para o projeto.");
          return;
      }
      const state: ProjectState = {
          name: projectName,
          map: currentMap,
          drawings: drawingsPerMap,
          items: items
      };
      localStorage.setItem(`tactical_proj_${projectName}`, JSON.stringify(state));
      setSavedProjects(prev => prev.includes(projectName) ? prev : [...prev, projectName]);
      alert("Projeto Salvo!");
      setShowSaveModal(false);
  };

  const loadProject = (name: string) => {
      const raw = localStorage.getItem(`tactical_proj_${name}`);
      if (raw) {
          const state: ProjectState = JSON.parse(raw);
          if (Array.isArray(state.drawings)) {
             setDrawingsPerMap({ [state.map]: state.drawings });
          } else {
             setDrawingsPerMap(state.drawings || {});
          }
          setCurrentMap(state.map);
          setItems(state.items || []);
          setProjectName(state.name);
          // Don't close modal, let user use export tools
      }
  };

  const clearCanvas = () => {
      if (confirm(`Limpar desenhos do mapa ${currentMap}?`)) {
          setDrawingsPerMap(prev => ({
              ...prev,
              [currentMap]: []
          }));
      }
  };

  // --- RENDERERS ---

  const renderArrow = (x1: number, y1: number, x2: number, y2: number, color: string, width: number) => {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLen = 1.5; 
      const endX1 = x2 - headLen * Math.cos(angle - Math.PI / 6);
      const endY1 = y2 - headLen * Math.sin(angle - Math.PI / 6);
      const endX2 = x2 - headLen * Math.cos(angle + Math.PI / 6);
      const endY2 = y2 - headLen * Math.sin(angle + Math.PI / 6);

      return (
          <g>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={width} vectorEffect="non-scaling-stroke" />
              <polygon points={`${x2},${y2} ${endX1},${endY1} ${endX2},${endY2}`} fill={color} />
          </g>
      );
  };

  const currentElements = getCurrentElements();
  const visibleItems = items.filter(i => !!i.positions[currentMap]);
  const availableToImport = items.filter(i => !i.positions[currentMap]);
  const hasMinTeams = canExport();

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-gray-950 text-white animate-fade-in">
        
        {/* --- LEFT SIDEBAR (CONTROLS) --- */}
        <div className="w-80 flex flex-col border-r border-gray-800 bg-gray-900 overflow-y-auto custom-scrollbar z-40">
            {/* Control Panel / Project Panel */}
            <div className="p-4 border-b border-gray-800">
                <h2 className="text-xl font-bold text-brand-500 mb-4">Controles</h2>
                <div className="flex gap-2 bg-gray-800 p-1 rounded-lg mb-4">
                     {/* We use showSaveModal state to toggle the 'Project' view, mimicking tabs */}
                     <button onClick={() => setShowSaveModal(false)} className={`flex-1 py-2 rounded text-xs font-bold transition-colors ${!showSaveModal ? 'bg-brand-500 text-black' : 'text-gray-400 hover:text-white'}`}>
                        Mapa / Desenho
                     </button>
                     <button onClick={() => setShowSaveModal(true)} className={`flex-1 py-2 rounded text-xs font-bold transition-colors ${showSaveModal ? 'bg-brand-500 text-black' : 'text-gray-400 hover:text-white'}`}>
                        Projeto
                     </button>
                </div>

                {/* PROJECT PANEL CONTENT */}
                {showSaveModal ? (
                    <div className="space-y-4 animate-fade-in">
                        {/* 1. Save / Load Section */}
                        <div className="space-y-2">
                             <input type="text" placeholder="Nome do projeto" value={projectName} onChange={e => setProjectName(e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-xs text-white focus:border-brand-500 outline-none" />
                             <button onClick={saveProject} className="w-full bg-brand-500 text-black py-2.5 rounded font-bold text-xs flex items-center justify-center gap-2">
                                <Save size={14}/> Salvar Projeto
                             </button>
                             
                             {/* Load List Dropdown-ish */}
                             {savedProjects.length > 0 && (
                                <div className="bg-gray-950 border border-gray-800 rounded mt-2 max-h-32 overflow-y-auto custom-scrollbar">
                                    <p className="text-[10px] text-gray-500 px-2 py-1 sticky top-0 bg-gray-950 font-bold border-b border-gray-800">CARREGAR PROJETO</p>
                                    {savedProjects.map(p => (
                                        <button key={p} onClick={() => loadProject(p)} className="w-full text-left text-xs p-2 hover:bg-gray-800 flex items-center gap-2 truncate text-gray-300">
                                            <FolderOpen size={10} className="text-brand-500 shrink-0"/> {p}
                                        </button>
                                    ))}
                                </div>
                             )}
                        </div>

                        <div className="h-px bg-gray-800 my-2"></div>

                        {/* 2. Export / Presentation Section */}
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Título da Apresentação</label>
                                <input 
                                    type="text" 
                                    placeholder="Ex: Liga LBFF - Semana 1" 
                                    value={presentationTitle} 
                                    onChange={e => setPresentationTitle(e.target.value)} 
                                    className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-xs text-white focus:border-brand-500 outline-none" 
                                />
                            </div>

                            {/* Options */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-300">Marca d'água</span>
                                    <div className="text-[10px] bg-gray-800 px-2 py-0.5 rounded text-gray-500">Auto</div>
                                </div>
                                <div className="bg-gray-950 border border-gray-800 rounded p-2 text-xs text-gray-500 italic">
                                    @jhanmedeiros
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-300">Fundo nos nomes</span>
                                <div className="w-8 h-4 bg-brand-500 rounded-full relative cursor-pointer opacity-50"><div className="absolute right-0.5 top-0.5 bg-white w-3 h-3 rounded-full"></div></div>
                            </div>
                            
                            {/* Warning if validation fails */}
                            {!hasMinTeams && (
                                <div className="bg-red-900/20 border border-red-900/50 p-2 rounded text-[10px] text-red-400 font-bold flex items-center gap-2">
                                    <Lock size={12}/> Adicione pelo menos 2 nomes de times para liberar os downloads.
                                </div>
                            )}

                            {/* Actions Grid */}
                            <div className={`space-y-2 ${!hasMinTeams ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                                <button onClick={handlePreview} className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white py-2.5 rounded font-bold text-xs flex items-center justify-center gap-2">
                                    <Eye size={14}/> Preview antes de Baixar
                                </button>
                                
                                <button onClick={handleDownloadImage} className="w-full bg-yellow-700 hover:bg-yellow-600 text-white py-2.5 rounded font-bold text-xs flex items-center justify-center gap-2 shadow-lg">
                                    <Download size={14}/> Baixar Imagem Atual
                                </button>

                                <button onClick={handleDownloadPDF} className="w-full bg-yellow-800 hover:bg-yellow-700 text-white py-2.5 rounded font-bold text-xs flex items-center justify-center gap-2">
                                    <FileText size={14}/> Baixar PDF (Com Capa)
                                </button>
                                
                                <button onClick={handleExportZIP} className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white py-2.5 rounded font-bold text-xs flex items-center justify-center gap-2">
                                    <Archive size={14}/> Exportar Todos (ZIP)
                                </button>

                                <button onClick={handlePrint} className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white py-2.5 rounded font-bold text-xs flex items-center justify-center gap-2">
                                    <Printer size={14}/> Imprimir
                                </button>
                                
                                <button className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-400 py-2.5 rounded font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed">
                                    <Share2 size={14}/> Compartilhar (Em breve)
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    // NORMAL MAP & DRAWING CONTROLS (Hidden when Project tab is active)
                    <div className="space-y-6 animate-fade-in">
                        {/* Map Selector */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Selecione o Mapa</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.keys(MAPPING_MAPS).map(mapName => (
                                    <button key={mapName} onClick={() => setCurrentMap(mapName)} className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all group ${currentMap === mapName ? 'border-brand-500' : 'border-gray-800 hover:border-gray-600'}`}>
                                        <img src={MAPPING_MAPS[mapName]} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute inset-0 flex items-center justify-center"><span className="text-[10px] font-bold uppercase drop-shadow-md text-white">{mapName}</span></div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tools */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Ferramentas</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'select', label: 'Selecionar', icon: <MousePointer size={16}/> },
                                    { id: 'freehand', label: 'Linha', icon: <PenTool size={16}/> },
                                    { id: 'arrow', label: 'Seta', icon: <ArrowRight size={16}/> },
                                    { id: 'circle', label: 'Círculo', icon: <Circle size={16} fill="currentColor"/> },
                                    { id: 'circle-outline', label: 'Círculo Vazio', icon: <Circle size={16}/> },
                                    { id: 'rect', label: 'Retângulo', icon: <Square size={16}/> },
                                    { id: 'line', label: 'Linha Reta', icon: <Minus size={16}/> },
                                    { id: 'text', label: 'Anotação', icon: <Type size={16}/> },
                                    { id: 'eraser', label: 'Apagar', icon: <Eraser size={16}/> },
                                ].map(tool => (
                                    <button key={tool.id} onClick={() => setActiveTool(tool.id as ToolType)} className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold transition-all ${activeTool === tool.id ? 'bg-brand-500 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                                        {tool.icon} {tool.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Color & Size */}
                        <div>
                             <div className="flex justify-between items-center mb-1">
                                 <span className="text-xs font-bold text-gray-500">Cor do Desenho</span>
                                 <div className="flex gap-1">
                                     {DRAWING_COLORS.map(c => (
                                         <button key={c} onClick={() => setSelectedColor(c)} className={`w-4 h-4 rounded-full border border-gray-600 transition-transform ${selectedColor === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'}`} style={{ backgroundColor: c }} />
                                     ))}
                                 </div>
                             </div>
                             <div className="space-y-1">
                                <span className="text-xs font-bold text-gray-500">Espessura: {strokeWidth}px</span>
                                <input type="range" min="2" max="12" step="2" value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))} className="w-full accent-brand-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                             </div>
                        </div>

                         {/* APPEARANCE CONTROLS */}
                         <div className="bg-gray-800/50 p-2 rounded-lg border border-gray-700">
                             <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><Palette size={10}/> Estilo do Texto</h4>
                             <div className="space-y-2">
                                {/* Text Color */}
                                <div className="flex flex-wrap gap-1">
                                    {NAME_COLORS.map(c => (
                                        <button 
                                            key={c.hex} 
                                            onClick={() => setNameColor(c.hex)} 
                                            className={`w-4 h-4 rounded-full border border-gray-600 ${nameColor === c.hex ? 'ring-2 ring-white scale-110' : ''}`}
                                            style={{ backgroundColor: c.hex }}
                                        />
                                    ))}
                                </div>
                                {/* Stroke Color */}
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-gray-500">Borda:</span>
                                    {STROKE_COLORS.map(c => (
                                        <button 
                                            key={c.hex} 
                                            onClick={() => setNameStroke(c.hex)} 
                                            className={`w-4 h-4 rounded-full border border-gray-600 ${nameStroke === c.hex ? 'ring-2 ring-white scale-110' : ''}`}
                                            style={{ backgroundColor: c.hex }}
                                        />
                                    ))}
                                </div>
                                {/* Size Slider */}
                                <div>
                                     <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                                         <span>Tamanho</span>
                                         <span>{(nameSize * 10).toFixed(0)}</span>
                                     </div>
                                     <input type="range" min="0.5" max="4.0" step="0.1" value={nameSize} onChange={(e) => setNameSize(Number(e.target.value))} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-brand-500" />
                                </div>
                             </div>
                         </div>
                        
                        {/* Add Items Section */}
                        <div>
                             <div className="bg-gray-800 p-1 rounded-lg flex mb-3">
                                 <button onClick={() => setNewItemType('text')} className={`flex-1 py-1.5 text-xs font-bold rounded ${newItemType === 'text' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}>Nome</button>
                                 <button onClick={() => setNewItemType('logo')} className={`flex-1 py-1.5 text-xs font-bold rounded ${newItemType === 'logo' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}>Logo</button>
                             </div>
                             {newItemType === 'text' ? (
                                 <input type="text" placeholder="Nome do time..." value={newItemName} onChange={(e) => setNewItemName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem()} className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm text-white focus:border-brand-500 outline-none" />
                             ) : (
                                 <label className="w-full h-10 border border-dashed border-gray-600 rounded flex items-center justify-center cursor-pointer hover:border-brand-500 text-xs text-gray-400 hover:text-white transition-colors gap-2">
                                     {uploadedLogo ? <Check size={14} className="text-green-500"/> : <ImageIcon size={14}/>}
                                     {uploadedLogo ? "Imagem Carregada" : "Upload Logo"}
                                     <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                 </label>
                             )}
                             
                             <button 
                                onClick={() => setAddToAllMaps(!addToAllMaps)}
                                className={`w-full mt-2 py-1.5 px-2 rounded flex items-center justify-center gap-2 text-xs font-bold transition-colors ${addToAllMaps ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                             >
                                <Globe size={12} />
                                {addToAllMaps ? "Add em TODOS" : "Add neste Mapa"}
                             </button>

                             <button onClick={addItem} disabled={newItemType === 'text' ? !newItemName : !uploadedLogo} className="w-full mt-2 bg-brand-500 hover:bg-brand-600 text-black py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2">
                                 <Plus size={16}/> Adicionar
                             </button>
                        </div>
                        
                        {/* --- MANAGED ITEMS LIST (Current Map) --- */}
                        <div className="border-t border-gray-800 pt-4">
                           <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Itens ({visibleItems.length})</h3>
                           <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                               {visibleItems.map(item => (
                                   <div key={item.id} className="flex items-center justify-between bg-gray-800 p-2 rounded-lg border border-gray-700 hover:border-brand-500 transition-colors group">
                                       <div className="flex items-center gap-2 overflow-hidden">
                                           {item.type === 'text' ? <Type size={12} className="text-gray-400 shrink-0"/> : <ImageIcon size={12} className="text-gray-400 shrink-0"/>}
                                           <span className="text-xs font-bold truncate max-w-[80px]" title={item.type === 'text' ? item.content : 'Logo'}>
                                               {item.type === 'text' ? item.content : 'Imagem Logo'}
                                           </span>
                                       </div>
                                       <div className="flex gap-1">
                                            {item.type === 'text' && (
                                               <button onClick={() => editItemName(item.id, item.content)} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"><Edit2 size={12}/></button>
                                            )}
                                            <button onClick={() => resetItemPosition(item.id)} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"><Move size={12}/></button>
                                            <button onClick={() => deleteItem(item.id, true)} className="p-1 hover:bg-red-900/50 rounded text-gray-400 hover:text-red-500"><Trash2 size={12}/></button>
                                       </div>
                                   </div>
                               ))}
                           </div>
                        </div>

                        {/* --- IMPORT SECTION --- */}
                        {availableToImport.length > 0 && (
                            <div className="border-t border-gray-800 pt-2">
                                <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-2">Importar ({availableToImport.length})</h3>
                                <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                                    {availableToImport.map(item => (
                                        <button key={item.id} onClick={() => importItemToMap(item.id)} className="w-full flex items-center justify-between bg-gray-800/50 p-1.5 rounded border border-gray-800 hover:border-brand-500 transition-colors group">
                                           <span className="text-xs font-bold text-gray-400 truncate max-w-[150px]">{item.type === 'text' ? item.content : 'Logo'}</span>
                                           <PlusCircle size={14} className="text-gray-500 group-hover:text-brand-500"/>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button onClick={clearCanvas} className="w-full text-xs text-red-500 hover:text-red-400 flex items-center justify-center gap-1">
                            <Trash2 size={12}/> Limpar Desenhos
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* --- RIGHT CANVAS AREA --- */}
        <div className="flex-1 bg-gray-950 flex flex-col items-center justify-center relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
             
             {!currentMap ? (
                 <div className="text-center opacity-30">
                     <MapIcon size={64} className="mx-auto mb-4"/>
                     <h2 className="text-2xl font-bold">Selecione um mapa para começar</h2>
                     <p>Use o painel lateral para escolher o mapa</p>
                 </div>
             ) : (
                 // WRAPPER FOR SCROLL/ZOOM
                 <div className="w-full h-full overflow-auto flex items-center justify-center p-10 bg-black/50 relative">
                     <div 
                        id="tactical-map"
                        ref={canvasRef}
                        className="relative bg-black shadow-2xl overflow-hidden select-none origin-center transition-transform duration-200"
                        style={{ 
                            aspectRatio: '16/9', 
                            height: '90%', 
                            minHeight: '600px',
                            transform: `scale(${mapZoom})`,
                            cursor: activeTool === 'select' ? 'default' : activeTool === 'eraser' ? 'crosshair' : 'crosshair'
                        }}
                     >
                         {/* 1. Map Image */}
                         <img 
                            src={MAPPING_MAPS[currentMap]} 
                            className="w-full h-full object-cover pointer-events-none z-0 absolute inset-0" 
                            alt="Tactical Map" 
                         />

                         {/* 2. SVG Drawing Layer */}
                         <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                             {currentElements.map((el, i) => {
                                 const stroke = el.color;
                                 const width = el.strokeWidth; 
                                 
                                 if (el.type === 'freehand' && el.points) {
                                     const pts = el.points.map(p => `${p.x},${p.y}`).join(' ');
                                     return <polyline key={i} points={pts} stroke={stroke} fill="none" strokeWidth={width} strokeLinecap="round" vectorEffect="non-scaling-stroke"/>;
                                 }
                                 if (el.type === 'line') {
                                     return <line key={i} x1={el.x} y1={el.y} x2={el.x + (el.w || 0)} y2={el.y + (el.h || 0)} stroke={stroke} strokeWidth={width} vectorEffect="non-scaling-stroke"/>;
                                 }
                                 if (el.type === 'arrow') {
                                     return <g key={i}>{renderArrow(el.x, el.y, el.x + (el.w || 0), el.y + (el.h || 0), stroke, el.strokeWidth)}</g>;
                                 }
                                 if (el.type === 'rect') {
                                     const lx = (el.w || 0) < 0 ? el.x + (el.w || 0) : el.x;
                                     const ly = (el.h || 0) < 0 ? el.y + (el.h || 0) : el.y;
                                     return <rect key={i} x={lx} y={ly} width={Math.abs(el.w || 0)} height={Math.abs(el.h || 0)} stroke={stroke} fill="none" strokeWidth={width} vectorEffect="non-scaling-stroke"/>;
                                 }
                                 if (el.type === 'circle' || el.type === 'circle-outline') {
                                     const dx = el.w || 0;
                                     const dy = (el.h || 0) / ASPECT_RATIO;
                                     const radius = Math.sqrt(dx*dx + dy*dy);
                                     
                                     const rx = radius;
                                     const ry = radius * ASPECT_RATIO;
                                     
                                     return <ellipse 
                                        key={i} 
                                        cx={el.x} 
                                        cy={el.y} 
                                        rx={rx} 
                                        ry={ry} 
                                        stroke={stroke} 
                                        fill={el.filled ? stroke : 'none'} 
                                        fillOpacity={el.filled ? 0.3 : 0} 
                                        strokeWidth={width} 
                                        vectorEffect="non-scaling-stroke"
                                     />;
                                 }
                                 return null;
                             })}
                         </svg>

                         {/* 3. Text Annotations (From Tool) */}
                         {currentElements.filter(el => el.type === 'text').map((el, i) => (
                             <div 
                                key={`txt-${i}`} 
                                style={{ 
                                    position: 'absolute', top: `${el.y}%`, left: `${el.x}%`, 
                                    color: el.color, fontSize: '1.5vw', fontWeight: 'bold', 
                                    textShadow: '2px 2px 0 #000', pointerEvents: 'none', zIndex: 15 
                                }}
                             >
                                 {el.text}
                             </div>
                         ))}

                         {/* 4. Draggable Items Layer (Z-20) */}
                         {visibleItems.map((item) => {
                             const pos = item.positions[currentMap]!;
                             // Default styles if not set (backward compatibility)
                             const color = item.style?.color || '#ffffff';
                             const stroke = item.style?.strokeColor || '#000000';
                             const fontSize = item.style?.fontSizeScale ? `${item.style.fontSizeScale}vw` : '1.5vw';

                             return (
                                 <div
                                    key={item.id}
                                    style={{ 
                                        position: 'absolute', top: `${pos.y}%`, left: `${pos.x}%`,
                                        transform: 'translate(-50%, -50%)',
                                        zIndex: 20,
                                        cursor: activeTool === 'select' ? 'move' : activeTool === 'eraser' ? 'not-allowed' : 'default',
                                        pointerEvents: 'auto'
                                    }}
                                    onMouseDown={(e) => startDragItem(e, item.id)}
                                    onTouchStart={(e) => startDragItem(e, item.id)}
                                    onClick={() => deleteItem(item.id)}
                                    className="group"
                                 >  
                                    {activeTool === 'select' && (
                                        <button 
                                            className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onMouseDown={(e) => e.stopPropagation()} 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteItem(item.id, true); 
                                            }}
                                        >
                                            <X size={8}/>
                                        </button>
                                    )}
                                    
                                    {item.type === 'text' ? (
                                        <span 
                                            className="whitespace-nowrap font-black uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" 
                                            style={{ 
                                                color: color,
                                                fontSize: fontSize, 
                                                // Create stroke effect using text-shadow
                                                textShadow: `-1px -1px 0 ${stroke}, 1px -1px 0 ${stroke}, -1px 1px 0 ${stroke}, 1px 1px 0 ${stroke}, 2px 2px 0 #000`
                                            }}
                                        >
                                            {item.content}
                                        </span>
                                    ) : (
                                        <img src={item.content} className="rounded-full border-2 border-white shadow-lg object-cover" style={{ width: '4vw', height: '4vw' }} draggable={false}/>
                                    )}
                                 </div>
                             );
                         })}
                         
                         {/* 5. INTERACTION LAYER (Z-30) */}
                         <div 
                            className="absolute inset-0 z-30"
                            style={{
                                pointerEvents: activeTool === 'select' ? 'none' : 'auto',
                            }}
                            onMouseDown={startInteraction}
                            onTouchStart={startInteraction}
                         ></div>

                     </div>

                     {/* ZOOM CONTROLS (Floating) */}
                     <div className="absolute bottom-6 right-6 flex flex-col gap-2 bg-gray-900/80 p-2 rounded-lg backdrop-blur-md border border-gray-700 shadow-2xl z-50">
                        <button onClick={() => setMapZoom(prev => Math.min(prev + 0.1, 3))} className="p-2 hover:bg-gray-700 rounded text-white" title="Zoom In"><ZoomIn size={20}/></button>
                        <button onClick={() => setMapZoom(1)} className="p-2 hover:bg-gray-700 rounded text-white" title="Reset Zoom"><Maximize size={20}/></button>
                        <button onClick={() => setMapZoom(prev => Math.max(prev - 0.1, 0.5))} className="p-2 hover:bg-gray-700 rounded text-white" title="Zoom Out"><ZoomOut size={20}/></button>
                     </div>

                     {/* Bottom Info */}
                     <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-xs text-gray-400 font-mono pointer-events-none z-50">
                         {activeTool === 'select' ? 'Modo Seleção: Arraste nomes/logos' : activeTool === 'eraser' ? 'Modo Borracha: Passe o mouse sobre linhas ou itens' : 'Modo Desenho: Clique e arraste para desenhar'}
                     </div>
                 </div>
             )}
             
        </div>

        {/* PREVIEW MODAL */}
        {previewImage && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in p-10">
                <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 max-w-5xl w-full flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold">Preview da Exportação</h3>
                        <button onClick={() => setPreviewImage(null)} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700"><X /></button>
                    </div>
                    <div className="bg-black rounded-lg overflow-hidden border border-gray-800">
                        <img src={previewImage} alt="Preview" className="w-full h-auto object-contain max-h-[70vh]" />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setPreviewImage(null)} className="px-6 py-2 bg-gray-800 text-white font-bold rounded hover:bg-gray-700">Fechar</button>
                        <button onClick={() => { handleDownloadImage(); setPreviewImage(null); }} className="px-6 py-2 bg-brand-500 text-black font-bold rounded hover:bg-brand-600">Baixar Agora</button>
                    </div>
                </div>
            </div>
        )}

        {/* LOADING OVERLAY */}
        {isExporting && (
             <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                 <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-500 mb-4"></div>
                 <p className="text-white font-bold">Gerando Arquivo...</p>
             </div>
        )}
    </div>
  );
};

export default Mapping;
