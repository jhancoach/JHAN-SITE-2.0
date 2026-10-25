
import html2canvas from 'html2canvas';

export const parseCSV = async (url: string): Promise<any[]> => {
  try {
    const response = await fetch(url);
    let text = await response.text();
    
    // Remove BOM (Byte Order Mark) if present (common cause of first header failure)
    text = text.replace(/^\uFEFF/, '');
    
    // Detect delimiter (comma or semicolon) based on first line
    const firstLine = text.split('\n')[0];
    if (!firstLine) return [];
    
    const separator = firstLine.includes(';') ? ';' : ',';
    
    // Regex to split by separator but ignore separator inside quotes
    const splitRegex = new RegExp(`${separator}(?=(?:(?:[^"]*"){2})*[^"]*$)`);

    const rows = text.split('\n').filter(r => r.trim() !== ''); // Remove empty lines
    if (rows.length < 2) return [];

    // Clean headers: remove quotes, extra spaces, and invisible chars
    const headers = rows[0].split(splitRegex).map(h => 
        h.trim().replace(/^"|"$/g, '').replace(/""/g, '"').trim()
    );
    
    return rows.slice(1).map(row => {
      const cells = row.split(splitRegex);
      const obj: any = {};
      
      headers.forEach((header, index) => {
        if (cells[index] !== undefined) {
           // Clean quotes and whitespace from values
           obj[header] = cells[index].trim().replace(/^"|"$/g, '').replace(/""/g, '"');
        }
      });
      return obj;
    });
  } catch (error) {
    console.error("Error parsing CSV:", error);
    return [];
  }
};

export const downloadDivAsImage = async (elementId: string, fileName: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const html2canvasLib = (window as any).html2canvas || html2canvas;
  if (!html2canvasLib) {
    alert("Biblioteca de captura não encontrada. Por favor, tire um Print (Captura de Tela).");
    return;
  }

  try {
    // High Resolution capture with clean desktop presentation cloning
    const canvas = await html2canvasLib(element, {
      backgroundColor: '#0c0c0e',
      useCORS: true,
      allowTaint: true,
      scale: 2, // 2x high resolution
      logging: false,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc: Document) => {
        const clonedEl = clonedDoc.getElementById(elementId);
        if (!clonedEl) return;

        // Force high quality desktop presentation width for export
        clonedEl.style.width = '1440px';
        clonedEl.style.maxWidth = '1440px';
        clonedEl.style.minWidth = '1440px';
        clonedEl.style.boxSizing = 'border-box';
        clonedEl.style.padding = '32px';
        clonedEl.style.borderRadius = '28px';
        clonedEl.style.backgroundColor = '#0c0c0e';
        clonedEl.style.border = '2px solid rgba(58, 255, 0, 0.25)';

        // Hide action and editing buttons on the exported image
        const buttonsToHide = clonedEl.querySelectorAll('button, input[type="file"], .export-hide');
        buttonsToHide.forEach((btn: any) => {
          btn.style.display = 'none';
        });

        // Ensure player inputs render cleanly as solid text without borders or placeholder styles
        const inputs = clonedEl.querySelectorAll('input[type="text"]');
        inputs.forEach((input: any) => {
          input.style.border = 'none';
          input.style.backgroundColor = 'transparent';
          input.style.outline = 'none';
          if (!input.value && input.placeholder) {
            input.value = input.placeholder;
          }
        });

        // Ensure player cards are arranged in 4 columns side-by-side
        const playersGrid = clonedEl.querySelector('.players-cards-grid');
        if (playersGrid) {
          (playersGrid as HTMLElement).style.display = 'grid';
          (playersGrid as HTMLElement).style.gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
          (playersGrid as HTMLElement).style.gap = '20px';
          (playersGrid as HTMLElement).style.width = '100%';
        }

        // Ensure images have crossOrigin set
        const images = clonedEl.querySelectorAll('img');
        images.forEach((img: HTMLImageElement) => {
          img.crossOrigin = 'anonymous';
        });
      }
    });
    
    saveCanvas(canvas, fileName);

  } catch (err) {
    console.warn("High-res capture failed, retrying with fallback...", err);
    try {
      const canvas = await html2canvasLib(element, {
        backgroundColor: '#0c0c0e',
        useCORS: true,
        allowTaint: true,
        scale: 1, 
        logging: false,
      });
      saveCanvas(canvas, fileName);
    } catch (err2) {
      console.error("Download failed:", err2);
      alert("Não foi possível gerar a imagem automaticamente. Por favor, tire um Print (Captura de Tela).");
    }
  }
};

const saveCanvas = (canvas: HTMLCanvasElement, fileName: string) => {
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Robust helper to find value in row
export const findValue = (row: any, searchKeys: string[], isUrl = false): string | undefined => {
    const keys = Object.keys(row);
    
    // 1. Try exact or fuzzy key match
    for (const sKey of searchKeys) {
        // Exact match
        if (row[sKey]) return row[sKey];
        // Case insensitive match on key
        const foundKey = keys.find(k => k.toLowerCase().trim() === sKey.toLowerCase());
        if (foundKey && row[foundKey]) return row[foundKey];
        // Partial match on key (e.g. 'Nome do Personagem' matches 'nome')
        const partialKey = keys.find(k => k.toLowerCase().includes(sKey.toLowerCase()));
        if (partialKey && row[partialKey]) return row[partialKey];
    }
    
    const values = Object.values(row) as string[];

    // 2. URL Fallback: Find first string starting with http
    if (isUrl) {
        const urlValue = values.find(v => typeof v === 'string' && v.trim().startsWith('http'));
        if (urlValue) return urlValue;
    }

    // 3. Name Fallback: Find first non-URL string that looks like a name
    if (!isUrl) {
         // Exclude common description/type keywords if possible, but mainly look for short text
         const nameValue = values.find(v => 
            typeof v === 'string' && 
            !v.trim().startsWith('http') && 
            v.trim().length > 1 && 
            v.trim().length < 40 && // Assume names aren't super long descriptions
            !['ativo', 'passivo', 'active', 'passive'].includes(v.toLowerCase().trim())
         );
         if (nameValue) return nameValue;
    }
    
    return undefined;
};
