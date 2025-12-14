
import React, { useState, useRef, useEffect } from 'react';
import { 
  Map as MapIcon, Plus, Download, Trash2, Move, 
  Type, Image as ImageIcon, MousePointer, 
  Circle, Square, Minus, ArrowRight, Eraser, 
  PenTool, Save, FolderOpen, ChevronDown, Check, X, GripHorizontal
} from 'lucide-react';
import { MAPPING_MAPS } from '../constants';
import { downloadDivAsImage } from '../utils';

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

interface MapItem {
  id: string;
  type: 'text' | 'logo';
  content: string;
  x: number;
  y: number;
  scale: number;
}

interface ProjectState {
  name: string;
  map: string;
  elements: DrawElement[];
  items: MapItem[];
}

// --- CONSTANTS ---

const COLORS = [
  '#ffffff', // White
  '#eab308', // Brand Yellow
  '#ef4444', // Red
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#000000', // Black
];

const Mapping: React.FC = () => {
  // --- STATE ---
  
  // Canvas State
  const [currentMap, setCurrentMap] = useState<string>(''); 
  const [elements, setElements] = useState<DrawElement[]>([]);
  const [items, setItems] = useState<MapItem[]>([]); 

  // Tool State
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [selectedColor, setSelectedColor] = useState<string>('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  
  // Inputs
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'text' | 'logo'>('text');
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);

  // Project Management
  const [projectName, setProjectName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedProjects, setSavedProjects] = useState<string[]>([]);

  // Refs for Interaction (Fixes drawing lag/bugs)
  const canvasRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const activeToolRef = useRef(activeTool); // Keep sync
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

  // Helper to get coordinates in % relative to canvas
  const getCoords = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100
    };
  };

  // --- INTERACTION HANDLERS (GLOBAL) ---

  const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
    // 1. Handling Item Drag (Select Mode)
    if (activeToolRef.current === 'select' && dragItemRef.current) {
        // Prevent scrolling on mobile while dragging
        if (e.cancelable) e.preventDefault();
        
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
        const { x, y } = getCoords(clientX, clientY);
        
        setItems(prev => prev.map(it => 
            it.id === dragItemRef.current?.id ? { ...it, x, y } : it
        ));
        return;
    }

    // 2. Handling Drawing (Draw Mode)
    if (isDrawingRef.current) {
         if (e.cancelable) e.preventDefault();

         const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
         const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
         const { x, y } = getCoords(clientX, clientY);

         // Eraser Logic
         if (activeToolRef.current === 'eraser') {
            setElements(prev => prev.filter(el => {
                const distStart = Math.sqrt(Math.pow(el.x - x, 2) + Math.pow(el.y - y, 2));
                const distEnd = el.w ? Math.sqrt(Math.pow((el.x + el.w) - x, 2) + Math.pow((el.y + (el.h || 0)) - y, 2)) : 100;
                return distStart > 2 && distEnd > 2; 
            }));
            return;
         }

         setElements(prev => {
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1];
            
            // Only update the last element if it matches the current tool session
            // (We assume the last element is the one being drawn)
            
            if (last.type === 'freehand') {
                return [
                    ...prev.slice(0, -1),
                    { ...last, points: [...(last.points || []), {x, y}] }
                ];
            } else {
                // Shapes (Line, Arrow, Rect, Circle)
                return [
                    ...prev.slice(0, -1),
                    { ...last, w: x - last.x, h: y - last.y }
                ];
            }
         });
    }
  };

  const handleGlobalUp = () => {
    isDrawingRef.current = false;
    dragItemRef.current = null;
    // Remove listeners
    window.removeEventListener('mousemove', handleGlobalMove);
    window.removeEventListener('mouseup', handleGlobalUp);
    window.removeEventListener('touchmove', handleGlobalMove);
    window.removeEventListener('touchend', handleGlobalUp);
  };

  const startInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!currentMap) return;
    
    // Check if we clicked on an item while in select mode? 
    // No, item clicks are handled by the item's own onMouseDown. 
    // This handler is for the CANVAS background (drawing).
    
    // If tool is select, but we clicked canvas -> deselect or do nothing
    if (activeTool === 'select') return;

    // Prevent default to stop scrolling/selection
    // e.preventDefault(); 

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const { x, y } = getCoords(clientX, clientY);

    // Text Tool Special Case
    if (activeTool === 'text') {
        const text = prompt("Digite o texto:");
        if (text) {
            setElements(prev => [...prev, {
                id: Date.now().toString(),
                type: 'text',
                x, y,
                color: selectedColor,
                strokeWidth: 16,
                text
            }]);
        }
        return;
    }

    // Start Drawing
    isDrawingRef.current = true;
    
    // Add the new element immediately
    const newEl: DrawElement = {
        id: Date.now().toString(),
        type: activeTool,
        x, y,
        w: 0, h: 0,
        points: activeTool === 'freehand' ? [{x, y}] : undefined,
        color: selectedColor,
        strokeWidth: strokeWidth,
        filled: activeTool === 'circle'
    };
    setElements(prev => [...prev, newEl]);

    // Attach global listeners for smooth drag outside canvas
    window.addEventListener('mousemove', handleGlobalMove, { passive: false });
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchmove', handleGlobalMove, { passive: false });
    window.addEventListener('touchend', handleGlobalUp);
  };

  // --- ACTIONS: ITEMS ---

  const addItem = () => {
    if (newItemType === 'text' && !newItemName.trim()) return;
    if (newItemType === 'logo' && !uploadedLogo) return;

    if (items.length >= 15) {
        alert("Limite de 15 itens atingido.");
        return;
    }

    const newItem: MapItem = {
      id: Date.now().toString(),
      type: newItemType,
      content: newItemType === 'text' ? newItemName : uploadedLogo!,
      x: 50,
      y: 50,
      scale: 1
    };

    setItems(prev => [...prev, newItem]);
    if (newItemType === 'text') setNewItemName('');
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
      
      e.stopPropagation(); // Don't trigger canvas draw
      // e.preventDefault(); // Stop mobile scroll on item drag

      dragItemRef.current = { id, startX: 0, startY: 0 };
      
      // Attach global listeners for the item drag
      window.addEventListener('mousemove', handleGlobalMove, { passive: false });
      window.addEventListener('mouseup', handleGlobalUp);
      window.addEventListener('touchmove', handleGlobalMove, { passive: false });
      window.addEventListener('touchend', handleGlobalUp);
  };

  const deleteItem = (id: string) => {
      if (activeTool === 'eraser' || confirm("Remover este item?")) {
          setItems(prev => prev.filter(i => i.id !== id));
      }
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
          elements,
          items
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
          setCurrentMap(state.map);
          setElements(state.elements);
          setItems(state.items);
          setProjectName(state.name);
          setShowSaveModal(false);
      }
  };

  const clearCanvas = () => {
      if (confirm("Limpar tudo?")) {
          setElements([]);
          setItems([]);
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
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={width * 0.1} />
              <polygon points={`${x2},${y2} ${endX1},${endY1} ${endX2},${endY2}`} fill={color} />
          </g>
      );
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-gray-950 text-white animate-fade-in">
        
        {/* --- LEFT SIDEBAR (CONTROLS) --- */}
        <div className="w-80 flex flex-col border-r border-gray-800 bg-gray-900 overflow-y-auto custom-scrollbar z-40">
            {/* Same Sidebar Content as before */}
            <div className="p-4 border-b border-gray-800">
                <h2 className="text-xl font-bold text-brand-500 mb-4">Controles</h2>
                <div className="flex gap-2 bg-gray-800 p-1 rounded-lg mb-2">
                     <button onClick={() => setShowSaveModal(true)} className={`flex-1 py-2 rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors ${showSaveModal ? 'bg-brand-500 text-black' : 'hover:bg-gray-700 text-gray-300'}`}>
                         {showSaveModal ? <Save size={14}/> : <FolderOpen size={14}/>} Projeto
                     </button>
                     <button onClick={() => downloadDivAsImage('tactical-map', `mapa-${currentMap || 'tactical'}`)} className="flex-1 py-2 rounded text-xs font-bold hover:bg-gray-700 text-gray-300 flex items-center justify-center gap-2">
                         <Download size={14}/> Baixar
                     </button>
                </div>
                {/* Save Modal */}
                {showSaveModal && (
                    <div className="bg-gray-950 p-3 rounded-lg border border-gray-700 space-y-3 animate-fade-in">
                        <input type="text" placeholder="Nome do Projeto" value={projectName} onChange={e => setProjectName(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-xs text-white" />
                        <button onClick={saveProject} className="w-full bg-brand-500 text-black py-2 rounded text-xs font-bold">Salvar Projeto</button>
                        {savedProjects.length > 0 && (
                            <div className="mt-2">
                                <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">Carregar Projeto</p>
                                <div className="max-h-32 overflow-y-auto space-y-1">
                                    {savedProjects.map(p => (
                                        <button key={p} onClick={() => loadProject(p)} className="w-full text-left text-xs p-2 hover:bg-gray-800 rounded truncate flex items-center gap-2">
                                            <FolderOpen size={10} className="text-brand-500"/> {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <button onClick={() => setShowSaveModal(false)} className="w-full text-xs text-red-400 mt-2">Fechar</button>
                    </div>
                )}
            </div>

            <div className="p-4 border-b border-gray-800">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Selecione o Mapa</h3>
                <div className="grid grid-cols-2 gap-2">
                    {Object.keys(MAPPING_MAPS).map(mapName => (
                        <button key={mapName} onClick={() => { setCurrentMap(mapName); setElements([]); }} className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all group ${currentMap === mapName ? 'border-brand-500' : 'border-gray-800 hover:border-gray-600'}`}>
                            <img src={MAPPING_MAPS[mapName]} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 flex items-center justify-center"><span className="text-[10px] font-bold uppercase drop-shadow-md text-white">{mapName}</span></div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 border-b border-gray-800">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Ferramentas de Desenho</h3>
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
                <div className="mt-4 space-y-3">
                     <div className="flex justify-between items-center">
                         <span className="text-xs font-bold text-gray-500">Cor do Desenho</span>
                         <div className="flex gap-1">
                             {COLORS.map(c => (
                                 <button key={c} onClick={() => setSelectedColor(c)} className={`w-5 h-5 rounded-full border border-gray-600 transition-transform ${selectedColor === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'}`} style={{ backgroundColor: c }} />
                             ))}
                         </div>
                     </div>
                     <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-500">Espessura: {strokeWidth}px</span>
                        <input type="range" min="2" max="12" step="2" value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))} className="w-full accent-brand-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                     </div>
                </div>
            </div>

            <div className="p-4">
                 <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase">Adicionar Item ({items.length}/15)</h3>
                 </div>
                 <div className="bg-gray-800 p-1 rounded-lg flex mb-3">
                     <button onClick={() => setNewItemType('text')} className={`flex-1 py-1.5 text-xs font-bold rounded ${newItemType === 'text' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}>Nome</button>
                     <button onClick={() => setNewItemType('logo')} className={`flex-1 py-1.5 text-xs font-bold rounded ${newItemType === 'logo' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}>Logo</button>
                 </div>
                 {newItemType === 'text' ? (
                     <div className="space-y-2">
                         <input type="text" placeholder="Digite o nome" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem()} className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm text-white focus:border-brand-500 outline-none" />
                     </div>
                 ) : (
                     <label className="w-full h-10 border border-dashed border-gray-600 rounded flex items-center justify-center cursor-pointer hover:border-brand-500 text-xs text-gray-400 hover:text-white transition-colors gap-2">
                         {uploadedLogo ? <Check size={14} className="text-green-500"/> : <ImageIcon size={14}/>}
                         {uploadedLogo ? "Imagem Carregada" : "Upload Logo"}
                         <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                     </label>
                 )}
                 <button onClick={addItem} disabled={newItemType === 'text' ? !newItemName : !uploadedLogo} className="w-full mt-3 bg-brand-500 hover:bg-brand-600 text-black py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2">
                     <Plus size={16}/> Adicionar
                 </button>
                 <button onClick={clearCanvas} className="w-full mt-6 text-xs text-red-500 hover:text-red-400 flex items-center justify-center gap-1">
                     <Trash2 size={12}/> Limpar Tudo
                 </button>
            </div>
        </div>

        {/* --- RIGHT CANVAS AREA --- */}
        <div className="flex-1 bg-gray-950 flex flex-col items-center justify-center relative overflow-hidden">
             
             {!currentMap ? (
                 <div className="text-center opacity-30">
                     <MapIcon size={64} className="mx-auto mb-4"/>
                     <h2 className="text-2xl font-bold">Selecione um mapa para começar</h2>
                     <p>Use o painel lateral para escolher o mapa</p>
                 </div>
             ) : (
                 <div 
                    id="tactical-map"
                    ref={canvasRef}
                    className="relative bg-black shadow-2xl overflow-hidden select-none"
                    style={{ 
                        aspectRatio: '16/9', 
                        height: '90%', 
                        maxHeight: '1080px',
                    }}
                 >
                     {/* 1. Map Image */}
                     <img 
                        src={MAPPING_MAPS[currentMap]} 
                        className="w-full h-full object-cover pointer-events-none z-0 absolute inset-0" 
                        alt="Tactical Map" 
                     />

                     {/* 2. SVG Drawing Layer */}
                     <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                         {elements.map((el, i) => {
                             const stroke = el.color;
                             const width = el.strokeWidth * 0.1; 
                             
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
                                 const r = Math.sqrt(Math.pow(el.w || 0, 2) + Math.pow(el.h || 0, 2));
                                 return <circle key={i} cx={el.x} cy={el.y} r={r} stroke={stroke} fill={el.filled ? stroke : 'none'} fillOpacity={el.filled ? 0.3 : 0} strokeWidth={width} vectorEffect="non-scaling-stroke"/>;
                             }
                             return null;
                         })}
                     </svg>

                     {/* 3. Text Annotations */}
                     {elements.filter(el => el.type === 'text').map((el, i) => (
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
                     {items.map((item) => (
                         <div
                            key={item.id}
                            style={{ 
                                position: 'absolute', top: `${item.y}%`, left: `${item.x}%`,
                                transform: 'translate(-50%, -50%)',
                                zIndex: 20,
                                cursor: activeTool === 'select' ? 'move' : activeTool === 'eraser' ? 'not-allowed' : 'default',
                                pointerEvents: 'auto' // Items must capture clicks to start dragging
                            }}
                            onMouseDown={(e) => startDragItem(e, item.id)}
                            onTouchStart={(e) => startDragItem(e, item.id)}
                            onClick={() => deleteItem(item.id)}
                            className="group"
                         >  
                            {activeTool === 'select' && (
                                <button className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={8}/></button>
                            )}
                            
                            {item.type === 'text' ? (
                                <span className="whitespace-nowrap font-black uppercase text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" style={{ fontSize: '1.5vw', textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>
                                    {item.content}
                                </span>
                            ) : (
                                <img src={item.content} className="rounded-full border-2 border-white shadow-lg object-cover" style={{ width: '4vw', height: '4vw' }} draggable={false}/>
                            )}
                         </div>
                     ))}
                     
                     {/* 5. INTERACTION LAYER (Z-30) */}
                     {/* This layer captures drawing events. We use conditional pointer-events to let clicks pass to items when in select mode BUT we handle the "empty space" drag on window, so this layer is specifically for starting drawing. */}
                     <div 
                        className="absolute inset-0 z-30"
                        style={{
                            // If Select mode, we let clicks pass through to items (Z-20).
                            // If Drawing mode, this layer captures the start of the draw.
                            pointerEvents: activeTool === 'select' ? 'none' : 'auto',
                            cursor: activeTool === 'eraser' ? 'crosshair' : activeTool === 'text' ? 'text' : 'crosshair'
                        }}
                        onMouseDown={startInteraction}
                        onTouchStart={startInteraction}
                     ></div>

                 </div>
             )}
             
             {/* Bottom Info */}
             {currentMap && (
                 <div className="absolute bottom-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-xs text-gray-400 font-mono pointer-events-none">
                     {activeTool === 'select' ? 'Modo Seleção: Arraste nomes/logos' : activeTool === 'eraser' ? 'Modo Borracha: Passe o mouse para remover' : 'Modo Desenho: Clique e arraste para desenhar'}
                 </div>
             )}
        </div>
    </div>
  );
};

export default Mapping;
