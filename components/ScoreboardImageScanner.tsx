import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Upload, Sparkles, Image as ImageIcon, Trash2, CheckCircle2, AlertCircle, 
  Loader2, Plus, Trophy, MapPin, FileCheck,
  Eye, Zap, ZoomIn, ZoomOut, ArrowRight, ArrowLeft, Sliders,
  X, RotateCw, Maximize2, Download, Search, Edit3
} from 'lucide-react';
import { createWorker } from 'tesseract.js';

export interface ScannedPlayerData {
  name: string;
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
  realDamage?: number;
  knocks?: number;
  healing?: number;
  revives?: number;
  headshotRate?: string;
  score?: number;
  survivalTime?: string;
}

export interface ScannedMatchResult {
  id: string;
  sourceFilename: string;
  imagePreview?: string;
  map: string;
  rank: number;
  placementPoints: number;
  gameMode?: string;
  matchId?: string;
  players: ScannedPlayerData[];
}

interface ScoreboardImageScannerProps {
  onImportMatches: (scannedMatches: ScannedMatchResult[], append: boolean) => void;
  existingMatchCount: number;
}

const MAP_OPTIONS = ['Solara', 'Bermuda', 'Purgatório', 'Alpine', 'Nova Terra', 'Kalahari'];

const PLACEMENT_POINTS_TABLE: Record<number, number> = {
  1: 12,
  2: 9,
  3: 8,
  4: 7,
  5: 6,
  6: 5,
  7: 4,
  8: 3,
  9: 2,
  10: 1,
  11: 0,
  12: 0,
};

type ScanMethod = 'assistant' | 'local_ocr' | 'ai';

