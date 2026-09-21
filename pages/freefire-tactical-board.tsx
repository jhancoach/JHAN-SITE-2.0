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
  ArrowUpRight, 
  Minus, 
  X, 
  Check, 
  Layers, 
  Copy, 
  Undo2, 
  Redo2, 
  Maximize2, 
  Move, 
  RotateCw, 
  Zap, 
  Hand, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Map as MapIcon, 
  Palette, 
  Sliders, 
  ChevronUp, 
  ChevronDown, 
  Eye, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Share2, 
  Plus
} from 'lucide-react';
import { MAPS_DATA, MAPS_PINGOS_DATA } from '../constants';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);

  // Tools & State
  const [activeTool, setActiveTool] = useState<string>('select');
  const [color, setColor] = useState<string>('#ef4444');
  const [brushSize, setBrushSize] = useState<number>(4);
  const [fontSize, setFontSize] = useState<number>(24);
  const [isBold, setIsBold] = useState<boolean>(true);
  const [textBg, setTextBg] = useState<boolean>(false);
  const [selectedTextObj, setSelectedTextObj] = useState<any>(null);
  const [selectedAnyObj, setSelectedAnyObj] = useState<any>(null);
  const [editingTextValue, setEditingTextValue] = useState<string>('');

  // Map & Zoom state
  const [activeMapName, setActiveMapName] = useState<string>('Bermuda');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isMapModalOpen, setIsMapModalOpen] = useState<boolean>(false);
  const [mapTab, setMapTab] = useState<'clean' | 'pingos'>('clean');

  // Mobile drawer & UI state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [mobileDrawerTab, setMobileDrawerTab] = useState<'players' | 'shapes' | 'tactics' | 'settings'>('players');
  const [isColorPickerOpen, setIsColorPickerOpen] = useState<boolean>(false);
  const [showDesktopSidebars, setShowDesktopSidebars] = useState<boolean>(true);

  // Undo/Redo state
  const history = useRef<string[]>([]);
  const historyIndex = useRef<number>(-1);
  const isRedoing = useRef<boolean>(false);

  const saveHistory = useCallback(() => {
    if (!fabricCanvas.current || isRedoing.current) return;
    const json = JSON.stringify(fabricCanvas.current.toJSON());
    
    if (historyIndex.current < history.current.length - 1) {
      history.current = history.current.slice(0, historyIndex.current + 1);
    }
    
    history.current.push(json);
    historyIndex.current = history.current.length - 1;
    
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

  // Helper to spawn objects right in current viewport center
  const getViewportCenter = useCallback(() => {
    if (!fabricCanvas.current) return { left: 200, top: 200 };
    const canvas = fabricCanvas.current;
    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
    const zoom = canvas.getZoom() || 1;
    const viewWidth = canvas.getWidth();
    const viewHeight = canvas.getHeight();
    return {
      left: (viewWidth / 2 - vpt[4]) / zoom,
      top: (viewHeight / 2 - vpt[5]) / zoom,
    };
  }, []);

  // Set Background Image from URL
  const setMapBackground = useCallback((mapUrl: string, mapName: string) => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;

    fabric.Image.fromURL(mapUrl, { crossOrigin: 'anonymous' }).then((img) => {
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      const imageWidth = img.width || 1;
      const imageHeight = img.height || 1;

      const scaleFactor = Math.min(
        canvasWidth / imageWidth,
        canvasHeight / imageHeight
      );

      img.set({
        originX: 'center',
        originY: 'center',
        left: canvasWidth / 2,
        top: canvasHeight / 2,
        selectable: false,
        evented: false,
      });

      img.scale(scaleFactor);

      canvas.backgroundImage = img;
      canvas.renderAll();
      setActiveMapName(mapName);
      setIsMapModalOpen(false);
      saveHistory();
    }).catch((err) => {
      console.warn('Erro ao carregar mapa:', err);
    });
  }, [saveHistory]);

  // Zoom controls
  const handleZoomIn = () => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;
    const newZoom = Math.min(canvas.getZoom() * 1.25, 5);
    const center = new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2);
    canvas.zoomToPoint(center, newZoom);
    setZoomLevel(Math.round(newZoom * 100));
  };

  const handleZoomOut = () => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;
    const newZoom = Math.max(canvas.getZoom() / 1.25, 0.4);
    const center = new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2);
    canvas.zoomToPoint(center, newZoom);
    setZoomLevel(Math.round(newZoom * 100));
  };

  const handleResetZoom = () => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    setZoomLevel(100);
    canvas.requestRenderAll();
  };

  // Canvas Initialization & Event Listeners
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const initialWidth = container.clientWidth || 800;
    const initialHeight = container.clientHeight || 600;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: initialWidth,
      height: initialHeight,
      backgroundColor: '#121214',
      preserveObjectStacking: true,
      selection: true,
    });

    fabricCanvas.current = canvas;

    // Load initial Bermuda map
    setMapBackground(MAPS_DATA[0].imageUrl, MAPS_DATA[0].name);

    // ResizeObserver for rock-solid responsive container sizing
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && fabricCanvas.current) {
          fabricCanvas.current.setDimensions({ width, height });
          
          // Re-center and re-scale background if present
          if (fabricCanvas.current.backgroundImage) {
            const bg = fabricCanvas.current.backgroundImage as fabric.Image;
            const bgW = bg.width || 1;
            const bgH = bg.height || 1;
            const scale = Math.min(width / bgW, height / bgH);
            bg.set({
              left: width / 2,
              top: height / 2,
            });
            bg.scale(scale);
          }
          fabricCanvas.current.renderAll();
        }
      }
    });

    resizeObserver.observe(container);

    // Initial history
    saveHistory();

    canvas.on('object:added', saveHistory);
    canvas.on('object:modified', saveHistory);
    canvas.on('object:removed', saveHistory);

    const handleSelection = () => {
      const activeObject = canvas.getActiveObject();
      setSelectedAnyObj(activeObject || null);
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
      setSelectedAnyObj(null);
      setSelectedTextObj(null);
      setEditingTextValue('');
    });
    canvas.on('text:changed', (e) => {
      if (e.target && (e.target.type === 'i-text' || e.target.type === 'text')) {
        setEditingTextValue((e.target as any).text || '');
      }
    });

    // Mouse Wheel Zoom
    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 5) zoom = 5;
      if (zoom < 0.4) zoom = 0.4;
      canvas.zoomToPoint(new fabric.Point(opt.e.offsetX, opt.e.offsetY), zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
      setZoomLevel(Math.round(zoom * 100));
    });

    // Mouse Pan Dragging
    let isDragging = false;
    let lastPosX = 0;
    let lastPosY = 0;

    canvas.on('mouse:down', (opt) => {
      const evt = opt.e as MouseEvent;
      if (canvas.defaultCursor === 'grab' || evt.altKey || evt.button === 1) {
        isDragging = true;
        canvas.selection = false;
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
      }
    });

    canvas.on('mouse:move', (opt) => {
      if (isDragging) {
        const e = opt.e as MouseEvent;
        canvas.relativePan(new fabric.Point(e.clientX - lastPosX, e.clientY - lastPosY));
        lastPosX = e.clientX;
        lastPosY = e.clientY;
      }
    });

    canvas.on('mouse:up', () => {
      if (isDragging) {
        if (canvas.viewportTransform) {
          canvas.setViewportTransform(canvas.viewportTransform);
        }
        isDragging = false;
        canvas.selection = activeTool === 'select';
      }
    });

    // Native Touch Gesture Handling (Pinch-to-zoom & Touch Pan for Mobile)
    let initialPinchDist = 0;
    let initialPinchZoom = 1;
    let initialCenter = { x: 0, y: 0 };
    let singleTouchPanStart = { x: 0, y: 0 };
    let isSingleTouchPanning = false;

    const onNativeTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2 && fabricCanvas.current) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        initialPinchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        initialPinchZoom = fabricCanvas.current.getZoom();
        initialCenter = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
        };
      } else if (e.touches.length === 1 && activeTool === 'pan' && fabricCanvas.current) {
        isSingleTouchPanning = true;
        singleTouchPanStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onNativeTouchMove = (e: TouchEvent) => {
      if (!fabricCanvas.current) return;
      const cvs = fabricCanvas.current;

      if (e.touches.length === 2 && initialPinchDist > 0) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const center = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
        };

        const rect = container.getBoundingClientRect();
        const point = new fabric.Point(center.x - rect.left, center.y - rect.top);
        const nextZoom = Math.min(Math.max(initialPinchZoom * (currentDist / initialPinchDist), 0.4), 5);
        cvs.zoomToPoint(point, nextZoom);
        setZoomLevel(Math.round(nextZoom * 100));

        const deltaX = center.x - initialCenter.x;
        const deltaY = center.y - initialCenter.y;
        cvs.relativePan(new fabric.Point(deltaX * 0.7, deltaY * 0.7));
        initialCenter = center;
      } else if (e.touches.length === 1 && isSingleTouchPanning) {
        e.preventDefault();
        const touch = e.touches[0];
        const deltaX = touch.clientX - singleTouchPanStart.x;
        const deltaY = touch.clientY - singleTouchPanStart.y;
        cvs.relativePan(new fabric.Point(deltaX, deltaY));
        singleTouchPanStart = { x: touch.clientX, y: touch.clientY };
      }
    };

    const onNativeTouchEnd = () => {
      initialPinchDist = 0;
      isSingleTouchPanning = false;
    };

    container.addEventListener('touchstart', onNativeTouchStart, { passive: false });
    container.addEventListener('touchmove', onNativeTouchMove, { passive: false });
    container.addEventListener('touchend', onNativeTouchEnd);
    container.addEventListener('touchcancel', onNativeTouchEnd);

    // Keyboard Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
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
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener('touchstart', onNativeTouchStart);
      container.removeEventListener('touchmove', onNativeTouchMove);
      container.removeEventListener('touchend', onNativeTouchEnd);
      container.removeEventListener('touchcancel', onNativeTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
      canvas.dispose();
    };
  }, [undo, redo, saveHistory, setMapBackground]);

  // Handle active tool updates
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

    if (activeTool === 'pan') {
      canvas.defaultCursor = 'grab';
      canvas.selection = false;
      canvas.forEachObject((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });
    } else {
      canvas.defaultCursor = activeTool === 'select' ? 'default' : 'crosshair';
      canvas.selection = activeTool === 'select';
      canvas.forEachObject((obj) => {
        obj.selectable = activeTool === 'select';
        obj.evented = activeTool === 'select';
      });
    }
  }, [activeTool, color, brushSize]);

  // Modify active color
  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    if (fabricCanvas.current) {
      const activeObj = fabricCanvas.current.getActiveObject();
      if (activeObj) {
        if (activeObj.type === 'i-text' || activeObj.type === 'text') {
          activeObj.set({ fill: newColor });
        } else if (activeObj instanceof fabric.Group) {
          activeObj.forEachObject((o) => {
            if (o instanceof fabric.Circle || o instanceof fabric.Rect || o instanceof fabric.Ellipse) {
              o.set({ stroke: newColor });
            }
            if (o instanceof fabric.Text) {
              o.set({ fill: newColor });
            }
          });
        } else {
          if ((activeObj as any).stroke) activeObj.set({ stroke: newColor });
          if ((activeObj as any).fill && (activeObj as any).fill !== 'transparent') {
            activeObj.set({ fill: newColor });
          }
        }
        fabricCanvas.current.renderAll();
        fabricCanvas.current.fire('object:modified', { target: activeObj });
      }
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
      selectedTextObj.set({ backgroundColor: nextBg ? 'rgba(0,0,0,0.7)' : 'transparent' });
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

  const deleteSelected = () => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;
    const activeObjects = canvas.getActiveObjects();
    canvas.remove(...activeObjects);
    canvas.discardActiveObject();
    canvas.renderAll();
  };

  const clearAllDrawings = () => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;
    const objects = canvas.getObjects();
    if (objects.length === 0) return;
    if (window.confirm('Deseja limpar todos os desenhos e marcações do quadro tático?')) {
      canvas.clear();
      if (canvas.backgroundImage) {
        const bg = canvas.backgroundImage;
        canvas.backgroundImage = bg;
      }
      canvas.backgroundColor = '#121214';
      canvas.renderAll();
      saveHistory();
    }
  };

  // Add Shapes
  const addShape = (type: string, options: any = {}) => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;
    const center = getViewportCenter();
    let shape: fabric.Object;

    const common = {
      left: center.left,
      top: center.top,
      originX: 'center' as any,
      originY: 'center' as any,
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
        shape = new fabric.Circle({ ...common, radius: 45 });
        break;
      case 'triangle':
        shape = new fabric.Triangle({ ...common, width: 80, height: 80 });
        break;
      case 'oval':
        shape = new fabric.Ellipse({ ...common, rx: 60, ry: 40 });
        break;
      case 'line':
        shape = new fabric.Line([-75, 0, 75, 0], { ...common });
        break;
      case 'dashed-line':
        shape = new fabric.Line([-75, 0, 75, 0], { ...common, strokeDashArray: [10, 5] });
        break;
      case 'arrow':
        shape = new fabric.Path('M 0 0 L 150 0 M 150 0 L 130 -10 M 150 0 L 130 10', {
          ...common,
          originX: 'center',
          originY: 'center',
          fill: 'transparent',
          strokeLineCap: 'round',
          strokeLineJoin: 'round'
        });
        break;
      case 'double-arrow':
        shape = new fabric.Path('M 0 0 L 150 0 M 150 0 L 130 -10 M 150 0 L 130 10 M 0 0 L 20 -10 M 0 0 L 20 10', {
          ...common,
          originX: 'center',
          originY: 'center',
          fill: 'transparent',
          strokeLineCap: 'round',
          strokeLineJoin: 'round'
        });
        break;
      case 'curved-arrow':
        shape = new fabric.Path('M 0 50 Q 75 0 150 50 M 150 50 L 135 40 M 150 50 L 145 35', {
          ...common,
          originX: 'center',
          originY: 'center',
          fill: 'transparent',
          strokeLineCap: 'round',
          strokeLineJoin: 'round'
        });
        break;
      case 'zigzag':
        shape = new fabric.Path('M 0 0 L 25 20 L 50 0 L 75 20 L 100 0 L 125 20 L 150 0', {
          ...common,
          originX: 'center',
          originY: 'center',
          fill: 'transparent',
        });
        break;
      case 'x':
        shape = new fabric.Text('X', { ...common, fontSize: 36, fill: color, strokeWidth: 0, fontWeight: 'bold' });
        break;
      case 'check':
        shape = new fabric.Text('✓', { ...common, fontSize: 36, fill: color, strokeWidth: 0, fontWeight: 'bold' });
        break;
      default:
        return;
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    setActiveTool('select');
    setIsMobileDrawerOpen(false);
  };

  const addText = () => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;
    const center = getViewportCenter();
    
    const text = new fabric.IText('Nota Tática', {
      left: center.left,
      top: center.top,
      originX: 'center',
      originY: 'center',
      fontSize: fontSize,
      fill: color,
      fontWeight: isBold ? 'bold' : 'normal',
      stroke: 'black',
      strokeWidth: 1.5,
      backgroundColor: textBg ? 'rgba(0,0,0,0.7)' : 'transparent',
      fontFamily: 'Inter, sans-serif'
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    setActiveTool('select');
    setIsMobileDrawerOpen(false);
  };

  const addPlayer = (num: number, playerColor: string) => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;
    const center = getViewportCenter();

    const circle = new fabric.Circle({
      radius: 22,
      stroke: playerColor,
      strokeWidth: 4,
      fill: 'rgba(0,0,0,0.4)',
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

    const labelText = new fabric.Text(`P${num}`, {
      fontSize: 11,
      fontWeight: 'bold',
      fill: 'white',
      backgroundColor: 'rgba(0,0,0,0.7)',
      top: 28,
      originX: 'center',
      originY: 'top',
      fontFamily: 'Inter, sans-serif',
      padding: 2
    });

    const group = new fabric.Group([circle, numberText, labelText], {
      left: center.left,
      top: center.top,
      originX: 'center',
      originY: 'center',
    });

    canvas.add(group);
    canvas.setActiveObject(group);
    setActiveTool('select');
    setIsMobileDrawerOpen(false);
  };

  const addTacticalRing = (c: string, double: boolean) => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;
    const center = getViewportCenter();
    
    const ringOptions = {
      rx: 55,
      ry: 22,
      fill: 'transparent',
      stroke: c,
      strokeWidth: 3,
      strokeDashArray: [8, 6],
      strokeUniform: true,
      originX: 'center' as any,
      originY: 'center' as any
    };

    if (double) {
      const ring1 = new fabric.Ellipse({ ...ringOptions, top: -8 });
      const ring2 = new fabric.Ellipse({ ...ringOptions, top: 8 });
      const group = new fabric.Group([ring1, ring2], {
        left: center.left,
        top: center.top,
        originX: 'center' as any,
        originY: 'center' as any
      });
      canvas.add(group);
      canvas.setActiveObject(group);
    } else {
      const ring = new fabric.Ellipse({ ...ringOptions, left: center.left, top: center.top });
      canvas.add(ring);
      canvas.setActiveObject(ring);
    }
    setActiveTool('select');
    setIsMobileDrawerOpen(false);
  };

  const addVisionCone = (c: string) => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;
    const center = getViewportCenter();

    const triangle = new fabric.Triangle({
      width: 70,
      height: 150,
      fill: new fabric.Gradient({
        type: 'linear',
        coords: { x1: 0, y1: 150, x2: 0, y2: 0 },
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
      left: center.left,
      top: center.top,
      originX: 'center' as any,
      originY: 'center' as any
    });

    canvas.add(group);
    canvas.setActiveObject(group);
    setActiveTool('select');
    setIsMobileDrawerOpen(false);
  };

  const addCylinderVision = (c: string) => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;
    const center = getViewportCenter();

    const rect = new fabric.Rect({
      width: 75,
      height: 150,
      fill: new fabric.Gradient({
        type: 'linear',
        coords: { x1: 0, y1: 0, x2: 0, y2: 150 },
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
      rx: 37,
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
      left: center.left,
      top: center.top,
      originX: 'center',
      originY: 'center'
    });

    canvas.add(group);
    canvas.setActiveObject(group);
    setActiveTool('select');
    setIsMobileDrawerOpen(false);
  };

  const addColoredZone = (c: string, type: 'rect' | 'circle' | 'oval', pattern: boolean) => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;
    const center = getViewportCenter();
    
    let shape: fabric.Object;
    const common = {
      left: center.left,
      top: center.top,
      originX: 'center' as any,
      originY: 'center' as any,
      fill: c + '55',
      stroke: c,
      strokeWidth: 2,
      strokeUniform: true,
    };

    if (pattern) {
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
        shape = new fabric.Rect({ ...common, width: 140, height: 90 });
        break;
      case 'circle':
        shape = new fabric.Circle({ ...common, radius: 55 });
        break;
      case 'oval':
        shape = new fabric.Ellipse({ ...common, rx: 75, ry: 45 });
        break;
      default:
        return;
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    setActiveTool('select');
    setIsMobileDrawerOpen(false);
  };

  const addSpotlight = (c: string, type: 'cone' | 'ellipse' | 'cylinder') => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;
    const center = getViewportCenter();
    
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
          width: 90,
          height: 140,
          fill: new fabric.Gradient(gradientOptions as any) as any,
          left: center.left,
          top: center.top,
          originX: 'center' as any,
          originY: 'bottom' as any
        });
        break;
      case 'ellipse':
        shape = new fabric.Ellipse({
          rx: 55,
          ry: 28,
          fill: new fabric.Gradient({
            type: 'radial',
            coords: { r1: 0, r2: 55, x1: 55, y1: 28, x2: 55, y2: 28 },
            colorStops: [
              { offset: 0, color: c + '88' },
              { offset: 1, color: 'transparent' }
            ]
          } as any) as any,
          left: center.left,
          top: center.top,
          originX: 'center' as any,
          originY: 'center' as any
        });
        break;
      case 'cylinder':
        shape = new fabric.Rect({
          width: 75,
          height: 140,
          fill: new fabric.Gradient(gradientOptions as any) as any,
          left: center.left,
          top: center.top,
          originX: 'center' as any,
          originY: 'bottom' as any,
          rx: 37,
          ry: 10
        });
        break;
      default:
        return;
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    setActiveTool('select');
    setIsMobileDrawerOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvas.current) return;

    const reader = new FileReader();
    reader.onload = (f) => {
      const data = f.target?.result;
      if (typeof data !== 'string') return;
      setMapBackground(data, 'Print Custom');
    };
    reader.readAsDataURL(file);
  };

  const exportCanvas = () => {
    if (!fabricCanvas.current) return;
    const dataURL = fabricCanvas.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });
    const link = document.createElement('a');
    link.download = `quadro-tatico-${activeMapName.toLowerCase()}-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] md:h-[calc(100dvh-4.5rem)] w-full bg-graphite-950 text-gray-100 overflow-hidden font-sans relative select-none">
      
      {/* TOP HEADER */}
      <header className="h-13 md:h-14 border-b border-white/10 flex items-center justify-between px-3 md:px-6 bg-graphite-900 shrink-0 z-20 gap-2">
        {/* Left branding & map picker trigger */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <div className="w-8 h-8 bg-loud-500 rounded-lg flex items-center justify-center text-graphite-950 font-black text-xs shadow-md shadow-loud-500/20">
            FF
          </div>
          <span className="text-xs md:text-sm font-black uppercase tracking-tight hidden sm:inline">
            Quadro Tático
          </span>

          {/* Active Map Selector Pill */}
          <button
            onClick={() => setIsMapModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-graphite-800 hover:bg-graphite-700 text-white rounded-lg text-xs font-bold border border-white/10 transition-colors shadow-sm cursor-pointer"
            title="Trocar Mapa"
          >
            <MapIcon size={14} className="text-loud-500" />
            <span className="truncate max-w-[90px] sm:max-w-[140px] uppercase">{activeMapName}</span>
          </button>
        </div>

        {/* Center/Right Actions */}
        <div className="flex items-center gap-1.5 md:gap-3">
          {/* Undo / Redo */}
          <div className="flex items-center bg-graphite-800 rounded-lg p-0.5 border border-white/5">
            <button 
              onClick={undo} 
              className="p-1.5 md:p-2 text-gray-300 hover:text-white hover:bg-graphite-700 rounded-md transition-colors cursor-pointer" 
              title="Desfazer (Ctrl+Z)"
            >
              <Undo2 size={16} />
            </button>
            <button 
              onClick={redo} 
              className="p-1.5 md:p-2 text-gray-300 hover:text-white hover:bg-graphite-700 rounded-md transition-colors cursor-pointer" 
              title="Refazer (Ctrl+Y)"
            >
              <Redo2 size={16} />
            </button>
          </div>

          {/* Upload Screenshot */}
          <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-graphite-800 hover:bg-graphite-700 rounded-lg cursor-pointer transition-colors text-xs font-bold border border-white/10 text-gray-200">
            <Upload size={14} className="text-loud-500" />
            <span className="hidden md:inline">PRINT</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
          </label>

          {/* Export Strategy */}
          <button 
            onClick={exportCanvas}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-loud-500 hover:bg-loud-600 text-graphite-950 rounded-lg transition-all text-xs font-black shadow-lg shadow-loud-500/20 active:scale-95 cursor-pointer"
            title="Exportar imagem do quadro em alta resolução"
          >
            <Download size={14} />
            <span className="hidden sm:inline">BAIXAR</span>
          </button>

          {/* Toggle desktop sidebars */}
          <button
            onClick={() => setShowDesktopSidebars(!showDesktopSidebars)}
            className="hidden lg:flex items-center gap-1 p-2 bg-graphite-800 hover:bg-graphite-700 rounded-lg text-gray-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title={showDesktopSidebars ? 'Ocultar Barras Laterais' : 'Mostrar Barras Laterais'}
          >
            {showDesktopSidebars ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* DESKTOP LEFT SIDEBAR */}
        {showDesktopSidebars && (
          <aside className="hidden lg:flex w-64 xl:w-72 border-r border-white/10 bg-graphite-900 flex-col shrink-0 overflow-y-auto scrollbar-hide z-10">
            <div className="p-3.5 space-y-5">
              {/* Core Tools */}
              <section>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-premium-muted mb-2">FERRAMENTAS</h2>
                <div className="grid grid-cols-2 gap-1.5">
                  <button 
                    onClick={() => setActiveTool('select')}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${activeTool === 'select' ? 'bg-loud-500 text-graphite-950 border-loud-500 shadow-md' : 'bg-graphite-800/80 border-white/5 text-gray-300 hover:border-white/20'}`}
                  >
                    <MousePointer2 size={14} /> SELECIONAR
                  </button>
                  <button 
                    onClick={() => setActiveTool('draw')}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${activeTool === 'draw' ? 'bg-loud-500 text-graphite-950 border-loud-500 shadow-md' : 'bg-graphite-800/80 border-white/5 text-gray-300 hover:border-white/20'}`}
                  >
                    <Pencil size={14} /> DESENHAR
                  </button>
                  <button 
                    onClick={() => setActiveTool('pan')}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${activeTool === 'pan' ? 'bg-loud-500 text-graphite-950 border-loud-500 shadow-md' : 'bg-graphite-800/80 border-white/5 text-gray-300 hover:border-white/20'}`}
                  >
                    <Hand size={14} /> MOVER MAPA
                  </button>
                  <button 
                    onClick={addText}
                    className="flex items-center gap-2 p-2 rounded-xl text-xs font-bold bg-graphite-800/80 border border-white/5 text-gray-300 hover:border-white/20 transition-all cursor-pointer"
                  >
                    <Type size={14} /> TEXTO
                  </button>
                </div>
              </section>

              {/* Lines & Shapes */}
              <section>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-premium-muted mb-2">LINHAS E FORMAS</h2>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { icon: <Minus size={18} />, type: 'line', name: 'Linha Reta' },
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
                      className="aspect-square bg-graphite-800/80 border border-white/5 rounded-xl flex items-center justify-center hover:bg-graphite-700 hover:border-white/20 transition-all cursor-pointer group"
                      title={item.name}
                    >
                      <div className="group-hover:scale-115 transition-transform">{item.icon}</div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Players */}
              <section>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-loud-500 mb-2">PLAYERS</h2>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((num) => (
                    <div key={`player-row-${num}`} className="flex flex-col gap-1.5">
                      <span className="text-[9px] font-bold text-gray-400 uppercase">PLAYER {num}</span>
                      <div className="grid grid-cols-6 gap-1">
                        {TACTICAL_COLORS.slice(0, 6).map((c) => (
                          <button
                            key={`player-${num}-${c.value}`}
                            onClick={() => addPlayer(num, c.value)}
                            className="aspect-square bg-graphite-800/80 border border-white/5 rounded-lg flex items-center justify-center hover:bg-graphite-700 transition-all cursor-pointer"
                            title={`Add Player ${num} (${c.name})`}
                          >
                            <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-black" style={{ borderColor: c.value, color: c.value }}>
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
                <h2 className="text-[10px] font-black uppercase tracking-widest text-loud-500 mb-2">ANÉIS TÁTICOS</h2>
                <div className="space-y-2">
                  {TACTICAL_COLORS.map((c) => (
                    <div key={`rings-${c.value}`} className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => addTacticalRing(c.value, false)}
                        className="h-9 bg-graphite-800/80 border border-white/5 rounded-xl flex items-center justify-center hover:bg-graphite-700 transition-all cursor-pointer"
                        title={`Anel Simples ${c.name}`}
                      >
                        <div className="w-10 h-3 rounded-full border-2 border-dashed" style={{ borderColor: c.value }} />
                      </button>
                      <button
                        onClick={() => addTacticalRing(c.value, true)}
                        className="h-9 bg-graphite-800/80 border border-white/5 rounded-xl flex items-center justify-center hover:bg-graphite-700 transition-all cursor-pointer"
                        title={`Anel Duplo ${c.name}`}
                      >
                        <div className="relative w-10 h-5 flex flex-col items-center justify-center">
                          <div className="w-10 h-2.5 rounded-full border-2 border-dashed" style={{ borderColor: c.value }} />
                          <div className="w-10 h-2.5 rounded-full border-2 border-dashed -mt-1" style={{ borderColor: c.value }} />
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </aside>
        )}

        {/* CENTER CANVAS CONTAINER */}
        <main className="flex-1 bg-graphite-950 relative overflow-hidden flex flex-col min-w-0">
          
          {/* Desktop Subheader controls */}
          <div className="hidden sm:flex h-10 border-b border-white/5 bg-graphite-900 items-center px-4 justify-between shrink-0 text-xs">
            {/* Quick tips */}
            <div className="flex items-center gap-3 text-[10px] font-bold text-premium-muted uppercase tracking-wider">
              <span className="flex items-center gap-1"><Move size={12} /> Arrastar</span>
              <span className="flex items-center gap-1"><Maximize2 size={12} /> Redimensionar</span>
              <span className="flex items-center gap-1"><RotateCw size={12} /> Rotacionar</span>
            </div>

            {/* Brush & Stroke controls */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-premium-muted uppercase">Pincel:</span>
                <input 
                  type="range" min="1" max="24" value={brushSize} 
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="w-20 accent-loud-500 h-1 bg-graphite-700 rounded-full appearance-none cursor-pointer"
                />
                <span className="text-[10px] font-mono text-loud-500 w-4 font-bold">{brushSize}</span>
              </div>

              {/* Clear canvas */}
              <button 
                onClick={clearAllDrawings}
                className="text-[10px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20 cursor-pointer"
              >
                <Trash2 size={12} /> Limpar Quadro
              </button>
            </div>
          </div>

          {/* CANVAS STAGE */}
          <div 
            id="canvas-container" 
            ref={containerRef}
            className="flex-1 relative w-full h-full bg-graphite-950 overflow-hidden touch-none"
            style={{ touchAction: 'none' }}
          >
            <canvas ref={canvasRef} style={{ touchAction: 'none' }} />

            {/* FLOATING ZOOM CONTROLS (Both Mobile and Desktop) */}
            <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 bg-graphite-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-2xl">
              <button 
                onClick={handleZoomIn}
                className="w-9 h-9 flex items-center justify-center text-gray-200 hover:text-white hover:bg-white/10 rounded-xl transition-all active:scale-90 cursor-pointer"
                title="Aproximar (+)"
              >
                <ZoomIn size={18} />
              </button>
              <button 
                onClick={handleResetZoom}
                className="w-9 h-7 flex items-center justify-center text-[10px] font-mono font-bold text-loud-500 hover:bg-white/10 rounded-lg transition-all cursor-pointer"
                title="Resetar Zoom para 100%"
              >
                {zoomLevel}%
              </button>
              <button 
                onClick={handleZoomOut}
                className="w-9 h-9 flex items-center justify-center text-gray-200 hover:text-white hover:bg-white/10 rounded-xl transition-all active:scale-90 cursor-pointer"
                title="Afastar (-)"
              >
                <ZoomOut size={18} />
              </button>
              <button 
                onClick={() => setActiveTool(activeTool === 'pan' ? 'select' : 'pan')}
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90 cursor-pointer ${activeTool === 'pan' ? 'bg-loud-500 text-graphite-950 font-bold' : 'text-gray-200 hover:text-white hover:bg-white/10'}`}
                title="Ferramenta Mover (Pan)"
              >
                <Hand size={18} />
              </button>
            </div>

            {/* FLOATING SELECTION CONTEXT BAR (When Object Selected) */}
            {selectedAnyObj && (
              <div className="absolute top-3 left-3 right-16 sm:right-auto z-10 flex items-center gap-2 bg-graphite-900/95 backdrop-blur-md p-2 rounded-2xl border border-white/15 shadow-2xl animate-fade-in-up">
                {selectedTextObj ? (
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <input 
                      type="text"
                      value={editingTextValue}
                      onChange={(e) => handleTextChange(e.target.value)}
                      className="bg-graphite-800 border border-white/20 rounded-xl px-2.5 py-1 text-xs text-white outline-none w-32 sm:w-48 font-bold"
                      placeholder="Texto..."
                    />
                    <button 
                      onClick={handleBoldToggle}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${isBold ? 'bg-loud-500 text-graphite-950 border-loud-500' : 'bg-graphite-800 border-white/10 text-gray-400'}`}
                    >
                      B
                    </button>
                    <button 
                      onClick={handleBgToggle}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${textBg ? 'bg-loud-500 text-graphite-950 border-loud-500' : 'bg-graphite-800 border-white/10 text-gray-400'}`}
                    >
                      BG
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] font-bold text-premium-muted uppercase hidden sm:inline">Elemento Selecionado</span>
                )}

                <div className="flex items-center gap-1.5 ml-auto">
                  <button 
                    onClick={duplicateSelected}
                    className="p-2 bg-graphite-800 hover:bg-graphite-700 text-gray-200 rounded-xl border border-white/10 transition-all cursor-pointer"
                    title="Duplicar"
                  >
                    <Copy size={14} />
                  </button>
                  <button 
                    onClick={deleteSelected}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl border border-red-500/30 transition-all cursor-pointer"
                    title="Deletar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* MOBILE BOTTOM DOCK (Visible on < lg screens) */}
          <div className="lg:hidden border-t border-white/10 bg-graphite-900/95 backdrop-blur-lg px-2 py-2 flex items-center justify-around shrink-0 z-20">
            {/* Pointer / Select */}
            <button
              onClick={() => setActiveTool('select')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer min-w-[44px] min-h-[44px] ${activeTool === 'select' ? 'text-loud-500 bg-loud-500/10' : 'text-gray-400 hover:text-white'}`}
            >
              <MousePointer2 size={20} />
              <span className="text-[9px] font-bold uppercase mt-0.5">Cursor</span>
            </button>

            {/* Draw Pen */}
            <button
              onClick={() => setActiveTool('draw')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer min-w-[44px] min-h-[44px] ${activeTool === 'draw' ? 'text-loud-500 bg-loud-500/10' : 'text-gray-400 hover:text-white'}`}
            >
              <Pencil size={20} />
              <span className="text-[9px] font-bold uppercase mt-0.5">Desenhar</span>
            </button>

            {/* Pan / Move */}
            <button
              onClick={() => setActiveTool('pan')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer min-w-[44px] min-h-[44px] ${activeTool === 'pan' ? 'text-loud-500 bg-loud-500/10' : 'text-gray-400 hover:text-white'}`}
            >
              <Hand size={20} />
              <span className="text-[9px] font-bold uppercase mt-0.5">Mover</span>
            </button>

            {/* Color Swatch Button */}
            <button
              onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
              className="flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer min-w-[44px] min-h-[44px] relative"
            >
              <div 
                className="w-5 h-5 rounded-full border-2 border-white/80 shadow-sm"
                style={{ backgroundColor: color }}
              />
              <span className="text-[9px] font-bold uppercase mt-0.5 text-gray-400">Cor</span>
            </button>

            {/* Text tool */}
            <button
              onClick={addText}
              className="flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer min-w-[44px] min-h-[44px] text-gray-400 hover:text-white"
            >
              <Type size={20} />
              <span className="text-[9px] font-bold uppercase mt-0.5">Texto</span>
            </button>

            {/* Open Elements Sheet (+) */}
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="flex flex-col items-center justify-center p-2 rounded-2xl bg-loud-500 text-graphite-950 font-black shadow-lg shadow-loud-500/20 active:scale-95 cursor-pointer min-w-[44px] min-h-[44px]"
            >
              <Plus size={22} strokeWidth={3} />
              <span className="text-[9px] font-black uppercase mt-0.5">Itens</span>
            </button>
          </div>
        </main>

        {/* DESKTOP RIGHT SIDEBAR */}
        {showDesktopSidebars && (
          <aside className="hidden lg:flex w-72 xl:w-80 border-l border-white/10 bg-graphite-900 flex-col shrink-0 overflow-y-auto scrollbar-hide z-10">
            <div className="p-3.5 space-y-6">
              {/* Active Color */}
              <section>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-premium-muted mb-2.5">COR ATIVA</h2>
                <div className="grid grid-cols-4 gap-2">
                  {TACTICAL_COLORS.map((c) => (
                    <button
                      key={`active-color-${c.value}`}
                      onClick={() => handleColorChange(c.value)}
                      className={`h-9 rounded-xl border-2 transition-all flex items-center justify-center cursor-pointer ${color === c.value ? 'border-white scale-105 shadow-lg' : 'border-transparent hover:scale-105 opacity-80'}`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    >
                      {color === c.value && <Check size={14} className={c.value === '#ffffff' ? 'text-black' : 'text-white'} strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </section>

              {/* Vision Fields */}
              <section>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-loud-500 mb-3">CAMPOS DE VISÃO</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[9px] font-bold text-premium-muted uppercase mb-1.5">Cones de Visão</h3>
                    <div className="grid grid-cols-4 gap-1.5">
                      {TACTICAL_COLORS.map((c) => (
                        <button
                          key={`vision-cone-${c.value}`}
                          onClick={() => addVisionCone(c.value)}
                          className="aspect-square bg-graphite-800/80 border border-white/5 rounded-xl flex items-center justify-center hover:bg-graphite-700 transition-all cursor-pointer group"
                          title={`Cone ${c.name}`}
                        >
                          <div className="relative w-7 h-10 flex flex-col items-center justify-end">
                            <div 
                              className="w-5 h-8" 
                              style={{ 
                                clipPath: 'polygon(50% 0, 0 100%, 100% 100%)',
                                background: `linear-gradient(to top, ${c.value}, transparent)`
                              }} 
                            />
                            <div className="w-7 h-2 border-2 border-dashed rounded-full -mt-1" style={{ borderColor: c.value }} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[9px] font-bold text-premium-muted uppercase mb-1.5">Spotlights Cilíndricos</h3>
                    <div className="grid grid-cols-4 gap-1.5">
                      {TACTICAL_COLORS.map((c) => (
                        <button
                          key={`vision-cylinder-${c.value}`}
                          onClick={() => addCylinderVision(c.value)}
                          className="aspect-square bg-graphite-800/80 border border-white/5 rounded-xl flex items-center justify-center hover:bg-graphite-700 transition-all cursor-pointer group"
                          title={`Cilindro ${c.name}`}
                        >
                          <div className="relative w-7 h-10 flex flex-col items-center justify-end">
                            <div 
                              className="w-5 h-8" 
                              style={{ 
                                background: `linear-gradient(to top, ${c.value}, transparent)`
                              }} 
                            />
                            <div className="w-7 h-2 border-2 border-dashed rounded-full -mt-1" style={{ borderColor: c.value }} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Tactical Zones */}
              <section>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-premium-muted mb-3">ZONAS TÁTICAS</h2>
                <div className="space-y-3">
                  {['rect', 'circle', 'oval'].map((type) => (
                    <div key={type} className="space-y-1.5">
                      <h3 className="text-[9px] font-bold text-premium-muted uppercase">{type}</h3>
                      <div className="grid grid-cols-4 gap-1.5">
                        {TACTICAL_COLORS.slice(0, 4).map((c) => (
                          <React.Fragment key={`${type}-${c.value}`}>
                            <button
                              onClick={() => addColoredZone(c.value, type as any, false)}
                              className="aspect-square bg-graphite-800/80 border border-white/5 rounded-xl flex items-center justify-center hover:bg-graphite-700 transition-all cursor-pointer"
                              title={`${type} sólida ${c.name}`}
                            >
                              <div className="w-5 h-5 rounded-md" style={{ backgroundColor: c.value + '66' }} />
                            </button>
                            <button
                              onClick={() => addColoredZone(c.value, type as any, true)}
                              className="aspect-square bg-graphite-800/80 border border-white/5 rounded-xl flex items-center justify-center hover:bg-graphite-700 transition-all cursor-pointer"
                              title={`${type} hachurada ${c.name}`}
                            >
                              <div className="w-5 h-5 rounded-md overflow-hidden relative">
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
                <h2 className="text-[10px] font-black uppercase tracking-widest text-premium-muted mb-3">HIGHLIGHTS (SPOTLIGHTS)</h2>
                <div className="grid grid-cols-3 gap-2">
                  {['cone', 'ellipse', 'cylinder'].map((type) => (
                    <button
                      key={`spotlight-${type}`}
                      onClick={() => addSpotlight('#ffffff', type as any)}
                      className="aspect-square bg-graphite-800/80 border border-white/5 rounded-xl flex flex-col items-center justify-center hover:bg-graphite-700 transition-all gap-1 cursor-pointer"
                    >
                      {type === 'cone' && <div className="w-5 h-7" style={{ clipPath: 'polygon(50% 0, 0 100%, 100% 100%)', background: 'linear-gradient(to top, #ffffff44, transparent)' }} />}
                      {type === 'ellipse' && <div className="w-7 h-3 rounded-full" style={{ background: 'radial-gradient(circle, #ffffff44, transparent)' }} />}
                      {type === 'cylinder' && <div className="w-5 h-7 rounded-t-full" style={{ background: 'linear-gradient(to top, #ffffff44, transparent)' }} />}
                      <span className="text-[8px] font-bold uppercase text-premium-muted">{type}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </aside>
        )}
      </div>

      {/* MOBILE BOTTOM SHEET DRAWER */}
      {isMobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full bg-graphite-900 border-t border-white/15 rounded-t-3xl max-h-[80vh] flex flex-col shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Handle & Header */}
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
              <div className="flex items-center gap-1 mt-2">
                <span className="font-display font-black text-sm uppercase text-white tracking-wider">Elementos Táticos</span>
              </div>
              <button 
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-full bg-graphite-800 text-gray-400 hover:text-white mt-2 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Navigation Tabs */}
            <div className="flex border-b border-white/10 bg-graphite-950/60 overflow-x-auto scrollbar-hide px-2">
              {[
                { id: 'players', label: 'Jogadores' },
                { id: 'shapes', label: 'Formas & Setas' },
                { id: 'tactics', label: 'Visão & Zonas' },
                { id: 'settings', label: 'Ajustes' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setMobileDrawerTab(tab.id as any)}
                  className={`px-4 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 cursor-pointer ${mobileDrawerTab === tab.id ? 'text-loud-500 border-loud-500 font-black' : 'text-gray-400 border-transparent hover:text-white'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Drawer Content */}
            <div className="p-4 overflow-y-auto space-y-6">
              {/* TAB: PLAYERS */}
              {mobileDrawerTab === 'players' && (
                <div className="space-y-4">
                  <p className="text-xs text-premium-muted">Toque para adicionar um jogador numerado no centro do mapa:</p>
                  {[1, 2, 3, 4].map((num) => (
                    <div key={`m-player-${num}`} className="space-y-2">
                      <span className="text-[10px] font-black text-loud-500 uppercase tracking-wider">JOGADOR {num}</span>
                      <div className="grid grid-cols-6 gap-2">
                        {TACTICAL_COLORS.slice(0, 6).map((c) => (
                          <button
                            key={`m-p-${num}-${c.value}`}
                            onClick={() => addPlayer(num, c.value)}
                            className="aspect-square bg-graphite-800 rounded-2xl border border-white/10 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black shadow-md" style={{ borderColor: c.value, color: c.value }}>
                              {num}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB: SHAPES */}
              {mobileDrawerTab === 'shapes' && (
                <div className="space-y-4">
                  <p className="text-xs text-premium-muted">Toque em qualquer forma ou seta para desenhar na call:</p>
                  <div className="grid grid-cols-4 gap-2.5">
                    {[
                      { icon: <Minus size={22} />, type: 'line', name: 'Linha Reta' },
                      { icon: <Minus size={22} className="opacity-50" />, type: 'dashed-line', name: 'Tracejada' },
                      { icon: <ArrowUpRight size={22} />, type: 'arrow', name: 'Seta' },
                      { icon: <ArrowUpRight size={22} className="rotate-45" />, type: 'double-arrow', name: 'Seta Dupla' },
                      { icon: <RotateCw size={22} />, type: 'curved-arrow', name: 'Curva' },
                      { icon: <Zap size={22} />, type: 'zigzag', name: 'ZigZag' },
                      { icon: <Square size={22} />, type: 'rect', name: 'Retângulo' },
                      { icon: <Circle size={22} />, type: 'circle', name: 'Círculo' },
                      { icon: <Triangle size={22} />, type: 'triangle', name: 'Triângulo' },
                      { icon: <Maximize2 size={22} className="rotate-45" />, type: 'oval', name: 'Oval' },
                      { icon: <X size={22} className="text-red-500" />, type: 'x', name: 'Marcação X' },
                      { icon: <Check size={22} className="text-green-500" />, type: 'check', name: 'Marcação OK' },
                    ].map((item) => (
                      <button
                        key={`m-shape-${item.type}`}
                        onClick={() => addShape(item.type)}
                        className="flex flex-col items-center justify-center p-3 bg-graphite-800 border border-white/10 rounded-2xl active:scale-90 transition-transform cursor-pointer gap-1"
                      >
                        {item.icon}
                        <span className="text-[9px] font-bold text-gray-300 text-center truncate w-full">{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: TACTICS */}
              {mobileDrawerTab === 'tactics' && (
                <div className="space-y-6">
                  {/* Tactical Rings */}
                  <div>
                    <h3 className="text-xs font-black uppercase text-loud-500 tracking-wider mb-2">Anéis Táticos</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {TACTICAL_COLORS.slice(0, 4).map((c) => (
                        <div key={`m-rings-${c.value}`} className="flex flex-col gap-1.5">
                          <button
                            onClick={() => addTacticalRing(c.value, false)}
                            className="h-11 bg-graphite-800 rounded-xl border border-white/10 flex items-center justify-center cursor-pointer active:scale-90"
                          >
                            <div className="w-9 h-3 rounded-full border-2 border-dashed" style={{ borderColor: c.value }} />
                          </button>
                          <button
                            onClick={() => addTacticalRing(c.value, true)}
                            className="h-11 bg-graphite-800 rounded-xl border border-white/10 flex items-center justify-center cursor-pointer active:scale-90"
                          >
                            <div className="flex flex-col items-center">
                              <div className="w-8 h-2 rounded-full border-2 border-dashed" style={{ borderColor: c.value }} />
                              <div className="w-8 h-2 rounded-full border-2 border-dashed -mt-1" style={{ borderColor: c.value }} />
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Vision Cones */}
                  <div>
                    <h3 className="text-xs font-black uppercase text-loud-500 tracking-wider mb-2">Cones de Visão</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {TACTICAL_COLORS.slice(0, 4).map((c) => (
                        <button
                          key={`m-cone-${c.value}`}
                          onClick={() => addVisionCone(c.value)}
                          className="h-16 bg-graphite-800 rounded-xl border border-white/10 flex flex-col items-center justify-end pb-1 cursor-pointer active:scale-90"
                        >
                          <div 
                            className="w-5 h-9" 
                            style={{ 
                              clipPath: 'polygon(50% 0, 0 100%, 100% 100%)',
                              background: `linear-gradient(to top, ${c.value}, transparent)`
                            }} 
                          />
                          <div className="w-7 h-2 border-2 border-dashed rounded-full -mt-1" style={{ borderColor: c.value }} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Spotlights */}
                  <div>
                    <h3 className="text-xs font-black uppercase text-loud-500 tracking-wider mb-2">Destaques (Spotlights)</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {['cone', 'ellipse', 'cylinder'].map((type) => (
                        <button
                          key={`m-spotlight-${type}`}
                          onClick={() => addSpotlight('#ffffff', type as any)}
                          className="h-14 bg-graphite-800 rounded-xl border border-white/10 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-90"
                        >
                          {type === 'cone' && <div className="w-6 h-6" style={{ clipPath: 'polygon(50% 0, 0 100%, 100% 100%)', background: 'linear-gradient(to top, #ffffff44, transparent)' }} />}
                          {type === 'ellipse' && <div className="w-7 h-3 rounded-full" style={{ background: 'radial-gradient(circle, #ffffff44, transparent)' }} />}
                          {type === 'cylinder' && <div className="w-6 h-6 rounded-t-full" style={{ background: 'linear-gradient(to top, #ffffff44, transparent)' }} />}
                          <span className="text-[9px] font-bold uppercase text-gray-300">{type}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: SETTINGS */}
              {mobileDrawerTab === 'settings' && (
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-black uppercase text-gray-300 block mb-2">
                      Espessura do Traço / Pincel ({brushSize}px)
                    </label>
                    <input 
                      type="range" min="1" max="24" value={brushSize} 
                      onChange={(e) => setBrushSize(parseInt(e.target.value))}
                      className="w-full accent-loud-500 h-2 bg-graphite-800 rounded-full appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase text-gray-300 block mb-2">
                      Tamanho do Texto ({fontSize}px)
                    </label>
                    <input 
                      type="range" min="12" max="64" value={fontSize} 
                      onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
                      className="w-full accent-loud-500 h-2 bg-graphite-800 rounded-full appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="pt-3 border-t border-white/10">
                    <button
                      onClick={() => {
                        clearAllDrawings();
                        setIsMobileDrawerOpen(false);
                      }}
                      className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-black rounded-2xl border border-red-500/30 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Trash2 size={16} /> Limpar Todos os Desenhos do Quadro
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QUICK COLOR PICKER POPUP (Mobile) */}
      {isColorPickerOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-xs flex items-end justify-center pb-20 px-4"
          onClick={() => setIsColorPickerOpen(false)}
        >
          <div 
            className="bg-graphite-900 border border-white/15 rounded-2xl p-4 shadow-2xl w-full max-w-sm space-y-3 animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-white">Escolha a Cor Tática</span>
              <button onClick={() => setIsColorPickerOpen(false)} className="text-gray-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {TACTICAL_COLORS.map((c) => (
                <button
                  key={`quick-c-${c.value}`}
                  onClick={() => {
                    handleColorChange(c.value);
                    setIsColorPickerOpen(false);
                  }}
                  className={`h-11 rounded-xl border-2 transition-all flex items-center justify-center cursor-pointer ${color === c.value ? 'border-white scale-105 shadow-lg' : 'border-transparent'}`}
                  style={{ backgroundColor: c.value }}
                >
                  {color === c.value && <Check size={16} className={c.value === '#ffffff' ? 'text-black' : 'text-white'} strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MAP SELECTION MODAL */}
      {isMapModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setIsMapModalOpen(false)}
        >
          <div 
            className="bg-graphite-900 border border-white/15 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapIcon className="text-loud-500" size={20} />
                <h3 className="font-display font-black text-base sm:text-lg uppercase text-white tracking-wide">
                  Selecionar Mapa do Free Fire
                </h3>
              </div>
              <button 
                onClick={() => setIsMapModalOpen(false)}
                className="p-1.5 rounded-full bg-graphite-800 text-gray-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Subtabs */}
            <div className="flex border-b border-white/10 bg-graphite-950/60 px-4">
              <button
                onClick={() => setMapTab('clean')}
                className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${mapTab === 'clean' ? 'text-loud-500 border-loud-500' : 'text-gray-400 border-transparent hover:text-white'}`}
              >
                Mapas Oficiais 4K
              </button>
              <button
                onClick={() => setMapTab('pingos')}
                className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${mapTab === 'pingos' ? 'text-loud-500 border-loud-500' : 'text-gray-400 border-transparent hover:text-white'}`}
              >
                Mapas com Pingos de Call
              </button>
            </div>

            {/* Map Grid */}
            <div className="p-4 sm:p-5 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {(mapTab === 'clean' ? MAPS_DATA : MAPS_PINGOS_DATA).map((map) => {
                const isCurrent = activeMapName === map.name;
                return (
                  <button
                    key={`${mapTab}-${map.name}`}
                    onClick={() => setMapBackground(map.imageUrl, map.name)}
                    className={`relative group aspect-video rounded-2xl overflow-hidden border-2 transition-all flex flex-col justify-end text-left cursor-pointer ${isCurrent ? 'border-loud-500 shadow-xl shadow-loud-500/20 scale-102' : 'border-white/10 hover:border-white/30'}`}
                  >
                    <img 
                      src={map.imageUrl} 
                      alt={map.name} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    <div className="relative p-2.5 z-10">
                      <span className="font-display font-black text-xs sm:text-sm text-white uppercase tracking-tight block">
                        {map.name}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] font-black text-loud-500 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                          <Check size={10} strokeWidth={3} /> Ativo no Quadro
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom upload option */}
            <div className="p-4 border-t border-white/10 bg-graphite-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-premium-muted text-center sm:text-left">
                Também é possível subir prints de partidas ou telas táticas do seu dispositivo:
              </span>
              <label className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-loud-500 hover:bg-loud-600 text-graphite-950 font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-loud-500/20 active:scale-95 transition-all">
                <Upload size={14} /> Carregar Meu Print
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Hide scrollbars style */}
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
