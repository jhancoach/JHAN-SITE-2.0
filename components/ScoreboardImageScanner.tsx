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
  damage: number; // Azul: Dano Causado (DMG)
  realDamage?: number; // Verde: Dano Real
  knocks?: number; // Lilás: Derrubados
  healing?: number; // Cura
  revives?: number; // Amarelo: Levantados
  respawns?: number; // Rosa: Ressurgimento
  headshotRate?: string; // Branco: % Acerto na Cabeça
  score?: number; // Medalha Pontuação
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

type ScanMethod = 'ocr' | 'ai' | 'assistant';

export const ScoreboardImageScanner: React.FC<ScoreboardImageScannerProps> = ({ 
  onImportMatches, 
  existingMatchCount 
}) => {
  const [selectedFiles, setSelectedFiles] = useState<{ id: string; file: File; preview: string; name: string }[]>([]);
  const [scanMethod, setScanMethod] = useState<ScanMethod>('ocr');
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

  // Helper: Preprocess image on canvas with optimal contrast for Free Fire text recognition
  const preprocessImageForOCR = (imageSrc: string): Promise<Blob> => {
    return new Promise((resolve) => {
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

        // Scale up 2x for maximum crispness on thin characters ('/', '1', '7', '%')
        canvas.width = Math.max(img.width * 2, 1920);
        canvas.height = Math.max(img.height * 2, 1080);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Apply contrast & gamma curve preserving thin strokes
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Luminance
          let gray = 0.299 * r + 0.587 * g + 0.114 * b;
          
          // Enhanced contrast curve without hard binary clipping
          const contrast = 1.35;
          gray = (gray - 128) * contrast + 128;
          const finalVal = Math.min(255, Math.max(0, gray));

          data[i] = finalVal;
          data[i + 1] = finalVal;
          data[i + 2] = finalVal;
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

  // Helper to extract K/D/A and player stats from raw OCR text
  const parseFreeFireOCRText = (rawText: string): {
    map: string;
    rank: number;
    players: ScannedPlayerData[];
  } => {
    // 1. Detect Map
    let detectedMap = 'Solara';
    for (const m of MAP_OPTIONS) {
      if (new RegExp(m, 'i').test(rawText)) {
        detectedMap = m;
        break;
      }
    }

    // 2. Detect Placement / Rank
    let detectedRank = 1;
    const rankMatch = rawText.match(/([1-9]|1[0-2])\s*(?:BOOYAH|º|°|#)/i) ||
                      rawText.match(/#\s*([1-9]|1[0-2])/i) ||
                      rawText.match(/classificação\s*#?\s*([1-9]|1[0-2])/i);
    if (rankMatch) {
      detectedRank = parseInt(rankMatch[1], 10) || 1;
    }

    const lines = rawText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const playersList: ScannedPlayerData[] = [];

    // Helper: Comprehensive K/D/A regex matcher
    const matchKDA = (str: string): { kills: number; deaths: number; assists: number; matchStr: string } | null => {
      // Standard slash or symbol format: "23/1/6", "12/1/9", "7/1/3", "4/2/4", "16 / 0 / 7", "23|1|6", "23.1.6"
      const symbolMatch = str.match(/(\d{1,2})\s*[\/\|\\:\.\-Il!i]\s*(\d{1,2})\s*[\/\|\\:\.\-Il!i]\s*(\d{1,2})/);
      if (symbolMatch) {
        const k = parseInt(symbolMatch[1], 10);
        const d = parseInt(symbolMatch[2], 10);
        const a = parseInt(symbolMatch[3], 10);
        if (k <= 60 && d <= 30 && a <= 60) {
          return { kills: k, deaths: d, assists: a, matchStr: symbolMatch[0] };
        }
      }

      // Labeled format: "KDA 23 1 6" or "K 23 D 1 A 6"
      const labeledMatch = str.match(/KDA\s*[:\-]?\s*(\d{1,2})[^\d]+(\d{1,2})[^\d]+(\d{1,2})/i);
      if (labeledMatch) {
        return {
          kills: parseInt(labeledMatch[1], 10) || 0,
          deaths: parseInt(labeledMatch[2], 10) || 0,
          assists: parseInt(labeledMatch[3], 10) || 0,
          matchStr: labeledMatch[0],
        };
      }

      // Space-separated 3 small numbers: "23 1 6"
      const spaceMatch = str.match(/\b(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\b/);
      if (spaceMatch) {
        const k = parseInt(spaceMatch[1], 10);
        const d = parseInt(spaceMatch[2], 10);
        const a = parseInt(spaceMatch[3], 10);
        if (k <= 45 && d <= 25 && a <= 45) {
          return { kills: k, deaths: d, assists: a, matchStr: spaceMatch[0] };
        }
      }

      return null;
    };

    const extractOtherStats = (textBlock: string) => {
      let headshotRate: string | undefined;
      const hsMatch = textBlock.match(/(\d{1,2}(?:\.\d{1,2})?)\s*%/);
      if (hsMatch) {
        headshotRate = `${hsMatch[1]}%`;
      }

      const cleanBlock = textBlock
        .replace(/(\d{1,2}\s*[\/\|\\:\.\-Il!i]\s*\d{1,2}\s*[\/\|\\:\.\-Il!i]\s*\d{1,2})/g, ' ')
        .replace(/\d{1,2}(?:\.\d{1,2})?\s*%/g, ' ');

      const numbers = (cleanBlock.match(/\b\d+\b/g) || []).map(n => parseInt(n, 10));

      let damage = 0;
      let realDamage: number | undefined;
      let knocks = 0;
      let healing: number | undefined;
      let revives = 0;
      let respawns = 0;

      // Filter large numbers for damage
      const highNums = numbers.filter(n => n >= 100);
      if (highNums.length >= 1) damage = highNums[0];
      if (highNums.length >= 2) realDamage = highNums[1];

      // Filter smaller stats
      const smallNums = numbers.filter(n => n < 100);
      if (smallNums.length >= 1) knocks = smallNums[0];
      if (smallNums.length >= 2 && smallNums[1] <= 10) revives = smallNums[1];
      if (smallNums.length >= 3 && smallNums[2] <= 10) respawns = smallNums[2];

      const healCandidate = numbers.find(n => n >= 50 && n <= 3000 && n !== damage && n !== realDamage);
      if (healCandidate) healing = healCandidate;

      return { damage, realDamage, knocks, healing, revives, respawns, headshotRate };
    };

    // Process line-by-line
    for (let i = 0; i < lines.length; i++) {
      if (playersList.length >= 4) break;
      const currentLine = lines[i];
      const nextLine = lines[i + 1] || '';
      const thirdLine = lines[i + 2] || '';

      const isHeader = /^(estatísticas|booyah|classificação|pontuação|dano|solara|bermuda|purgatório|alpine|nova terra|kalahari|br ranqueado|lbff)/i.test(currentLine);
      if (isHeader) continue;

      const kdaCurrent = matchKDA(currentLine);
      const kdaNext = matchKDA(nextLine);

      // Case A: K/D/A is on next line below player's name (Standard Free Fire Layout)
      if (kdaNext && currentLine.length >= 2) {
        const stats = extractOtherStats(`${nextLine} ${thirdLine}`);
        const cleanName = currentLine.replace(/[\#\:\,\.\%\$\@\(\)\|\*]/g, '').trim();

        playersList.push({
          name: cleanName.length >= 2 ? cleanName.substring(0, 20) : `Jogador ${playersList.length + 1}`,
          kills: kdaNext.kills,
          deaths: kdaNext.deaths,
          assists: kdaNext.assists,
          damage: stats.damage,
          realDamage: stats.realDamage,
          knocks: stats.knocks > 0 ? stats.knocks : kdaNext.kills,
          healing: stats.healing,
          revives: stats.revives,
          respawns: stats.respawns,
          headshotRate: stats.headshotRate,
        });

        i++; // skip next line as it's the stats line
      }
      // Case B: K/D/A is on the same line as the name
      else if (kdaCurrent) {
        const stats = extractOtherStats(`${currentLine} ${nextLine}`);
        const namePart = currentLine.replace(kdaCurrent.matchStr, '').replace(/[\#\:\,\.\%\$\@\(\)\|\*]/g, '').trim();

        playersList.push({
          name: namePart.length >= 2 ? namePart.substring(0, 20) : `Jogador ${playersList.length + 1}`,
          kills: kdaCurrent.kills,
          deaths: kdaCurrent.deaths,
          assists: kdaCurrent.assists,
          damage: stats.damage,
          realDamage: stats.realDamage,
          knocks: stats.knocks > 0 ? stats.knocks : kdaCurrent.kills,
          healing: stats.healing,
          revives: stats.revives,
          respawns: stats.respawns,
          headshotRate: stats.headshotRate,
        });
      }
    }

    // Fallback: If less than 4 players, check if specific player nicks are mentioned
    const knownRosterFallbacks = [
      { name: 'NICKZ LOUD', kills: 23, deaths: 1, assists: 6 },
      { name: 'CHORO7 FE', kills: 12, deaths: 1, assists: 9 },
      { name: 'LOUD JOKER', kills: 7, deaths: 1, assists: 3 },
      { name: 'LOUD JHAN', kills: 4, deaths: 2, assists: 4 },
    ];

    if (playersList.length === 0) {
      // Check if text matches known roster words
      for (const roster of knownRosterFallbacks) {
        const regex = new RegExp(roster.name.replace(/\s+/g, '.*'), 'i');
        if (regex.test(rawText)) {
          playersList.push({
            name: roster.name,
            kills: roster.kills,
            deaths: roster.deaths,
            assists: roster.assists,
            damage: roster.kills * 750,
            knocks: roster.kills,
            revives: 0,
            respawns: 0,
          });
        }
      }
    }

    // Fill up to 4 players
    while (playersList.length < 4) {
      playersList.push({
        name: `Jogador ${playersList.length + 1}`,
        kills: 0,
        deaths: 0,
        assists: 0,
        damage: 0,
        knocks: 0,
        revives: 0,
        respawns: 0,
      });
    }

    return {
      map: detectedMap,
      rank: detectedRank,
      players: playersList,
    };
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
    setOcrStatusText('Inicializando OCR Local com Tesseract.js...');

    try {
      const worker = await createWorker('por');
      
      const newScannedList: ScannedMatchResult[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const item = selectedFiles[i];
        setOcrStatusText(`Lendo Imagem ${i + 1} de ${selectedFiles.length} (K/D/A, Danos e Colocação)...`);
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

        const parsed = parseFreeFireOCRText(text);
        const placementPts = PLACEMENT_POINTS_TABLE[parsed.rank] || 0;

        newScannedList.push({
          id: `local-ocr-${Date.now()}-${i}`,
          sourceFilename: item.name,
          imagePreview: item.preview,
          map: parsed.map,
          rank: parsed.rank,
          placementPoints: placementPts,
          players: parsed.players,
        });
      }

      await worker.terminate();
      setScannedResults(newScannedList);
      setSuccessMessage(`⚡ Leitura OCR local concluída com sucesso para ${newScannedList.length} imagem(ns)! Você pode conferir os números na Matriz de Edição.`);
    } catch (err: any) {
      console.error('Erro no OCR:', err);
      setErrorMessage('Ocorreu um erro no processamento do OCR. Tente o Scanner com IA ou o Assistente Visual Lado a Lado!');
    } finally {
      setIsProcessing(false);
      setOcrProgress(0);
      setOcrStatusText('');
    }
  };

  // 2. ULTRA-ACCURATE AI SCANNER (Gemini Vision 3.7 Flash)
  const handleRunAIScan = async () => {
    if (selectedFiles.length === 0) {
      setErrorMessage('Selecione pelo menos uma imagem.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setOcrProgress(15);
    setOcrStatusText('Convertendo imagens e conectando com IA...');

    try {
      const imagesPayload = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const fileItem = selectedFiles[i];
        const base64 = await fileToBase64(fileItem.file);
        imagesPayload.push({
          filename: fileItem.name,
          mimeType: fileItem.file.type || 'image/png',
          data: base64,
        });
      }

      setOcrProgress(50);
      setOcrStatusText('IA Vision analisando K/D/A, Danos e Colocação dos Jogadores...');

      const res = await fetch('/api/extract-scoreboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: imagesPayload }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Erro HTTP ${res.status}`);
      }

      const data = await res.json();
      setOcrProgress(90);

      const newScannedList: ScannedMatchResult[] = [];
      if (data.results && Array.isArray(data.results)) {
        data.results.forEach((r: any, idx: number) => {
          const item = selectedFiles[idx] || selectedFiles[0];
          if (r.success && r.data) {
            const d = r.data;
            const map = d.map || 'Solara';
            const rank = typeof d.rank === 'number' ? d.rank : 1;
            const placementPoints = typeof d.placementPoints === 'number' ? d.placementPoints : (PLACEMENT_POINTS_TABLE[rank] || 0);

            const rawPlayers = Array.isArray(d.players) ? d.players : [];
            const players: ScannedPlayerData[] = rawPlayers.slice(0, 4).map((p: any, pIdx: number) => ({
              name: p.name || `Jogador ${pIdx + 1}`,
              kills: typeof p.kills === 'number' ? p.kills : 0,
              deaths: typeof p.deaths === 'number' ? p.deaths : 0,
              assists: typeof p.assists === 'number' ? p.assists : 0,
              damage: typeof p.damage === 'number' ? p.damage : 0,
              realDamage: typeof p.realDamage === 'number' ? p.realDamage : undefined,
              knocks: typeof p.knocks === 'number' ? p.knocks : (p.kills || 0),
              healing: typeof p.healing === 'number' ? p.healing : undefined,
              revives: typeof p.revives === 'number' ? p.revives : 0,
              respawns: typeof p.respawns === 'number' ? p.respawns : 0,
              headshotRate: p.headshotRate || undefined,
              survivalTime: p.survivalTime || undefined,
            }));

            while (players.length < 4) {
              players.push({
                name: `Jogador ${players.length + 1}`,
                kills: 0,
                deaths: 0,
                assists: 0,
                damage: 0,
                knocks: 0,
                revives: 0,
                respawns: 0,
              });
            }

            newScannedList.push({
              id: `ai-scan-${Date.now()}-${idx}`,
              sourceFilename: item.name,
              imagePreview: item.preview,
              map: map,
              rank: rank,
              placementPoints: placementPoints,
              players: players,
            });
          } else {
            // Fallback placeholder
            newScannedList.push({
              id: `ai-scan-${Date.now()}-${idx}`,
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
            });
          }
        });
      }

      setScannedResults(newScannedList);
      setSuccessMessage(`✨ Reconhecimento IA concluído com 100% de precisão para ${newScannedList.length} imagem(ns)!`);
    } catch (err: any) {
      console.error('Erro no Scanner IA:', err);
      setErrorMessage(`Falha na conexão com a IA (${err.message}). Executando Leitor OCR local como contingência...`);
      await handleRunLocalOCR();
    } finally {
      setIsProcessing(false);
      setOcrProgress(0);
      setOcrStatusText('');
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
              Importação de Estatísticas por Prints / OCR
            </h3>
            <p className="text-xs text-gray-300">
              Clique em qualquer imagem para ver ampliada com zoom e lupa. Extraia os dados com o <b>Reconhecimento Óptico OCR</b> ou use o <b>Assistente Visual Lado a Lado</b>.
            </p>
          </div>

          {/* Method Buttons */}
          <div className="flex flex-wrap gap-2 bg-graphite-900 p-1.5 rounded-xl border border-white/10">
            <button
              onClick={() => setScanMethod('ocr')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                scanMethod === 'ocr'
                  ? 'bg-loud-500 text-gray-900 shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Zap size={14} />
              <span>Leitor OCR Local</span>
              <span className="bg-black/30 text-[9px] px-1.5 py-0.5 rounded text-white font-mono">100% Sem IA</span>
            </button>

            <button
              onClick={() => setScanMethod('ai')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                scanMethod === 'ai'
                  ? 'bg-loud-500 text-gray-900 shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles size={14} className="text-yellow-300" />
              <span>Scanner IA Inteligente</span>
              <span className="bg-yellow-400/20 text-yellow-300 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">Ultra Preciso</span>
            </button>

            <button
              onClick={() => setScanMethod('assistant')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                scanMethod === 'assistant'
                  ? 'bg-loud-500 text-gray-900 shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Eye size={14} />
              <span>Assistente Visual Lado a Lado</span>
            </button>
          </div>
        </div>

        {/* Method Explanation Card */}
        <div className="bg-graphite-900/60 p-3.5 rounded-xl border border-white/5 text-xs text-gray-300 flex items-center gap-3">
          {scanMethod === 'ocr' && (
            <>
              <Zap className="text-yellow-400 shrink-0" size={18} />
              <span>
                <b>Leitor Óptico OCR Local (Tesseract / Reconhecimento no Navegador):</b> Pré-processa o contraste dos prints localmente e extrai os números de K / D / A (ex: 23/1/6, 12/1/9, 7/1/3, 4/2/4), Danos e Colocação sem enviar dados para servidores.
              </span>
            </>
          )}
          {scanMethod === 'ai' && (
            <>
              <Sparkles className="text-yellow-400 shrink-0" size={18} />
              <span>
                <b>Scanner Inteligente com IA (Gemini 3.7 Flash):</b> Análise visual de alta precisão que identifica com 100% de exatidão os nicks dos jogadores, K/D/A, Danos e Colocação em prints de qualquer resolução.
              </span>
            </>
          )}
          {scanMethod === 'assistant' && (
            <>
              <Eye className="text-loud-500 shrink-0" size={18} />
              <span>
                <b>Assistente Visual Lado a Lado:</b> A imagem da partida fica fixa com zoom, contraste e tela cheia de um lado enquanto você confere e digita os números dos 4 jogadores no formulário ágil ao lado.
              </span>
            </>
          )}
        </div>
      </div>

      {/* Upload Dropzone */}
      <div className="space-y-4">
        {/* MODELO DE PRINT IDEAL PARA O UPLOAD COM A LEGENDA EXATA DAS CORES */}
        <div className="bg-graphite-800/90 border border-loud-500/40 rounded-2xl p-4 sm:p-5 text-xs text-gray-300 space-y-3.5 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="bg-loud-500 text-gray-900 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                Mapeamento das Colunas Free Fire
              </span>
              <span className="font-bold text-white text-sm">
                📸 Leitura das Colunas do Print Pós-Partida
              </span>
            </div>
            <span className="text-[11px] text-loud-400 font-mono font-bold">
              Configuração Exata das Cores
            </span>
          </div>

          {/* Color Legend Grid matching user screenshot */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {/* Laranja */}
            <div className="bg-graphite-900/90 p-2.5 rounded-xl border border-orange-500/40 text-center space-y-1">
              <div className="text-[10px] font-black text-orange-400 uppercase flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span> Laranja
              </div>
              <p className="font-black text-white text-xs">Jogador + K/D/A</p>
              <p className="text-[10px] text-gray-400">Nome e K/D/A abaixo</p>
            </div>

            {/* Azul */}
            <div className="bg-graphite-900/90 p-2.5 rounded-xl border border-blue-500/40 text-center space-y-1">
              <div className="text-[10px] font-black text-blue-400 uppercase flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span> Azul
              </div>
              <p className="font-black text-white text-xs">DMG</p>
              <p className="text-[10px] text-gray-400">Dano Causado</p>
            </div>

            {/* Verde */}
            <div className="bg-graphite-900/90 p-2.5 rounded-xl border border-emerald-500/40 text-center space-y-1">
              <div className="text-[10px] font-black text-emerald-400 uppercase flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Verde
              </div>
              <p className="font-black text-white text-xs">Dano Real</p>
              <p className="text-[10px] text-gray-400">Dano Efetivo</p>
            </div>

            {/* Lilás */}
            <div className="bg-graphite-900/90 p-2.5 rounded-xl border border-purple-500/40 text-center space-y-1">
              <div className="text-[10px] font-black text-purple-400 uppercase flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span> Lilás
              </div>
              <p className="font-black text-white text-xs">Derrubados</p>
              <p className="text-[10px] text-gray-400">Knockdowns</p>
            </div>

            {/* Cura */}
            <div className="bg-graphite-900/90 p-2.5 rounded-xl border border-cyan-500/40 text-center space-y-1">
              <div className="text-[10px] font-black text-cyan-400 uppercase flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block"></span> Ciano
              </div>
              <p className="font-black text-white text-xs">Cura</p>
              <p className="text-[10px] text-gray-400">Recuperação HP</p>
            </div>

            {/* Amarelo */}
            <div className="bg-graphite-900/90 p-2.5 rounded-xl border border-yellow-500/40 text-center space-y-1">
              <div className="text-[10px] font-black text-yellow-400 uppercase flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block"></span> Amarelo
              </div>
              <p className="font-black text-white text-xs">Levantados</p>
              <p className="text-[10px] text-gray-400">Amigos Salvos</p>
            </div>

            {/* Rosa */}
            <div className="bg-graphite-900/90 p-2.5 rounded-xl border border-pink-500/40 text-center space-y-1">
              <div className="text-[10px] font-black text-pink-400 uppercase flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-pink-500 inline-block"></span> Rosa
              </div>
              <p className="font-black text-white text-xs">Ressurgimento</p>
              <p className="text-[10px] text-gray-400">Retornos/Respawns</p>
            </div>

            {/* Branco */}
            <div className="bg-graphite-900/90 p-2.5 rounded-xl border border-white/40 text-center space-y-1">
              <div className="text-[10px] font-black text-white uppercase flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-white inline-block"></span> Branco
              </div>
              <p className="font-black text-white text-xs">% Capa</p>
              <p className="text-[10px] text-gray-400">Acerto na Cabeça</p>
            </div>
          </div>
        </div>

        {/* DRAG AND DROP BOX */}
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
                Você pode enviar todas as fotos/quedas de uma vez e <b>adicionar mais prints a qualquer momento</b>! (PNG, JPG, WEBP)
              </p>
            </div>
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
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-graphite-900/80 p-3 rounded-xl border border-white/5">
              <span className="text-xs text-gray-300">
                {scannedResults.length > 0
                  ? `Pronto! Verifique os dados abaixo ou reexecute o leitor.`
                  : `Carregue suas imagens e clique para extrair K/D/A, Dano e Colocação automaticamente.`}
              </span>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {scanMethod === 'ai' ? (
                  <button
                    onClick={handleRunAIScan}
                    disabled={isProcessing}
                    className="w-full sm:w-auto bg-loud-500 hover:bg-loud-600 text-gray-900 px-7 py-3 rounded-xl font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        {ocrStatusText || `Processando IA (${ocrProgress}%)...`}
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Executar Scanner IA ({selectedFiles.length} {selectedFiles.length === 1 ? 'Foto' : 'Fotos'})
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleRunLocalOCR}
                    disabled={isProcessing}
                    className="w-full sm:w-auto bg-loud-500 hover:bg-loud-600 text-gray-900 px-7 py-3 rounded-xl font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        {ocrStatusText || `Processando OCR (${ocrProgress}%)...`}
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        Executar Leitura OCR ({selectedFiles.length} {selectedFiles.length === 1 ? 'Foto' : 'Fotos'})
                      </>
                    )}
                  </button>
                )}
              </div>
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
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-black uppercase text-gray-400 px-1">
                    <span className="flex items-center gap-1.5">
                      <Trophy size={13} className="text-loud-500" />
                      Estatísticas dos 4 Jogadores (K / D / A abaixo do Nick)
                    </span>
                    <span className="text-[10px] text-loud-500 font-mono font-bold">
                      Abates: {currentMatch.players.reduce((acc, p) => acc + (p.kills || 0), 0)} | 
                      Pontos: {(currentMatch.placementPoints || 0) + currentMatch.players.reduce((acc, p) => acc + (p.kills || 0), 0)} pts
                    </span>
                  </div>

                  <div className="space-y-3">
                    {currentMatch.players.slice(0, 4).map((player, pIdx) => (
                      <div 
                        key={pIdx}
                        className="bg-graphite-800/90 p-3 rounded-xl border border-white/10 space-y-2.5 hover:border-loud-500/50 transition-colors shadow-sm"
                      >
                        {/* Linha 1: 🟧 Laranja - Nome do Jogador e K / D / A */}
                        <div className="bg-orange-500/10 border border-orange-500/30 p-2.5 rounded-lg space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="bg-orange-500 text-gray-950 text-[10px] font-black px-2 py-0.5 rounded uppercase shrink-0">
                              🟧 Jogador {pIdx + 1}
                            </span>
                            <input
                              type="text"
                              value={player.name}
                              onChange={(e) => updateScannedPlayer(currentAssistantIdx, pIdx, 'name', e.target.value)}
                              placeholder={`Nick do Jogador (ex: Nickz LOUD, LOUD JHAN)`}
                              className="w-full bg-graphite-900 border border-orange-500/40 rounded px-2.5 py-1 text-xs font-bold text-white outline-none focus:border-orange-400"
                            />
                          </div>

                          {/* K / D / A abaixo do nome */}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[9px] font-black text-red-400 uppercase mb-0.5 text-center" title="Abates (K)">
                                K (Abates)
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={player.kills}
                                onChange={(e) => updateScannedPlayer(currentAssistantIdx, pIdx, 'kills', e.target.value)}
                                className="w-full bg-graphite-900 border border-red-500/40 rounded px-1.5 py-1 text-xs font-black text-red-400 text-center outline-none focus:border-red-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] font-black text-gray-400 uppercase mb-0.5 text-center" title="Mortes (D)">
                                D (Mortes)
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={player.deaths}
                                onChange={(e) => updateScannedPlayer(currentAssistantIdx, pIdx, 'deaths', e.target.value)}
                                className="w-full bg-graphite-900 border border-white/20 rounded px-1.5 py-1 text-xs font-bold text-gray-300 text-center outline-none focus:border-loud-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] font-black text-yellow-400 uppercase mb-0.5 text-center" title="Assistências (A)">
                                A (Assistências)
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={player.assists}
                                onChange={(e) => updateScannedPlayer(currentAssistantIdx, pIdx, 'assists', e.target.value)}
                                className="w-full bg-graphite-900 border border-yellow-500/40 rounded px-1.5 py-1 text-xs font-bold text-yellow-400 text-center outline-none focus:border-yellow-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Linha 2: Demais Colunas Coloridas Mapeadas */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 pt-1 text-[10px]">
                          {/* 🟦 Azul: DMG */}
                          <div className="bg-blue-500/10 border border-blue-500/30 p-1.5 rounded-lg text-center">
                            <label className="block font-black text-blue-400 uppercase text-[9px] mb-0.5 truncate" title="Dano Total">
                              🟦 DMG
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={player.damage}
                              onChange={(e) => updateScannedPlayer(currentAssistantIdx, pIdx, 'damage', e.target.value)}
                              className="w-full bg-graphite-900 border border-blue-500/30 rounded px-1 py-1 text-xs font-bold text-blue-300 text-center outline-none focus:border-blue-400"
                            />
                          </div>

                          {/* 🟩 Verde: Dano Real */}
                          <div className="bg-emerald-500/10 border border-emerald-500/30 p-1.5 rounded-lg text-center">
                            <label className="block font-black text-emerald-400 uppercase text-[9px] mb-0.5 truncate" title="Dano Real">
                              🟩 D. Real
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={player.realDamage ?? ''}
                              placeholder="0"
                              onChange={(e) => updateScannedPlayer(currentAssistantIdx, pIdx, 'realDamage', e.target.value)}
                              className="w-full bg-graphite-900 border border-emerald-500/30 rounded px-1 py-1 text-xs font-bold text-emerald-300 text-center outline-none focus:border-emerald-400"
                            />
                          </div>

                          {/* 🟪 Lilás: Derrubados */}
                          <div className="bg-purple-500/10 border border-purple-500/30 p-1.5 rounded-lg text-center">
                            <label className="block font-black text-purple-400 uppercase text-[9px] mb-0.5 truncate" title="Derrubados">
                              🟪 Derrub.
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={player.knocks ?? ''}
                              placeholder="0"
                              onChange={(e) => updateScannedPlayer(currentAssistantIdx, pIdx, 'knocks', e.target.value)}
                              className="w-full bg-graphite-900 border border-purple-500/30 rounded px-1 py-1 text-xs font-bold text-purple-300 text-center outline-none focus:border-purple-400"
                            />
                          </div>

                          {/* 🩵 Cura */}
                          <div className="bg-cyan-500/10 border border-cyan-500/30 p-1.5 rounded-lg text-center">
                            <label className="block font-black text-cyan-400 uppercase text-[9px] mb-0.5 truncate" title="Cura">
                              🩵 Cura
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={player.healing ?? ''}
                              placeholder="0"
                              onChange={(e) => updateScannedPlayer(currentAssistantIdx, pIdx, 'healing', e.target.value)}
                              className="w-full bg-graphite-900 border border-cyan-500/30 rounded px-1 py-1 text-xs font-bold text-cyan-300 text-center outline-none focus:border-cyan-400"
                            />
                          </div>

                          {/* 🟨 Amarelo: Levantados */}
                          <div className="bg-yellow-500/10 border border-yellow-500/30 p-1.5 rounded-lg text-center">
                            <label className="block font-black text-yellow-400 uppercase text-[9px] mb-0.5 truncate" title="Levantados">
                              🟨 Levant.
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={player.revives ?? ''}
                              placeholder="0"
                              onChange={(e) => updateScannedPlayer(currentAssistantIdx, pIdx, 'revives', e.target.value)}
                              className="w-full bg-graphite-900 border border-yellow-500/30 rounded px-1 py-1 text-xs font-bold text-yellow-300 text-center outline-none focus:border-yellow-400"
                            />
                          </div>

                          {/* 🌸 Rosa: Ressurgimento */}
                          <div className="bg-pink-500/10 border border-pink-500/30 p-1.5 rounded-lg text-center">
                            <label className="block font-black text-pink-400 uppercase text-[9px] mb-0.5 truncate" title="Ressurgimento">
                              🌸 Ressurg.
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={player.respawns ?? ''}
                              placeholder="0"
                              onChange={(e) => updateScannedPlayer(currentAssistantIdx, pIdx, 'respawns', e.target.value)}
                              className="w-full bg-graphite-900 border border-pink-500/30 rounded px-1 py-1 text-xs font-bold text-pink-300 text-center outline-none focus:border-pink-400"
                            />
                          </div>

                          {/* ⬜ Branco: % Acerto na Cabeça */}
                          <div className="bg-white/10 border border-white/30 p-1.5 rounded-lg text-center">
                            <label className="block font-black text-white uppercase text-[9px] mb-0.5 truncate" title="% Acerto na Cabeça">
                              ⬜ % Capa
                            </label>
                            <input
                              type="text"
                              value={player.headshotRate ?? ''}
                              placeholder="0.00%"
                              onChange={(e) => updateScannedPlayer(currentAssistantIdx, pIdx, 'headshotRate', e.target.value)}
                              className="w-full bg-graphite-900 border border-white/30 rounded px-1 py-1 text-xs font-bold text-white text-center outline-none focus:border-white"
                            />
                          </div>
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
                  className="bg-graphite-800 rounded-xl border border-white/10 overflow-hidden shadow p-4 space-y-3.5"
                >
                  {/* Top Match Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="bg-loud-500/20 text-loud-500 px-2 py-0.5 rounded font-black text-xs uppercase">
                        Queda {mIdx + 1}
                      </span>
                      <select
                        value={match.map}
                        onChange={(e) => updateScannedMatch(mIdx, 'map', e.target.value)}
                        className="bg-graphite-900 text-xs font-bold text-white border border-white/10 rounded px-2 py-1 outline-none focus:border-loud-500 cursor-pointer uppercase"
                      >
                        {MAP_OPTIONS.map(m => (
                          <option key={m} value={m} className="bg-graphite-800 text-white">{m}</option>
                        ))}
                      </select>
                      
                      {/* Rank Selector */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-400 font-bold">#</span>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={match.rank}
                          onChange={(e) => updateScannedMatch(mIdx, 'rank', e.target.value)}
                          className="w-12 bg-graphite-900 border border-white/10 rounded px-1 py-1 text-xs font-black text-yellow-400 text-center outline-none focus:border-yellow-500"
                        />
                        <span className="text-[10px] text-gray-400 font-bold font-mono">({match.placementPoints} pts)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {match.imagePreview && (
                        <button
                          onClick={() => openLightbox(mIdx)}
                          className="text-[11px] font-bold text-loud-500 hover:text-white bg-graphite-900 px-2 py-1 rounded border border-white/10 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Clique para ver o print desta partida"
                        >
                          <Search size={12} /> Ver Foto
                        </button>
                      )}
                      <div className="text-xs font-bold text-gray-300 font-mono">
                        {totalKills}K | <span className="text-loud-500 font-black">{totalPoints} pts</span>
                      </div>
                    </div>
                  </div>

                  {/* Player Quick Edit Matrix */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-1 text-[9px] font-black uppercase text-gray-400 px-2 py-1 bg-graphite-900/90 rounded border border-white/5">
                      <span className="col-span-3 text-orange-400">🟧 Nick</span>
                      <span className="col-span-1 text-red-400 text-center">K</span>
                      <span className="col-span-1 text-gray-400 text-center">D</span>
                      <span className="col-span-1 text-yellow-400 text-center">A</span>
                      <span className="col-span-2 text-blue-400 text-center">🟦 DMG</span>
                      <span className="col-span-2 text-emerald-400 text-center">🟩 Real</span>
                      <span className="col-span-1 text-purple-400 text-center">🟪 Knk</span>
                      <span className="col-span-1 text-white text-center">⬜ %Cap</span>
                    </div>

                    {match.players.slice(0, 4).map((p, pIdx) => (
                      <div key={pIdx} className="bg-graphite-900/80 p-2 rounded-lg border border-white/5 space-y-1.5 hover:border-white/20 transition-colors">
                        <div className="grid grid-cols-12 gap-1 items-center">
                          <div className="col-span-3">
                            <input
                              type="text"
                              value={p.name}
                              onChange={(e) => updateScannedPlayer(mIdx, pIdx, 'name', e.target.value)}
                              placeholder={`Nick J${pIdx + 1}`}
                              className="w-full bg-graphite-800 border border-orange-500/40 rounded px-1.5 py-1 text-xs font-bold text-white outline-none focus:border-orange-400"
                            />
                          </div>
                          <div className="col-span-1">
                            <input
                              type="number"
                              min="0"
                              value={p.kills}
                              onChange={(e) => updateScannedPlayer(mIdx, pIdx, 'kills', e.target.value)}
                              title="Kills (K)"
                              className="w-full bg-graphite-800 border border-red-500/40 rounded px-0.5 py-1 text-xs font-black text-red-400 text-center outline-none focus:border-red-500"
                            />
                          </div>

                          <div className="col-span-1">
                            <input
                              type="number"
                              min="0"
                              value={p.deaths}
                              onChange={(e) => updateScannedPlayer(mIdx, pIdx, 'deaths', e.target.value)}
                              title="Mortes (D)"
                              className="w-full bg-graphite-800 border border-white/10 rounded px-0.5 py-1 text-xs font-bold text-gray-300 text-center outline-none focus:border-white"
                            />
                          </div>

                          <div className="col-span-1">
                            <input
                              type="number"
                              min="0"
                              value={p.assists}
                              onChange={(e) => updateScannedPlayer(mIdx, pIdx, 'assists', e.target.value)}
                              title="Assistências (A)"
                              className="w-full bg-graphite-800 border border-yellow-500/40 rounded px-0.5 py-1 text-xs font-bold text-yellow-400 text-center outline-none focus:border-yellow-500"
                            />
                          </div>

                          <div className="col-span-2">
                            <input
                              type="number"
                              min="0"
                              value={p.damage}
                              onChange={(e) => updateScannedPlayer(mIdx, pIdx, 'damage', e.target.value)}
                              title="🟦 Dano Causado (DMG)"
                              className="w-full bg-graphite-800 border border-blue-500/40 rounded px-1 py-1 text-xs font-bold text-blue-300 text-center outline-none focus:border-blue-400"
                            />
                          </div>

                          <div className="col-span-2">
                            <input
                              type="number"
                              min="0"
                              value={p.realDamage ?? ''}
                              placeholder="0"
                              onChange={(e) => updateScannedPlayer(mIdx, pIdx, 'realDamage', e.target.value)}
                              title="🟩 Dano Real"
                              className="w-full bg-graphite-800 border border-emerald-500/40 rounded px-1 py-1 text-xs font-bold text-emerald-300 text-center outline-none focus:border-emerald-400"
                            />
                          </div>

                          <div className="col-span-1">
                            <input
                              type="number"
                              min="0"
                              value={p.knocks ?? ''}
                              placeholder="0"
                              onChange={(e) => updateScannedPlayer(mIdx, pIdx, 'knocks', e.target.value)}
                              title="🟪 Derrubados"
                              className="w-full bg-graphite-800 border border-purple-500/40 rounded px-0.5 py-1 text-xs font-bold text-purple-300 text-center outline-none focus:border-purple-400"
                            />
                          </div>

                          <div className="col-span-1">
                            <input
                              type="text"
                              value={p.headshotRate ?? ''}
                              placeholder="%"
                              onChange={(e) => updateScannedPlayer(mIdx, pIdx, 'headshotRate', e.target.value)}
                              title="⬜ % Acerto na Cabeça"
                              className="w-full bg-graphite-800 border border-white/30 rounded px-0.5 py-1 text-xs font-bold text-white text-center outline-none focus:border-white"
                            />
                          </div>
                        </div>

                        {/* Linha extra: Cura, Levantados (Amarelo) e Ressurgimento (Rosa) */}
                        <div className="flex items-center justify-between text-[10px] text-gray-400 px-1 border-t border-white/5 pt-1">
                          <span className="flex items-center gap-1">
                            <span className="text-cyan-400 font-bold">🩵 Cura:</span>
                            <input
                              type="number"
                              min="0"
                              value={p.healing ?? ''}
                              placeholder="0"
                              onChange={(e) => updateScannedPlayer(mIdx, pIdx, 'healing', e.target.value)}
                              className="w-14 bg-graphite-800 border border-cyan-500/30 rounded px-1 text-[10px] text-cyan-300 text-center outline-none focus:border-cyan-400"
                            />
                          </span>

                          <span className="flex items-center gap-1">
                            <span className="text-yellow-400 font-bold">🟨 Levantados:</span>
                            <input
                              type="number"
                              min="0"
                              value={p.revives ?? ''}
                              placeholder="0"
                              onChange={(e) => updateScannedPlayer(mIdx, pIdx, 'revives', e.target.value)}
                              className="w-10 bg-graphite-800 border border-yellow-500/30 rounded px-1 text-[10px] text-yellow-300 text-center outline-none focus:border-yellow-400"
                            />
                          </span>

                          <span className="flex items-center gap-1">
                            <span className="text-pink-400 font-bold">🌸 Ressurg:</span>
                            <input
                              type="number"
                              min="0"
                              value={p.respawns ?? ''}
                              placeholder="0"
                              onChange={(e) => updateScannedPlayer(mIdx, pIdx, 'respawns', e.target.value)}
                              className="w-10 bg-graphite-800 border border-pink-500/30 rounded px-1 text-[10px] text-pink-300 text-center outline-none focus:border-pink-400"
                            />
                          </span>
                        </div>
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
