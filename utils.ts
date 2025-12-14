
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

  try {
    const canvas = await (window as any).html2canvas(element, {
      backgroundColor: '#09090b', // Match the new Zinc-950 dark background for seamless captures
      useCORS: true,
      scale: 2 // High resolution
    });
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = canvas.toDataURL();
    link.click();
  } catch (err) {
    console.error("Download failed:", err);
    alert("Erro ao gerar imagem. Verifique se as imagens externas permitem CORS.");
  }
};
