import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { 
  Square, 
  Circle, 
  Triangle, 
  Type, 
  MousePointer2, 
  Trash2, 
  Download, 
  Upload, 
  Pencil, 
  Eraser, 
  ArrowUpRight, 
  Minus, 
  X, 
  Check, 
  Layers,
  User,
  Copy,
  Undo2,
  Redo2,
  Maximize2,
  Move,
  RotateCw,
  Eye,
  Zap,
  Grid3X3,
  Shapes
} from 'lucide-react';

const TACTICAL_COLORS = [
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Amarelo', value: '#eab308' },
  { name: 'Verde', value: '#22c55e' },
  { name: 'Ciano', value: '#06b6d4' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Preto', value: '#000000' },
  { name: 'Branco', value: '#ffffff' },
  { name: 'Cinza', value: '#71717a' },
];

const FreeFireTacticalBoard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);
  const [activeTool, setActiveTool] = useState<string>('select');
  const [color, setColor] = useState<string>('#ef4444');
  const [brushSize, setBrushSize] = useState<number>(3);
  const [fontSize, setFontSize] = useState<number>(22);
  const [isBold, setIsBold] = useState<boolean>(true);
  const [textBg, setTextBg] = useState<boolean>(false);
  const [selectedTextObj, setSelectedTextObj] = useState<any>(null);
  const [editingTextValue, setEditingTextValue] = useState<string>('');

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    if (selectedTextObj && fabricCanvas.current) {
      selectedTextObj.set({ fill: newColor });
      fabricCanvas.current.renderAll();
      fabricCanvas.current.fire('object:modified', { target: selectedTextObj });
    }
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    if (selectedTextObj && fabricCanvas.current) {
      selectedTextObj.set({ fontSize: size });
      fabricCanvas.current.renderAll();
      fabricCanvas.current.fire('object:modified', { target: selectedTextObj });
    }
  };

  const handleBoldToggle = () => {
    const nextBold = !isBold;
    setIsBold(nextBold);
    if (selectedTextObj && fabricCanvas.current) {
      selectedTextObj.set({ fontWeight: nextBold ? 'bold' : 'normal' });
      fabricCanvas.current.renderAll();
      fabricCanvas.current.fire('object:modified', { target: selectedTextObj });
    }
  };

  const handleBgToggle = () => {
    const nextBg = !textBg;
    setTextBg(nextBg);
    if (selectedTextObj && fabricCanvas.current) {
      selectedTextObj.set({ backgroundColor: nextBg ? 'rgba(0,0,0,0.6)' : 'transparent' });
      fabricCanvas.current.renderAll();
      fabricCanvas.current.fire('object:modified', { target: selectedTextObj });
    }
  };

  const handleTextChange = (newVal: string) => {
    setEditingTextValue(newVal);
    if (selectedTextObj && fabricCanvas.current) {
      selectedTextObj.set({ text: newVal });
      fabricCanvas.current.renderAll();
      fabricCanvas.current.fire('object:modified', { target: selectedTextObj });
    }
  };
  
  // Undo/Redo state
  const history = useRef<string[]>([]);
  const historyIndex = useRef<number>(-1);
  const isRedoing = useRef<boolean>(false);

  const saveHistory = useCallback(() => {
    if (!fabricCanvas.current || isRedoing.current) return;
    const json = JSON.stringify(fabricCanvas.current.toJSON());
    
    // If we are in the middle of history, discard future
    if (historyIndex.current < history.current.length - 1) {
      history.current = history.current.slice(0, historyIndex.current + 1);
    }
    
    history.current.push(json);
    historyIndex.current = history.current.length - 1;
    
    // Limit history
    if (history.current.length > 50) {
      history.current.shift();
      historyIndex.current--;
    }
  }, []);

  const undo = useCallback(() => {
    if (historyIndex.current <= 0 || !fabricCanvas.current) return;
    isRedoing.current = true;
    historyIndex.current--;
    fabricCanvas.current.loadFromJSON(history.current[historyIndex.current]).then(() => {
      fabricCanvas.current?.renderAll();
      isRedoing.current = false;
    });
  }, []);

  const redo = useCallback(() => {
    if (historyIndex.current >= history.current.length - 1 || !fabricCanvas.current) return;
    isRedoing.current = true;
    historyIndex.current++;
    fabricCanvas.current.loadFromJSON(history.current[historyIndex.current]).then(() => {
      fabricCanvas.current?.renderAll();
      isRedoing.current = false;
    });
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 1280,
      height: 720,
      backgroundColor: '#121214',
      preserveObjectStacking: true,
    });

    fabricCanvas.current = canvas;

    const handleResize = () => {
      const container = document.getElementById('canvas-container');
      if (container) {
        canvas.setDimensions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
        canvas.renderAll();
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Initial history
    saveHistory();

    canvas.on('object:added', saveHistory);
    canvas.on('object:modified', saveHistory);
    canvas.on('object:removed', saveHistory);

    const handleSelection = () => {
      const activeObject = canvas.getActiveObject();
      if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'text')) {
        setSelectedTextObj(activeObject);
        setEditingTextValue((activeObject as any).text || '');
        if ((activeObject as any).fontSize) setFontSize((activeObject as any).fontSize);
        if ((activeObject as any).fill) setColor((activeObject as any).fill);
        if ((activeObject as any).fontWeight) setIsBold((activeObject as any).fontWeight === 'bold');
      } else {
        setSelectedTextObj(null);
        setEditingTextValue('');
      }
    };

    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', () => {
      setSelectedTextObj(null);
      setEditingTextValue('');
    });
    canvas.on('text:changed', (e) => {
      if (e.target && (e.target.type === 'i-text' || e.target.type === 'text')) {
        setEditingTextValue((e.target as any).text || '');
      }
    });

    // Hotkeys
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore hotkeys when typing in forms, inputs or during active text object editing
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.hasAttribute('contenteditable')
      ) {
        return;
      }

      const activeObject = canvas.getActiveObject();
      if (activeObject && (activeObject as any).isEditing) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length > 0) {
          canvas.remove(...activeObjects);
          canvas.discardActiveObject();
          canvas.renderAll();
        }
      } else if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
      } else if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        duplicateSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      canvas.dispose();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo, saveHistory]);

  const duplicateSelected = () => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    activeObject.clone().then((cloned: fabric.Object) => {
      canvas.discardActiveObject();
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
        evented: true,
      });
      if (cloned instanceof fabric.Group) {
        cloned.canvas = canvas;
        cloned.forEachObject((obj) => {
          canvas.add(obj);
        });
      }
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.requestRenderAll();
    });
  };

  // Tool logic
  useEffect(() => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;

    canvas.isDrawingMode = activeTool === 'draw';
    if (canvas.isDrawingMode) {
      const brush = new fabric.PencilBrush(canvas);
      brush.color = color;
      brush.width = brushSize;
      canvas.freeDrawingBrush = brush;
    }

    canvas.defaultCursor = activeTool === 'select' ? 'default' : 'crosshair';
    canvas.selection = activeTool === 'select';
    
    canvas.forEachObject((obj) => {
      obj.selectable = activeTool === 'select';
      obj.evented = activeTool === 'select';
    });
  }, [activeTool, color, brushSize]);

  const addShape = (type: string, options: any = {}) => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;
    let shape: fabric.Object;

    const common = {
      left: 200,
      top: 200,
      fill: options.fill || 'transparent',
      stroke: options.stroke || color,
      strokeWidth: options.strokeWidth || brushSize,
      strokeUniform: true,
      ...options
    };

    switch (type) {
      case 'rect':
        shape = new fabric.Rect({ ...common, width: 100, height: 60 });
        break;
      case 'circle':
        shape = new fabric.Circle({ ...common, radius: 50 });
        break;
      case 'triangle':
        shape = new fabric.Triangle({ ...common, width: 80, height: 80 });
        break;
      case 'oval':
        shape = new fabric.Ellipse({ ...common, rx: 60, ry: 40 });
        break;
      case 'line':
        shape = new fabric.Line([0, 0, 150, 0], { ...common });
        break;
      case 'dashed-line':
        shape = new fabric.Line([0, 0, 150, 0], { ...common, strokeDashArray: [10, 5] });
        break;
      case 'arrow':
        shape = new fabric.Path('M 0 0 L 150 0 M 150 0 L 130 -10 M 150 0 L 130 10', {
          ...common,
          fill: 'transparent',
          strokeLineCap: 'round',
          strokeLineJoin: 'round'
        });
        break;
      case 'double-arrow':
        shape = new fabric.Path('M 0 0 L 150 0 M 150 0 L 130 -10 M 150 0 L 130 10 M 0 0 L 20 -10 M 0 0 L 20 10', {
          ...common,
          fill: 'transparent',
          strokeLineCap: 'round',
          strokeLineJoin: 'round'
        });
        break;
      case 'curved-arrow':
        shape = new fabric.Path('M 0 50 Q 75 0 150 50 M 150 50 L 135 40 M 150 50 L 145 35', {
          ...common,
          fill: 'transparent',
          strokeLineCap: 'round',
          strokeLineJoin: 'round'
        });
        break;
      case 'zigzag':
        shape = new fabric.Path('M 0 0 L 25 20 L 50 0 L 75 20 L 100 0 L 125 20 L 150 0', {
          ...common,
          fill: 'transparent',
        });
        break;
      case 'x':
        shape = new fabric.Text('X', { ...common, fontSize: 40, fill: color, strokeWidth: 0, fontWeight: 'bold' });
        break;
      case 'check':
        shape = new fabric.Text('✓', { ...common, fontSize: 40, fill: color, strokeWidth: 0, fontWeight: 'bold' });
        break;
      default:
        return;
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    setActiveTool('select');
  };

  const addText = () => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;
    
    const text = new fabric.IText('Clique para editar', {
      left: 200,
      top: 200,
      fontSize: fontSize,
      fill: color,
      fontWeight: isBold ? 'bold' : 'normal',
      stroke: 'black',
      strokeWidth: 2,
      backgroundColor: textBg ? 'rgba(0,0,0,0.6)' : 'transparent',
      fontFamily: 'Inter, sans-serif'
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    setActiveTool('select');
  };

  const addPlayer = (num: number, playerColor: string) => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;

    const circle = new fabric.Circle({
      radius: 22,
      stroke: playerColor,
      strokeWidth: 4,
      fill: 'transparent',
      originX: 'center',
      originY: 'center',
      strokeUniform: true
    });

    const numberText = new fabric.Text(num.toString(), {
      fontSize: 20,
      fontWeight: 'bold',
      fill: playerColor,
      originX: 'center',
      originY: 'center',
      fontFamily: 'Inter, sans-serif'
    });

    const labelText = new fabric.Text(`PLAYER ${num}`, {
      fontSize: 12,
      fontWeight: 'bold',
      fill: 'white',
      backgroundColor: 'rgba(0,0,0,0.7)',
      top: 30,
      originX: 'center',
      originY: 'top',
      fontFamily: 'Inter, sans-serif',
      padding: 2
    });

    const group = new fabric.Group([circle, numberText, labelText], {
      left: 300,
      top: 300,
      originX: 'center',
      originY: 'center',
    });

    canvas.add(group);
    canvas.setActiveObject(group);
    setActiveTool('select');
  };

  const addTacticalRing = (c: string, double: boolean) => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;
    
    const ringOptions = {
      rx: 60,
      ry: 25,
      fill: 'transparent',
      stroke: c,
      strokeWidth: 4,
      strokeDashArray: [10, 8],
      strokeUniform: true,
      originX: 'center' as any,
      originY: 'center' as any
    };

    if (double) {
      const ring1 = new fabric.Ellipse({ ...ringOptions, top: -10 });
      const ring2 = new fabric.Ellipse({ ...ringOptions, top: 10 });
      const group = new fabric.Group([ring1, ring2], {
        left: 300,
        top: 300,
        originX: 'center' as any,
        originY: 'center' as any
      });
      canvas.add(group);
      canvas.setActiveObject(group);
    } else {
      const ring = new fabric.Ellipse({ ...ringOptions, left: 300, top: 300 });
      canvas.add(ring);
      canvas.setActiveObject(ring);
    }
    setActiveTool('select');
  };

  const addVisionCone = (c: string) => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;

    const triangle = new fabric.Triangle({
      width: 70,
      height: 160,
      fill: new fabric.Gradient({
        type: 'linear',
        coords: { x1: 0, y1: 160, x2: 0, y2: 0 },
        colorStops: [
          { offset: 0, color: c + 'aa' },
          { offset: 1, color: 'transparent' }
        ]
      }),
      originX: 'center' as any,
      originY: 'bottom' as any,
      top: 0,
      left: 0
    });

    const base = new fabric.Ellipse({
      rx: 35,
      ry: 12,
      fill: 'transparent',
      stroke: c,
      strokeWidth: 3,
      strokeDashArray: [10, 8],
      strokeUniform: true,
      originX: 'center' as any,
      originY: 'center' as any,
      top: 0,
      left: 0
    });

    const group = new fabric.Group([triangle, base], {
      left: 400,
      top: 400,
      originX: 'center' as any,
      originY: 'center' as any
    });

    canvas.add(group);
    canvas.setActiveObject(group);
    setActiveTool('select');
  };

  const addCylinderVision = (c: string) => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;

    const rect = new fabric.Rect({
      width: 80,
      height: 160,
      fill: new fabric.Gradient({
        type: 'linear',
        coords: { x1: 0, y1: 0, x2: 0, y2: 160 },
        colorStops: [
          { offset: 0, color: 'transparent' },
          { offset: 0.5, color: c + '44' },
          { offset: 1, color: c + 'aa' }
        ]
      }),
      originX: 'center',
      originY: 'bottom',
      top: 0,
      left: 0
    });

    const base = new fabric.Ellipse({
      rx: 40,
      ry: 12,
      fill: 'transparent',
      stroke: c,
      strokeWidth: 3,
      strokeDashArray: [8, 6],
      strokeUniform: true,
      originX: 'center',
      originY: 'center',
      top: 0,
      left: 0
    });

    const group = new fabric.Group([rect, base], {
      left: 450,
      top: 450,
      originX: 'center',
      originY: 'center'
    });

    canvas.add(group);
    canvas.setActiveObject(group);
    setActiveTool('select');
  };

  const addColoredZone = (c: string, type: 'rect' | 'circle' | 'oval', pattern: boolean) => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;
    
    let shape: fabric.Object;
    const common = {
      left: 200,
      top: 200,
      fill: c + '66', // ~40% opacity
      stroke: c,
      strokeWidth: 2,
      strokeUniform: true,
    };

    if (pattern) {
      // Create a simple diagonal stripe pattern
      const patternCanvas = document.createElement('canvas');
      patternCanvas.width = 10;
      patternCanvas.height = 10;
      const ctx = patternCanvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = c;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.lineTo(10, 0);
        ctx.stroke();
      }
      common.fill = new fabric.Pattern({
        source: patternCanvas,
        repeat: 'repeat'
      }) as any;
    }

    switch (type) {
      case 'rect':
        shape = new fabric.Rect({ ...common, width: 150, height: 100 });
        break;
      case 'circle':
        shape = new fabric.Circle({ ...common, radius: 60 });
        break;
      case 'oval':
        shape = new fabric.Ellipse({ ...common, rx: 80, ry: 50 });
        break;
      default:
        return;
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    setActiveTool('select');
  };

  const addSpotlight = (c: string, type: 'cone' | 'ellipse' | 'cylinder') => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;
    
    let shape: fabric.Object;
    const gradientOptions = {
      type: 'linear',
      coords: { x1: 0, y1: 0, x2: 0, y2: 150 },
      colorStops: [
        { offset: 0, color: c + '88' },
        { offset: 1, color: 'transparent' }
      ]
    };

    switch (type) {
      case 'cone':
        shape = new fabric.Triangle({
          width: 100,
          height: 150,
          fill: new fabric.Gradient(gradientOptions as any) as any,
          left: 200,
          top: 200,
          originX: 'center' as any,
          originY: 'bottom' as any
        });
        break;
      case 'ellipse':
        shape = new fabric.Ellipse({
          rx: 60,
          ry: 30,
          fill: new fabric.Gradient({
            type: 'radial',
            coords: { r1: 0, r2: 60, x1: 60, y1: 30, x2: 60, y2: 30 },
            colorStops: [
              { offset: 0, color: c + '88' },
              { offset: 1, color: 'transparent' }
            ]
          } as any) as any,
          left: 200,
          top: 200
        });
        break;
      case 'cylinder':
        shape = new fabric.Rect({
          width: 80,
          height: 150,
          fill: new fabric.Gradient(gradientOptions as any) as any,
          left: 200,
          top: 200,
          originX: 'center' as any,
          originY: 'bottom' as any,
          rx: 40,
          ry: 10
        });
        break;
      default:
        return;
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    setActiveTool('select');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvas.current) return;

    const reader = new FileReader();
    reader.onload = (f) => {
      const data = f.target?.result;
      if (typeof data !== 'string') return;

      fabric.Image.fromURL(data).then((img) => {
        const canvas = fabricCanvas.current!;
        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        const imageWidth = img.width;
        const imageHeight = img.height;

        // Calculate the correct scale so the image fits inside the canvas while maintaining aspect ratio
        const scaleFactor = Math.min(
          canvasWidth / imageWidth,
          canvasHeight / imageHeight
        );

        img.set({
          originX: "center",
          originY: "center",
          left: canvasWidth / 2,
          top: canvasHeight / 2,
          selectable: false,
          evented: false,
        });

        img.scale(scaleFactor);

        // Set the uploaded screenshot as canvas background
        canvas.backgroundImage = img;
        canvas.renderAll();
        saveHistory();
      });
    };
    reader.readAsDataURL(file);
  };

  const exportCanvas = () => {
    if (!fabricCanvas.current) return;
    // Export entire canvas including background and drawings
    const dataURL = fabricCanvas.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2, // High resolution export
    });
    const link = document.createElement('a');
    link.download = `ff-strategy-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  };

  const deleteSelected = () => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;
    const activeObjects = canvas.getActiveObjects();
    canvas.remove(...activeObjects);
    canvas.discardActiveObject();
    canvas.renderAll();
  };

  return (
    <div className="flex flex-col h-screen bg-graphite-900 text-gray-100 overflow-hidden font-sans">
      {/* Header */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-graphite-800 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-loud-500 rounded flex items-center justify-center text-gray-900 font-bold animate-pulse">
            FF
          </div>
          <h1 className="text-lg font-bold tracking-tight uppercase italic">Free Fire Tactical Board</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-graphite-900 rounded-lg p-1 border border-white/5">
            <button onClick={undo} className="p-1.5 hover:bg-graphite-800 rounded transition-colors" title="Undo (Ctrl+Z)"><Undo2 size={18} /></button>
            <button onClick={redo} className="p-1.5 hover:bg-graphite-800 rounded transition-colors" title="Redo (Ctrl+Y)"><Redo2 size={18} /></button>
          </div>

          <label className="flex items-center gap-2 px-4 py-1.5 bg-graphite-900 hover:bg-graphite-800 rounded-lg cursor-pointer transition-colors text-sm font-bold border border-white/5">
            <Upload size={16} className="text-loud-500" />
            UPLOAD SCREENSHOT
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
          </label>
          
          <button 
            onClick={exportCanvas}
            className="flex items-center gap-2 px-4 py-1.5 bg-loud-500 hover:bg-loud-600 text-gray-900 rounded-lg transition-colors text-sm font-bold shadow-lg shadow-loud-500/20"
          >
            <Download size={16} />
            EXPORT STRATEGY
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL: Geometry & Lines */}
        <aside className="w-72 border-r border-white/10 bg-graphite-800 flex flex-col shrink-0 overflow-y-auto scrollbar-hide">
          <div className="p-4 space-y-6">
            {/* Tools */}
            <section>
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">FERRAMENTAS</h2>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setActiveTool('select')}
                  className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold transition-all border ${activeTool === 'select' ? 'bg-loud-500 text-graphite-900 border-loud-500' : 'bg-graphite-900/50 border-white/5 text-gray-400 hover:border-white/10'}`}
                >
                  <MousePointer2 size={14} /> SELECIONAR
                </button>
                <button 
                  onClick={() => setActiveTool('draw')}
                  className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold transition-all border ${activeTool === 'draw' ? 'bg-loud-500 text-graphite-900 border-loud-500' : 'bg-graphite-900/50 border-white/5 text-gray-400 hover:border-white/10'}`}
                >
                  <Pencil size={14} /> DESENHAR
                </button>
                <button 
                  onClick={addText}
                  className="flex items-center gap-2 p-2 rounded-lg text-xs font-bold bg-graphite-900/50 border border-white/5 text-gray-400 hover:border-white/10 transition-all"
                >
                  <Type size={14} /> TEXTO
                </button>
                <button 
                  onClick={deleteSelected}
                  className="flex items-center gap-2 p-2 rounded-lg text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                >
                  <Trash2 size={14} /> DELETAR
                </button>
                <button 
                  onClick={duplicateSelected}
                  className="flex items-center gap-2 p-2 rounded-lg text-xs font-bold bg-graphite-900/50 border border-white/5 text-gray-400 hover:border-white/10 transition-all"
                >
                  <Copy size={14} /> DUPLICAR
                </button>
              </div>
            </section>

            {/* Lines & Shapes */}
            <section>
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">LINHAS E FORMAS</h2>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { icon: <Minus size={18} />, type: 'line', name: 'Linha' },
                  { icon: <Minus size={18} className="opacity-50" />, type: 'dashed-line', name: 'Tracejada' },
                  { icon: <ArrowUpRight size={18} />, type: 'arrow', name: 'Seta' },
                  { icon: <ArrowUpRight size={18} className="rotate-45" />, type: 'double-arrow', name: 'Seta Dupla' },
                  { icon: <RotateCw size={18} />, type: 'curved-arrow', name: 'Curva' },
                  { icon: <Zap size={18} />, type: 'zigzag', name: 'ZigZag' },
                  { icon: <Square size={18} />, type: 'rect', name: 'Retângulo' },
                  { icon: <Circle size={18} />, type: 'circle', name: 'Círculo' },
                  { icon: <Triangle size={18} />, type: 'triangle', name: 'Triângulo' },
                  { icon: <Maximize2 size={18} className="rotate-45" />, type: 'oval', name: 'Oval' },
                  { icon: <X size={18} className="text-red-500" />, type: 'x', name: 'Erro' },
                  { icon: <Check size={18} className="text-green-500" />, type: 'check', name: 'Sucesso' },
                ].map((item) => (
                  <button 
                    key={item.type}
                    onClick={() => addShape(item.type)}
                    className="aspect-square bg-graphite-900/50 border border-white/5 rounded-lg flex items-center justify-center hover:bg-graphite-700 hover:border-white/10 transition-all group"
                    title={item.name}
                  >
                    <div className="group-hover:scale-110 transition-transform">{item.icon}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* Players */}
            <section>
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-loud-500 mb-3">PLAYERS</h2>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((num) => (
                  <div key={`player-row-${num}`} className="flex flex-col gap-2">
                    <span className="text-[9px] font-bold text-gray-500 uppercase">PLAYER {num}</span>
                    <div className="grid grid-cols-6 gap-1">
                      {TACTICAL_COLORS.slice(0, 6).map((c) => (
                        <button
                           key={`player-${num}-${c.value}`}
                           onClick={() => addPlayer(num, c.value)}
                           className="aspect-square bg-graphite-900/50 border border-white/5 rounded flex items-center justify-center hover:bg-graphite-700 transition-all"
                           title={`Add Player ${num} (${c.name})`}
                        >
                          <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[8px] font-bold" style={{ borderColor: c.value, color: c.value }}>
                            {num}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Tactical Rings */}
            <section>
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-loud-500 mb-3">ANÉIS TÁTICOS</h2>
              <div className="space-y-3">
                {TACTICAL_COLORS.map((c) => (
                  <div key={`rings-${c.value}`} className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => addTacticalRing(c.value, false)}
                      className="h-10 bg-graphite-900/50 border border-white/5 rounded-lg flex items-center justify-center hover:bg-graphite-700 transition-all"
                      title={`Anel Simples ${c.name}`}
                    >
                      <div className="w-10 h-3 rounded-full border-2 border-dashed" style={{ borderColor: c.value }} />
                    </button>
                    <button
                      onClick={() => addTacticalRing(c.value, true)}
                      className="h-10 bg-graphite-900/50 border border-white/5 rounded-lg flex items-center justify-center hover:bg-graphite-700 transition-all"
                      title={`Anel Duplo ${c.name}`}
                    >
                      <div className="relative w-10 h-6 flex flex-col items-center justify-center">
                        <div className="w-10 h-3 rounded-full border-2 border-dashed" style={{ borderColor: c.value }} />
                        <div className="w-10 h-3 rounded-full border-2 border-dashed -mt-1.5" style={{ borderColor: c.value }} />
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </aside>

        {/* CENTER: Canvas Editor */}
        <main className="flex-1 bg-graphite-900 relative overflow-hidden flex flex-col">
          <div className="h-10 border-b border-white/5 bg-graphite-800 flex items-center px-4 justify-between shrink-0">
            <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <span className="flex items-center gap-1"><Move size={10} /> Drag</span>
              <span className="flex items-center gap-1"><Maximize2 size={10} /> Resize</span>
              <span className="flex items-center gap-1"><RotateCw size={10} /> Rotate</span>
            </div>

            {selectedTextObj && (
              <div className="flex items-center gap-2 bg-graphite-900 border border-white/10 rounded px-3 py-1 shrink-0 max-w-md mx-2">
                <span className="text-[9px] font-extrabold text-loud-500 uppercase tracking-wider">Editar Texto:</span>
                <input 
                  type="text"
                  value={editingTextValue}
                  onChange={(e) => handleTextChange(e.target.value)}
                  className="bg-transparent border-none text-xs text-white outline-none w-32 md:w-48 font-bold animate-pulse"
                  placeholder="Escreva aqui..."
                  autoFocus
                />
              </div>
            )}

            <div className="flex items-center gap-4">
               <div className="flex items-center gap-4 border-r border-white/5 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Text Size</span>
                    <input 
                      type="range" min="10" max="100" value={fontSize} 
                      onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
                      className="w-20 accent-loud-500 h-1 bg-graphite-700 rounded-full appearance-none"
                    />
                  </div>
                  <button 
                    onClick={handleBoldToggle}
                    className={`p-1 rounded text-[10px] font-bold border transition-colors ${isBold ? 'bg-loud-500 text-graphite-900 border-loud-500' : 'bg-graphite-900 border-white/5 text-gray-400'}`}
                  >
                    BOLD
                  </button>
                  <button 
                    onClick={handleBgToggle}
                    className={`p-1 rounded text-[10px] font-bold border transition-colors ${textBg ? 'bg-loud-500 text-graphite-900 border-loud-500' : 'bg-graphite-900 border-white/5 text-gray-400'}`}
                  >
                    BG
                  </button>
               </div>
               <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Brush Size</span>
                  <input 
                    type="range" min="1" max="20" value={brushSize} 
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-24 accent-loud-500 h-1 bg-graphite-700 rounded-full appearance-none"
                  />
               </div>
            </div>
          </div>
          
          <div id="canvas-container" className="flex-1 relative p-4 bg-graphite-900">
            <div className="w-full h-full bg-graphite-800 rounded-xl shadow-inner border border-white/5 overflow-hidden relative">
              <canvas ref={canvasRef} />
            </div>
          </div>
        </main>

        {/* RIGHT PANEL: Vision, Zones, Highlights */}
        <aside className="w-80 border-l border-white/10 bg-graphite-800 flex flex-col shrink-0 overflow-y-auto scrollbar-hide">
          <div className="p-4 space-y-8">
            {/* Vision Fields */}
            <section>
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-loud-500 mb-4">CAMPOS DE VISÃO</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-[9px] font-bold text-premium-muted uppercase mb-2">Cones de Visão</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {TACTICAL_COLORS.map((c) => (
                      <button
                        key={`vision-cone-${c.value}`}
                        onClick={() => addVisionCone(c.value)}
                        className="aspect-square bg-graphite-900/50 border border-white/5 rounded-lg flex items-center justify-center hover:bg-graphite-700 transition-all group"
                        title={`Cone ${c.name}`}
                      >
                        <div className="relative w-8 h-12 flex flex-col items-center justify-end">
                          <div 
                            className="w-6 h-10" 
                            style={{ 
                              clipPath: 'polygon(50% 0, 0 100%, 100% 100%)',
                              background: `linear-gradient(to top, ${c.value}, transparent)`
                            }} 
                          />
                          <div className="w-8 h-2.5 border-2 border-dashed rounded-full -mt-1" style={{ borderColor: c.value }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-[9px] font-bold text-premium-muted uppercase mb-2">Spotlights Cilíndricos</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {TACTICAL_COLORS.map((c) => (
                      <button
                        key={`vision-cylinder-${c.value}`}
                        onClick={() => addCylinderVision(c.value)}
                        className="aspect-square bg-graphite-900/50 border border-white/5 rounded-lg flex items-center justify-center hover:bg-graphite-700 transition-all group"
                        title={`Cilindro ${c.name}`}
                      >
                        <div className="relative w-8 h-12 flex flex-col items-center justify-end">
                          <div 
                            className="w-6 h-10" 
                            style={{ 
                              background: `linear-gradient(to top, ${c.value}, transparent)`
                            }} 
                          />
                          <div className="w-8 h-2.5 border-2 border-dashed rounded-full -mt-1" style={{ borderColor: c.value }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Colored Zones */}
            <section>
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-premium-muted mb-4">ZONAS TÁTICAS</h2>
              <div className="space-y-4">
                {['rect', 'circle', 'oval'].map((type) => (
                  <div key={type} className="space-y-2">
                    <h3 className="text-[9px] font-bold text-premium-muted uppercase">{type}</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {TACTICAL_COLORS.slice(0, 4).map((c) => (
                        <React.Fragment key={`${type}-${c.value}`}>
                          <button
                            onClick={() => addColoredZone(c.value, type as any, false)}
                            className="aspect-square bg-graphite-900/50 border border-white/5 rounded-lg flex items-center justify-center hover:bg-graphite-700 transition-all"
                          >
                            <div className="w-6 h-6 rounded-sm" style={{ backgroundColor: c.value + '66' }} />
                          </button>
                          <button
                            onClick={() => addColoredZone(c.value, type as any, true)}
                            className="aspect-square bg-graphite-900/50 border border-white/5 rounded-lg flex items-center justify-center hover:bg-graphite-700 transition-all"
                          >
                            <div className="w-6 h-6 rounded-sm overflow-hidden relative">
                               <div className="absolute inset-0" style={{ 
                                 backgroundImage: `linear-gradient(45deg, ${c.value} 25%, transparent 25%, transparent 50%, ${c.value} 50%, ${c.value} 75%, transparent 75%, transparent)`,
                                 backgroundSize: '4px 4px'
                               }} />
                            </div>
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Highlights */}
            <section>
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-premium-muted mb-4">HIGHLIGHTS (SPOTLIGHTS)</h2>
              <div className="grid grid-cols-3 gap-2">
                {['cone', 'ellipse', 'cylinder'].map((type) => (
                  <button
                    key={`spotlight-${type}`}
                    onClick={() => addSpotlight('#ffffff', type as any)}
                    className="aspect-square bg-graphite-900/50 border border-white/5 rounded-lg flex flex-col items-center justify-center hover:bg-graphite-700 transition-all gap-1"
                  >
                    {type === 'cone' && <div className="w-6 h-8" style={{ clipPath: 'polygon(50% 0, 0 100%, 100% 100%)', background: 'linear-gradient(to top, #ffffff44, transparent)' }} />}
                    {type === 'ellipse' && <div className="w-8 h-4 rounded-full" style={{ background: 'radial-gradient(circle, #ffffff44, transparent)' }} />}
                    {type === 'cylinder' && <div className="w-6 h-8 rounded-t-full" style={{ background: 'linear-gradient(to top, #ffffff44, transparent)' }} />}
                    <span className="text-[8px] font-bold uppercase text-premium-muted">{type}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Active Color */}
            <section className="pt-4 border-t border-white/10">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-premium-muted mb-3">COR ATIVA</h2>
              <div className="grid grid-cols-4 gap-2">
                {TACTICAL_COLORS.map((c) => (
                  <button
                    key={`active-color-${c.value}`}
                    onClick={() => handleColorChange(c.value)}
                    className={`aspect-square rounded-full border-2 transition-all ${color === c.value ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </section>
          </div>
        </aside>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      ` }} />
    </div>
  );
};

export default FreeFireTacticalBoard;