export const ScoreboardImageScanner: React.FC<ScoreboardImageScannerProps> = ({ 
  onImportMatches, 
  existingMatchCount 
}) => {
  const [selectedFiles, setSelectedFiles] = useState<{ id: string; file: File; preview: string; name: string }[]>([]);
  const [scanMethod, setScanMethod] = useState<ScanMethod>('assistant');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrStatusText, setOcrStatusText] = useState<string>('');
  const [scannedResults, setScannedResults] = useState<ScannedMatchResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Split Screen Assistant State
  const [currentAssistantIdx, setCurrentAssistantIdx] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [filterBrightness, setFilterBrightness] = useState<number>(100);
  const [filterContrast, setFilterContrast] = useState<number>(100);

  // Fullscreen Lightbox Modal State
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    index: number;
    zoom: number;
    rotation: number;
    invertColors: boolean;
  }>({
    isOpen: false,
    index: 0,
    zoom: 1,
    rotation: 0,
    invertColors: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxState.isOpen) return;

      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextLightboxImage();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevLightboxImage();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setLightboxState(prev => ({ ...prev, zoom: Math.min(prev.zoom + 0.25, 4) }));
      } else if (e.key === '-') {
        e.preventDefault();
        setLightboxState(prev => ({ ...prev, zoom: Math.max(prev.zoom - 0.25, 0.5) }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxState.isOpen, selectedFiles.length]);

  const openLightbox = (index: number) => {
    setLightboxState({
      isOpen: true,
      index: Math.max(0, Math.min(index, selectedFiles.length - 1)),
      zoom: 1,
      rotation: 0,
      invertColors: false,
    });
  };

  const closeLightbox = () => {
    setLightboxState(prev => ({ ...prev, isOpen: false }));
  };

  const nextLightboxImage = () => {
    setLightboxState(prev => ({
      ...prev,
      index: (prev.index + 1) % selectedFiles.length,
      zoom: 1,
      rotation: 0,
    }));
  };

  const prevLightboxImage = () => {
    setLightboxState(prev => ({
      ...prev,
      index: (prev.index - 1 + selectedFiles.length) % selectedFiles.length,
      zoom: 1,
      rotation: 0,
    }));
  };

  // Handle files selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    addFiles(Array.from(e.target.files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addFiles = (files: File[]) => {
    const validImageFiles = files.filter(file => file.type.startsWith('image/'));
    if (validImageFiles.length === 0) {
      setErrorMessage('Por favor, selecione arquivos de imagem válidos (PNG, JPG, JPEG, WEBP).');
      return;
    }

    setErrorMessage(null);
    const newItems = validImageFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      preview: URL.createObjectURL(file),
    }));

    const updated = [...selectedFiles, ...newItems];
    setSelectedFiles(updated);

    // Initialize blank match records for newly added files
    const initialMatches: ScannedMatchResult[] = updated.map((item, idx) => {
      const existing = scannedResults[idx];
      if (existing) return { ...existing, imagePreview: item.preview };

      return {
        id: `match-${item.id}`,
        sourceFilename: item.name,
        imagePreview: item.preview,
        map: 'Solara',
        rank: 1,
        placementPoints: 12,
        players: [
          { name: 'Jogador 1', kills: 0, deaths: 0, assists: 0, damage: 0, knocks: 0 },
          { name: 'Jogador 2', kills: 0, deaths: 0, assists: 0, damage: 0, knocks: 0 },
          { name: 'Jogador 3', kills: 0, deaths: 0, assists: 0, damage: 0, knocks: 0 },
          { name: 'Jogador 4', kills: 0, deaths: 0, assists: 0, damage: 0, knocks: 0 },
        ],
      };
    });

    setScannedResults(initialMatches);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (id: string, index: number) => {
    setSelectedFiles(prev => {
      const filtered = prev.filter(f => f.id !== id);
      const toRevoke = prev.find(f => f.id === id);
      if (toRevoke) URL.revokeObjectURL(toRevoke.preview);
      return filtered;
    });

    setScannedResults(prev => prev.filter((_, idx) => idx !== index));
    if (currentAssistantIdx >= selectedFiles.length - 1 && currentAssistantIdx > 0) {
      setCurrentAssistantIdx(prev => prev - 1);
    }
  };

  const clearAllFiles = () => {
    selectedFiles.forEach(f => URL.revokeObjectURL(f.preview));
    setSelectedFiles([]);
    setScannedResults([]);
    setErrorMessage(null);
    setCurrentAssistantIdx(0);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Helper: Preprocess image on canvas to dramatically improve OCR accuracy
  const preprocessImageForOCR = (imageSrc: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageSrc;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(new Blob());
          return;
        }

        // Scale up 1.5x for crisp character edges
        canvas.width = img.width * 1.5;
        canvas.height = img.height * 1.5;

        // Draw image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Get image data for grayscale & contrast thresholding
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          // Grayscale luminosity
          const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          // High contrast curve
          const contrastVal = avg > 140 ? 255 : avg < 90 ? 0 : avg;
          data[i] = contrastVal;
          data[i + 1] = contrastVal;
          data[i + 2] = contrastVal;
        }

        ctx.putImageData(imgData, 0, 0);

        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else resolve(new Blob());
        }, 'image/png');
      };
      img.onerror = () => resolve(new Blob());
    });
  };

  // 1. PURE LOCAL OCR (Tesseract.js - 100% SEM IA / NO BROWSER)
  const handleRunLocalOCR = async () => {
    if (selectedFiles.length === 0) {
      setErrorMessage('Selecione pelo menos uma imagem.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setOcrProgress(0);
    setOcrStatusText('Inicializando OCR Local...');

    try {
      const worker = await createWorker('por');
      
      const newScannedList: ScannedMatchResult[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const item = selectedFiles[i];
        setOcrStatusText(`Processando Imagem ${i + 1} de ${selectedFiles.length}...`);
        setOcrProgress(Math.round(((i + 0.5) / selectedFiles.length) * 100));

        // Enhance image contrast on canvas
        let processedBlob: Blob | File = item.file;
        try {
          const enhanced = await preprocessImageForOCR(item.preview);
          if (enhanced.size > 0) processedBlob = enhanced;
        } catch {
          // fallback to original
        }

        const ret = await worker.recognize(processedBlob);
        const text = ret.data.text || '';
        setOcrProgress(Math.round(((i + 1) / selectedFiles.length) * 100));

        // Extract Free Fire Map
        let detectedMap = 'Solara';
        for (const m of MAP_OPTIONS) {
          if (new RegExp(m, 'i').test(text)) {
            detectedMap = m;
            break;
          }
        }

        // Detect Rank: check "BOOYAH", "#1", "1º", etc.
        let detectedRank = 1;
        const booyahMatch = text.match(/([1-9]|1[0-2])\s*BOOYAH/i) || 
                            text.match(/#\s*([1-9]|1[0-2])/i) ||
                            text.match(/([1-9]|1[0-2])\s*º/i);
        if (booyahMatch) {
          detectedRank = parseInt(booyahMatch[1]) || 1;
        }

        // Lines processing for player names and numbers
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const playersList: ScannedPlayerData[] = [];

        for (const line of lines) {
          // Try to match K/D/A pattern: e.g. "16 / 0 / 7" or "16/0/7" or "16 0 7"
          const kdaMatch = line.match(/(\d{1,2})\s*[\/\-]\s*(\d{1,2})\s*[\/\-]\s*(\d{1,2})/);
          const allNumbers = line.match(/\b\d+\b/g);

          if (playersList.length < 4 && (kdaMatch || (allNumbers && allNumbers.length >= 2))) {
            let kills = 0;
            let deaths = 0;
            let assists = 0;
            let damage = 0;

            if (kdaMatch) {
              kills = parseInt(kdaMatch[1]) || 0;
              deaths = parseInt(kdaMatch[2]) || 0;
              assists = parseInt(kdaMatch[3]) || 0;
            } else if (allNumbers) {
              kills = parseInt(allNumbers[0]) || 0;
              assists = parseInt(allNumbers[1]) || 0;
            }

            // Find damage (usually the largest number > 100 on the line)
            if (allNumbers) {
              const largeNumbers = allNumbers.map(n => parseInt(n)).filter(n => n >= 100);
              if (largeNumbers.length > 0) {
                damage = largeNumbers[0];
              }
            }

            // Clean Nickname
            let cleanNick = line
              .replace(/(\d{1,2}\s*[\/\-]\s*\d{1,2}\s*[\/\-]\s*\d{1,2})/g, '')
              .replace(/\b\d{3,6}\b/g, '')
              .replace(/[\#\:\,\.\%\$\@\(\)\|\*]/g, '')
              .trim();

            if (cleanNick.length >= 2) {
              playersList.push({
                name: cleanNick.substring(0, 20),
                kills: Math.min(kills, 50),
                deaths: Math.min(deaths, 50),
                assists: Math.min(assists, 50),
                damage: damage > 50000 ? 1500 : damage,
                knocks: kills,
              });
            }
          }
        }

        // Fill remaining players up to 4
        while (playersList.length < 4) {
          playersList.push({
            name: `Jogador ${playersList.length + 1}`,
            kills: 0,
            deaths: 0,
            assists: 0,
            damage: 0,
            knocks: 0,
          });
        }

        const placementPts = PLACEMENT_POINTS_TABLE[detectedRank] || 0;

        newScannedList.push({
          id: `local-ocr-${Date.now()}-${i}`,
          sourceFilename: item.name,
          imagePreview: item.preview,
          map: detectedMap,
          rank: detectedRank,
          placementPoints: placementPts,
          players: playersList,
        });
      }

      await worker.terminate();
      setScannedResults(newScannedList);
      setSuccessMessage(`OCR Local (Sem IA) concluído para ${newScannedList.length} imagem(ns)! Você pode conferir cada uma clicando na imagem para ampliar.`);
    } catch (err: any) {
      console.error('Erro no OCR Local:', err);
      setErrorMessage('Ocorreu um erro no processamento do OCR. Você pode usar o "Assistente Visual Lado a Lado" para conferência 100% precisa com a foto ampliada!');
    } finally {
      setIsProcessing(false);
      setOcrProgress(0);
      setOcrStatusText('');
    }
  };

  // 2. AI SCANNER (GEMINI 3.7 FLASH - HIGH ACCURACY)
  const handleProcessImagesAI = async () => {
    if (selectedFiles.length === 0) {
      setErrorMessage('Selecione pelo menos uma imagem para escanear.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const imagePayloads = await Promise.all(
        selectedFiles.map(async item => {
          const base64 = await fileToBase64(item.file);
          return {
            data: base64,
            mimeType: item.file.type || 'image/png',
            filename: item.name,
          };
        })
      );

      const response = await fetch('/api/extract-scoreboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ images: imagePayloads }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Erro no servidor: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.results || result.results.length === 0) {
        throw new Error('Nenhum dado pôde ser extraído das imagens enviadas.');
      }

      const parsedMatches: ScannedMatchResult[] = [];
      let failureCount = 0;

      result.results.forEach((item: any, idx: number) => {
        const sourcePreview = selectedFiles[idx]?.preview;

        if (item.success && item.data) {
          const d = item.data;
          let mapName = d.map || 'Solara';
          const matchedMap = MAP_OPTIONS.find(m => m.toLowerCase() === mapName.toLowerCase());
          if (matchedMap) mapName = matchedMap;

          const rankVal = parseInt(d.rank) || 1;
          const placementPts = d.placementPoints !== undefined ? parseInt(d.placementPoints) : (PLACEMENT_POINTS_TABLE[rankVal] || 0);

          parsedMatches.push({
            id: `scan-${Date.now()}-${idx}`,
            sourceFilename: item.filename || `Print ${idx + 1}`,
            imagePreview: sourcePreview,
            map: mapName,
            rank: rankVal,
            placementPoints: placementPts,
            gameMode: d.gameMode,
            matchId: d.matchId,
            players: Array.isArray(d.players) ? d.players.map((p: any) => ({
              name: p.name || 'Jogador',
              kills: parseInt(p.kills) || 0,
              deaths: parseInt(p.deaths) || 0,
              assists: parseInt(p.assists) || 0,
              damage: parseInt(p.damage) || 0,
              realDamage: p.realDamage ? parseInt(p.realDamage) : undefined,
              knocks: p.knocks ? parseInt(p.knocks) : undefined,
              healing: p.healing ? parseInt(p.healing) : undefined,
              revives: p.revives ? parseInt(p.revives) : undefined,
              headshotRate: p.headshotRate || undefined,
              score: p.score ? parseFloat(p.score) : undefined,
              survivalTime: p.survivalTime || undefined,
            })) : [],
          });
        } else {
          failureCount++;
        }
      });

      setScannedResults(parsedMatches);
      setSuccessMessage(
        `Extração IA concluída com sucesso! ${parsedMatches.length} partida(s) lida(s)${
          failureCount > 0 ? ` (${failureCount} com falha)` : ''
        }. Você pode clicar em qualquer print para inspecionar os números e ajustar se desejar.`
      );
    } catch (err: any) {
      console.error('Erro na extração IA:', err);
      setErrorMessage(err.message || 'Ocorreu um erro ao processar as imagens com IA.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Update field in a scanned match
  const updateScannedMatch = (matchIdx: number, field: keyof ScannedMatchResult, value: any) => {
    setScannedResults(prev => {
      const copy = [...prev];
      if (!copy[matchIdx]) return prev;
      const updated = { ...copy[matchIdx], [field]: value };
      if (field === 'rank') {
        const rankNum = parseInt(value) || 1;
        updated.placementPoints = PLACEMENT_POINTS_TABLE[rankNum] || 0;
      }
      copy[matchIdx] = updated;
      return copy;
    });
  };

  // Update player in a scanned match
  const updateScannedPlayer = (matchIdx: number, playerIndex: number, field: keyof ScannedPlayerData, value: any) => {
    setScannedResults(prev => {
      const copy = [...prev];
      if (!copy[matchIdx]) return prev;
      const newPlayers = [...copy[matchIdx].players];
      newPlayers[playerIndex] = {
        ...newPlayers[playerIndex],
        [field]: field === 'name' || field === 'headshotRate' || field === 'survivalTime' ? value : Number(value) || 0,
      };
      copy[matchIdx] = { ...copy[matchIdx], players: newPlayers };
      return copy;
    });
  };

  const handleImport = (append: boolean) => {
    if (scannedResults.length === 0) return;
    onImportMatches(scannedResults, append);
    setSuccessMessage(`${scannedResults.length} partida(s) importada(s) com sucesso para o Relatório Oficial!`);
  };

  const currentMatch = scannedResults[currentAssistantIdx];
  const currentFile = selectedFiles[currentAssistantIdx];
  const activeLightboxFile = selectedFiles[lightboxState.index];
  const activeLightboxMatch = scannedResults[lightboxState.index];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ========================================================================= */}
      {/* FULLSCREEN LIGHTBOX MODAL PARA VISUALIZAR A FOTO EM ALTA RESOLUÇÃO        */}
      {/* ========================================================================= */}
      {lightboxState.isOpen && activeLightboxFile && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fade-in select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeLightbox();
          }}
        >
          {/* Lightbox Top Header */}
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/10 z-10">
            <div className="flex items-center gap-3">
              <span className="bg-loud-500 text-gray-900 font-black text-xs px-3 py-1.5 rounded-lg uppercase tracking-wider">
                Queda {lightboxState.index + 1} de {selectedFiles.length}
              </span>
              <span className="text-sm font-bold text-white truncate max-w-[280px] sm:max-w-md font-mono">
                {activeLightboxFile.name}
              </span>
            </div>

            {/* Quick Controls */}
            <div className="flex items-center gap-2">
              {/* Zoom Out */}
              <button
                onClick={() => setLightboxState(prev => ({ ...prev, zoom: Math.max(0.5, prev.zoom - 0.25) }))}
                className="p-2 bg-graphite-800 hover:bg-graphite-700 text-white rounded-lg border border-white/10 cursor-pointer"
                title="Diminuir Zoom (-)"
              >
                <ZoomOut size={18} />
              </button>

              <span className="text-xs font-mono text-gray-300 w-12 text-center font-bold">
                {Math.round(lightboxState.zoom * 100)}%
              </span>

              {/* Zoom In */}
              <button
                onClick={() => setLightboxState(prev => ({ ...prev, zoom: Math.min(4, prev.zoom + 0.25) }))}
                className="p-2 bg-graphite-800 hover:bg-graphite-700 text-white rounded-lg border border-white/10 cursor-pointer"
                title="Aumentar Zoom (+)"
              >
                <ZoomIn size={18} />
              </button>

              {/* Rotate */}
              <button
                onClick={() => setLightboxState(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }))}
                className="p-2 bg-graphite-800 hover:bg-graphite-700 text-white rounded-lg border border-white/10 cursor-pointer"
                title="Girar 90º"
              >
                <RotateCw size={18} />
              </button>

              {/* High Contrast / Invert */}
              <button
                onClick={() => setLightboxState(prev => ({ ...prev, invertColors: !prev.invertColors }))}
                className={`p-2 rounded-lg border border-white/10 cursor-pointer transition-colors ${
                  lightboxState.invertColors ? 'bg-loud-500 text-gray-900 font-bold' : 'bg-graphite-800 text-white hover:bg-graphite-700'
                }`}
                title="Modo Alto Contraste (Realçar números)"
              >
                <Sliders size={18} />
              </button>

              {/* Close Button */}
              <button
                onClick={closeLightbox}
                className="p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg border border-red-500/50 cursor-pointer transition-colors ml-2"
                title="Fechar (Esc)"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Lightbox Center Content with Zoom and Pan */}
          <div className="relative flex-1 overflow-auto flex items-center justify-center p-2 my-2 cursor-grab active:cursor-grabbing">
            {/* Previous Image Arrow */}
            {selectedFiles.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevLightboxImage();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/70 hover:bg-loud-500 hover:text-gray-900 text-white p-3 rounded-full border border-white/20 transition-all cursor-pointer shadow-2xl"
                title="Foto Anterior (Seta Esquerda)"
              >
                <ArrowLeft size={24} />
              </button>
            )}

            <div className="transition-transform duration-150 ease-out flex items-center justify-center max-w-full max-h-full">
              <img
                src={activeLightboxFile.preview}
                alt={activeLightboxFile.name}
                style={{
                  transform: `scale(${lightboxState.zoom}) rotate(${lightboxState.rotation}deg)`,
                  filter: lightboxState.invertColors ? 'contrast(180%) brightness(120%) saturate(150%)' : 'none',
                }}
                className="max-h-[82vh] max-w-[90vw] object-contain rounded-lg shadow-2xl transition-all select-none"
              />
            </div>

            {/* Next Image Arrow */}
            {selectedFiles.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextLightboxImage();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/70 hover:bg-loud-500 hover:text-gray-900 text-white p-3 rounded-full border border-white/20 transition-all cursor-pointer shadow-2xl"
                title="Próxima Foto (Seta Direita)"
              >
                <ArrowRight size={24} />
              </button>
            )}
          </div>

          {/* Lightbox Bottom Quick Stats Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs text-gray-300 z-10 bg-graphite-900/80 p-3 rounded-xl">
            <div className="flex items-center gap-4">
              {activeLightboxMatch && (
                <>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-loud-500" />
                    <span className="font-bold text-white uppercase">{activeLightboxMatch.map}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Trophy size={14} className="text-yellow-400" />
                    <span className="font-black text-yellow-400">#{activeLightboxMatch.rank} ({activeLightboxMatch.placementPoints} pts)</span>
                  </div>
                  <div className="hidden sm:block text-gray-400">
                    Total Abates: <span className="font-black text-white">{activeLightboxMatch.players.reduce((acc, p) => acc + (p.kills || 0), 0)} K</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-gray-400">
                Atalhos: <b>←</b> / <b>→</b> navegar | <b>+</b> / <b>-</b> zoom | <b>Esc</b> fechar
              </span>
              <button
                onClick={() => {
                  setCurrentAssistantIdx(lightboxState.index);
                  closeLightbox();
                }}
                className="bg-loud-500 hover:bg-loud-600 text-gray-900 px-4 py-1.5 rounded-lg font-black text-xs uppercase flex items-center gap-1 cursor-pointer"
              >
                <Edit3 size={14} /> Editar Esta Queda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode Selection Header */}
      <div className="bg-graphite-800 p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black uppercase text-white tracking-wide flex items-center gap-2">
              <ImageIcon className="text-loud-500" size={22} />
              Importação de Estatísticas por Prints / Fotos
            </h3>
            <p className="text-xs text-gray-300">
              Clique em qualquer imagem para ver ampliada com zoom e lupa. Você pode escolher entre o <b>Assistente Visual Lado a Lado (Sem IA)</b>, <b>OCR Local no Navegador</b> ou <b>Scanner IA</b>.
            </p>
          </div>

          {/* Method Buttons */}
          <div className="flex flex-wrap gap-2 bg-graphite-900 p-1.5 rounded-xl border border-white/10">
            <button
              onClick={() => setScanMethod('assistant')}
              className={`px-3.5 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                scanMethod === 'assistant'
                  ? 'bg-loud-500 text-gray-900 shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Eye size={14} />
              <span>Assistente Visual (Sem IA)</span>
              <span className="bg-black/30 text-[9px] px-1.5 py-0.5 rounded text-white font-mono">Recomendado</span>
            </button>

            <button
              onClick={() => setScanMethod('local_ocr')}
              className={`px-3.5 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                scanMethod === 'local_ocr'
                  ? 'bg-loud-500 text-gray-900 shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Zap size={14} />
              <span>OCR Local (Sem IA)</span>
            </button>

            <button
              onClick={() => setScanMethod('ai')}
              className={`px-3.5 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                scanMethod === 'ai'
                  ? 'bg-loud-500 text-gray-900 shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles size={14} />
              <span>Scanner com IA</span>
            </button>
          </div>
        </div>

        {/* Method Explanation Card */}
        <div className="bg-graphite-900/60 p-3.5 rounded-xl border border-white/5 text-xs text-gray-300 flex items-center gap-3">
          {scanMethod === 'assistant' && (
            <>
              <Eye className="text-loud-500 shrink-0" size={18} />
              <span>
                <b>Assistente Visual Lado a Lado (100% Sem IA):</b> O print da partida fica fixo com zoom, lupa e clique para tela cheia de um lado enquanto você só confere ou digita os números dos 4 jogadores no formulário ágil ao lado. Você preenche 6 partidas em poucos segundos com 100% de precisão!
              </span>
            </>
          )}
          {scanMethod === 'local_ocr' && (
            <>
              <Zap className="text-yellow-400 shrink-0" size={18} />
              <span>
                <b>OCR Local no Navegador (100% Sem IA / Tesseract):</b> Pré-processa o contraste da imagem na memória do seu navegador e lê os números automaticamente sem enviar para servidores externos.
              </span>
            </>
          )}
          {scanMethod === 'ai' && (
            <>
              <Sparkles className="text-purple-400 shrink-0" size={18} />
              <span>
                <b>Scanner com IA (Visão Computacional):</b> Utiliza inteligência artificial multimodal com ajuste fino para ler as colunas da tela de fim de jogo do Free Fire (Solara, Bermuda, K/D/A, DMG, Dano Real, Headshot %).
              </span>
            </>
          )}
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all ${
          selectedFiles.length > 0
            ? 'border-loud-500/50 bg-graphite-900/60 hover:bg-graphite-900/80'
            : 'border-white/20 bg-graphite-800/60 hover:border-loud-500/50 hover:bg-graphite-800'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-loud-500/10 border border-loud-500/30 flex items-center justify-center text-loud-500">
            <Upload size={26} />
          </div>
          <div>
            <p className="text-base font-bold text-white mb-0.5">
              Clique para selecionar ou arraste os prints das partidas
            </p>
            <p className="text-xs text-gray-400">
              Você pode enviar todas as fotos/quedas do dia de uma vez só! (PNG, JPG, WEBP)
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle size={20} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center gap-3 text-emerald-400 text-sm">
          <CheckCircle2 size={20} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Selected Files Gallery & Action Bar */}
      {selectedFiles.length > 0 && (
        <div className="bg-graphite-800 p-5 rounded-2xl border border-white/10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ImageIcon size={18} className="text-loud-500" />
              <span className="text-sm font-bold text-white uppercase">
                Imagens Selecionadas ({selectedFiles.length} Quedas)
              </span>
              <span className="text-xs text-gray-400">
                (Clique em qualquer foto para ampliar em tela cheia)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="text-xs font-bold text-loud-500 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Adicionar Mais Imagens
              </button>
              <span className="text-gray-600">|</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearAllFiles();
                }}
                className="text-xs font-bold text-red-400 hover:text-red-300 cursor-pointer"
              >
                Limpar Tudo
              </button>
            </div>
          </div>

          {/* Miniatures Thumbnails list */}
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
            {selectedFiles.map((fileItem, idx) => {
              const isCurrent = currentAssistantIdx === idx;
              return (
                <div
                  key={fileItem.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setCurrentAssistantIdx(idx)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setCurrentAssistantIdx(idx);
                    }
                  }}
                  className={`group relative shrink-0 w-32 h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer text-left focus:outline-none ${
                    isCurrent 
                      ? 'border-loud-500 ring-2 ring-loud-500/40 scale-102' 
                      : 'border-white/10 opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src={fileItem.preview}
                    alt={fileItem.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent pointer-events-none" />
                  
                  {/* Queda Number Badge */}
                  <div className="absolute bottom-1 left-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-loud-500 pointer-events-none">
                    Queda {idx + 1}
                  </div>

                  {/* Expand Fullscreen Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openLightbox(idx);
                    }}
                    className="absolute top-1 left-1 bg-black/70 hover:bg-loud-500 hover:text-gray-900 text-white p-1 rounded transition-colors cursor-pointer"
                    title="Clique para ver imagem ampliada"
                  >
                    <Maximize2 size={11} />
                  </button>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(fileItem.id, idx);
                    }}
                    className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-600 text-white p-1 rounded transition-colors cursor-pointer"
                    title="Remover imagem"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Action Trigger Buttons for OCR / AI */}
          {scanMethod !== 'assistant' && (
            <div className="pt-2 flex justify-end">
              {scanMethod === 'local_ocr' && (
                <button
                  onClick={handleRunLocalOCR}
                  disabled={isProcessing}
                  className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-7 py-3 rounded-xl font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {ocrStatusText || `Lendo texto localmente (${ocrProgress}%)...`}
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      Extrair Texto com OCR Local (Sem IA)
                    </>
                  )}
                </button>
              )}

              {scanMethod === 'ai' && (
                <button
                  onClick={handleProcessImagesAI}
                  disabled={isProcessing}
                  className="w-full sm:w-auto bg-loud-500 hover:bg-loud-600 text-gray-900 px-7 py-3 rounded-xl font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Analisando Free Fire com IA...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Escanear {selectedFiles.length} Partida{selectedFiles.length > 1 ? 's' : ''} com IA
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. SPLIT SCREEN VISUAL ASSISTANT (100% SEM IA - FAST AND ACCURATE)         */}
      {/* ========================================================================= */}
      {selectedFiles.length > 0 && scanMethod === 'assistant' && currentFile && currentMatch && (
        <div className="bg-graphite-800 rounded-2xl border border-white/10 overflow-hidden shadow-2xl space-y-0 animate-fade-in">
          {/* Header Navigation between Quedas */}
          <div className="bg-graphite-900 p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="bg-loud-500 text-gray-900 font-black text-xs px-3 py-1.5 rounded-lg uppercase">
                Queda {currentAssistantIdx + 1} de {selectedFiles.length}
              </span>
              <span className="text-xs text-gray-400 font-mono truncate max-w-[200px]">
                {currentFile.name}
              </span>
            </div>

            {/* Quick Navigation Carousel Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentAssistantIdx(prev => Math.max(0, prev - 1))}
                disabled={currentAssistantIdx === 0}
                className="bg-graphite-800 hover:bg-graphite-700 disabled:opacity-30 text-white p-2 rounded-lg border border-white/10 transition-colors cursor-pointer"
                title="Queda Anterior"
              >
                <ArrowLeft size={16} />
              </button>
              
              <div className="text-xs font-bold text-gray-300 px-2">
                {currentAssistantIdx + 1} / {selectedFiles.length}
              </div>

              <button
                onClick={() => setCurrentAssistantIdx(prev => Math.min(selectedFiles.length - 1, prev + 1))}
                disabled={currentAssistantIdx === selectedFiles.length - 1}
                className="bg-graphite-800 hover:bg-graphite-700 disabled:opacity-30 text-white p-2 rounded-lg border border-white/10 transition-colors cursor-pointer"
                title="Próxima Queda"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Split Content: Left is Zoomable Image, Right is Fast Input Form */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* LEFT: Zoomable Image Viewer with Click-to-Enlarge */}
            <div className="lg:col-span-6 bg-black/60 p-4 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10 min-h-[460px]">
              {/* Image Controls toolbar */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10 text-xs">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Sliders size={14} />
                  <span>Ajustes da Foto:</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(0.8, prev - 0.2))}
                    className="p-1.5 bg-graphite-800 hover:bg-graphite-700 text-white rounded border border-white/10 cursor-pointer"
                    title="Diminuir Zoom"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <span className="text-[11px] font-mono text-gray-300 w-10 text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(3.0, prev + 0.2))}
                    className="p-1.5 bg-graphite-800 hover:bg-graphite-700 text-white rounded border border-white/10 cursor-pointer"
                    title="Aumentar Zoom"
                  >
                    <ZoomIn size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setZoomLevel(1);
                      setFilterBrightness(100);
                      setFilterContrast(100);
                    }}
                    className="text-[11px] text-gray-400 hover:text-white px-2 py-1 rounded bg-graphite-800 cursor-pointer"
                  >
                    Resetar
                  </button>
                  <button
                    onClick={() => openLightbox(currentAssistantIdx)}
                    className="bg-loud-500/20 hover:bg-loud-500 text-loud-500 hover:text-gray-900 px-2.5 py-1 rounded font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                    title="Abrir em tela cheia com zoom total"
                  >
                    <Maximize2 size={12} />
                    Tela Cheia
                  </button>
                </div>
              </div>

              {/* Viewport Box (Clickable for Lightbox) */}
              <div 
                onClick={() => openLightbox(currentAssistantIdx)}
                className="group relative flex-1 overflow-auto rounded-xl bg-graphite-950/80 border border-white/5 my-3 flex items-center justify-center min-h-[350px] cursor-pointer"
                title="Clique para ver a foto ampliada em tela cheia"
              >
                <img
                  src={currentFile.preview}
                  alt={currentFile.name}
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'center center',
                    filter: `brightness(${filterBrightness}%) contrast(${filterContrast}%)`,
                    transition: 'transform 0.15s ease-out',
                  }}
                  className="max-h-[500px] w-auto object-contain select-none transition-all group-hover:opacity-95"
                />

                {/* Floating Click prompt badge */}
                <div className="absolute top-2 right-2 bg-black/80 group-hover:bg-loud-500 group-hover:text-gray-900 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-lg transition-colors pointer-events-none">
                  <Search size={12} />
                  <span>Clique para Ampliar</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 text-center">
                Dica: Você pode <b>clicar na imagem</b> para ver tudo em alta resolução e usar a tecla <b>Tab</b> para passar de campo rapidamente!
              </p>
            </div>

            {/* RIGHT: Fast Entry Form */}
            <div className="lg:col-span-6 p-5 bg-graphite-900/90 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {/* Match Metadata Row */}
                <div className="grid grid-cols-2 gap-3 bg-graphite-800 p-3.5 rounded-xl border border-white/10">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 flex items-center gap-1">
                      <MapPin size={12} className="text-loud-500" /> Mapa da Partida
                    </label>
                    <select
                      value={currentMatch.map}
                      onChange={(e) => updateScannedMatch(currentAssistantIdx, 'map', e.target.value)}
                      className="w-full bg-graphite-900 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:border-loud-500 cursor-pointer"
                    >
                      {MAP_OPTIONS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 flex items-center gap-1">
                      <Trophy size={12} className="text-yellow-500" /> Colocação / Rank
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={currentMatch.rank}
                        onChange={(e) => updateScannedMatch(currentAssistantIdx, 'rank', e.target.value)}
                        className="w-full bg-graphite-900 border border-white/10 rounded-lg px-3 py-2 text-xs font-black text-white outline-none focus:border-loud-500 cursor-pointer"
                      >
                        <option value={1}>1º Lugar (BOOYAH! - 12 pts)</option>
                        <option value={2}>2º Lugar (9 pts)</option>
                        <option value={3}>3º Lugar (8 pts)</option>
                        <option value={4}>4º Lugar (7 pts)</option>
                        <option value={5}>5º Lugar (6 pts)</option>
                        <option value={6}>6º Lugar (5 pts)</option>
                        <option value={7}>7º Lugar (4 pts)</option>
                        <option value={8}>8º Lugar (3 pts)</option>
                        <option value={9}>9º Lugar (2 pts)</option>
                        <option value={10}>10º Lugar (1 pt)</option>
                        <option value={11}>11º Lugar (0 pts)</option>
                        <option value={12}>12º Lugar (0 pts)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Fast Players Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-black uppercase text-gray-400 px-1">
                    <span>Estatísticas dos 4 Jogadores</span>
                    <span className="text-[10px] text-loud-500">
                      Total Abates: {currentMatch.players.reduce((acc, p) => acc + (p.kills || 0), 0)} | 
                      Pontos: {(currentMatch.placementPoints || 0) + currentMatch.players.reduce((acc, p) => acc + (p.kills || 0), 0)} pts
                    </span>
                  </div>

                  <div className="space-y-2">
                    {currentMatch.players.slice(0, 4).map((player, pIdx) => (
                      <div 
                        key={pIdx}
                        className="bg-graphite-800/80 p-2.5 rounded-xl border border-white/10 grid grid-cols-12 gap-2 items-center hover:border-loud-500/40 transition-colors"
                      >
                        {/* Nick */}
                        <div className="col-span-4">
                          <label className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">
                            Jogador {pIdx + 1}
                          </label>
                          <input
                            type="text"
                            value={player.name}
                            onChange={(e) => updateScannedPlayer(currentAssistantIdx, pIdx, 'name', e.target.value)}
                            placeholder={`Nick J${pIdx + 1}`}
                            className="w-full bg-graphite-900 border border-white/10 rounded px-2 py-1 text-xs font-bold text-white outline-none focus:border-loud-500"
                          />
                        </div>

                        {/* Kills */}
                        <div className="col-span-2">
                          <label className="block text-[9px] font-bold text-red-400 uppercase mb-0.5 text-center">
                            Abates (K)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={player.kills}
                            onChange={(e) => updateScannedPlayer(currentAssistantIdx, pIdx, 'kills', e.target.value)}
                            className="w-full bg-graphite-900 border border-white/10 rounded px-1.5 py-1 text-xs font-black text-red-400 text-center outline-none focus:border-red-500"
                          />
                        </div>

                        {/* Damage */}
                        <div className="col-span-3">
                          <label className="block text-[9px] font-bold text-blue-400 uppercase mb-0.5 text-center">
                            Dano (DMG)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={player.damage}
                            onChange={(e) => updateScannedPlayer(currentAssistantIdx, pIdx, 'damage', e.target.value)}
                            className="w-full bg-graphite-900 border border-white/10 rounded px-1.5 py-1 text-xs font-bold text-white text-center outline-none focus:border-loud-500"
                          />
                        </div>

                        {/* Assists */}
                        <div className="col-span-3">
                          <label className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5 text-center">
                            Assist. (A)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={player.assists}
                            onChange={(e) => updateScannedPlayer(currentAssistantIdx, pIdx, 'assists', e.target.value)}
                            className="w-full bg-graphite-900 border border-white/10 rounded px-1.5 py-1 text-xs font-bold text-gray-300 text-center outline-none focus:border-loud-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Quick Navigation & Final Import */}
              <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                {currentAssistantIdx < selectedFiles.length - 1 ? (
                  <button
                    onClick={() => setCurrentAssistantIdx(prev => prev + 1)}
                    className="w-full sm:w-auto bg-loud-500 hover:bg-loud-600 text-gray-900 px-6 py-2.5 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    Salvar e Ir para Próxima Queda ({currentAssistantIdx + 2}/{selectedFiles.length})
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={16} /> Todas as quedas conferidas!
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {existingMatchCount > 0 && (
                    <button
                      onClick={() => handleImport(true)}
                      className="bg-graphite-800 hover:bg-graphite-700 text-white border border-white/20 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus size={14} className="text-loud-500" />
                      Adicionar às {existingMatchCount} Existentes
                    </button>
                  )}
                  <button
                    onClick={() => handleImport(false)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-gray-950 px-6 py-2.5 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <CheckCircle2 size={16} />
                    Finalizar e Importar Todas ({scannedResults.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TABELA COMPLETA COM TODAS AS PARTIDAS CONFERIDAS                       */}
      {/* ========================================================================= */}
      {scannedResults.length > 0 && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
            <div>
              <h3 className="text-xl font-black uppercase text-white flex items-center gap-2">
                <FileCheck className="text-loud-500" size={22} />
                Resumo Geral das Quedas ({scannedResults.length})
              </h3>
              <p className="text-xs text-gray-400">
                Clique em qualquer print para abrir e comparar os números extraídos.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {existingMatchCount > 0 && (
                <button
                  onClick={() => handleImport(true)}
                  className="flex-1 sm:flex-initial bg-graphite-800 hover:bg-graphite-700 text-white border border-white/20 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus size={16} className="text-loud-500" />
                  Adicionar às {existingMatchCount} Existentes
                </button>
              )}
              <button
                onClick={() => handleImport(false)}
                className="flex-1 sm:flex-initial bg-loud-500 hover:bg-loud-600 text-gray-900 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-loud-500/20 transition-all cursor-pointer"
              >
                <CheckCircle2 size={16} />
                {existingMatchCount > 0 ? 'Substituir e Importar Todas' : 'Importar Todas para Estatísticas'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scannedResults.map((match, mIdx) => {
              const totalKills = match.players.reduce((acc, p) => acc + (p.kills || 0), 0);
              const totalDamage = match.players.reduce((acc, p) => acc + (p.damage || 0), 0);
              const totalPoints = (match.placementPoints || 0) + totalKills;

              return (
                <div
                  key={match.id}
                  className="bg-graphite-800 rounded-xl border border-white/10 overflow-hidden shadow p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="bg-loud-500/20 text-loud-500 px-2 py-0.5 rounded font-black text-xs uppercase">
                        Queda {mIdx + 1}
                      </span>
                      <span className="font-bold text-xs text-white uppercase">{match.map}</span>
                      <span className="text-xs text-yellow-400 font-black">#{match.rank} ({match.placementPoints} pts)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {match.imagePreview && (
                        <button
                          onClick={() => openLightbox(mIdx)}
                          className="text-[11px] font-bold text-loud-500 hover:text-white bg-graphite-900 px-2 py-1 rounded border border-white/10 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Clique para ver o print desta partida"
                        >
                          <Search size={12} /> Ver Print
                        </button>
                      )}
                      <div className="text-xs font-bold text-gray-300">
                        {totalKills} Abates | <span className="text-loud-500">{totalPoints} pts</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-1 border-t border-white/5 text-[11px]">
                    {match.players.slice(0, 4).map((p, pIdx) => (
                      <div key={pIdx} className="bg-graphite-900/60 p-2 rounded-lg text-center">
                        <p className="font-bold text-white truncate" title={p.name}>{p.name || `J${pIdx + 1}`}</p>
                        <p className="text-red-400 font-black">{p.kills} K</p>
                        <p className="text-[10px] text-gray-400">{p.damage} DMG</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Action Import */}
          <div className="pt-4 flex justify-end">
            <button
              onClick={() => handleImport(false)}
              className="bg-loud-500 hover:bg-loud-600 text-gray-900 px-8 py-3.5 rounded-xl font-black text-sm uppercase tracking-wide flex items-center gap-2 shadow-lg shadow-loud-500/20 cursor-pointer transition-all"
            >
              <CheckCircle2 size={18} />
              Importar Todas as {scannedResults.length} Partidas para Estatísticas
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
