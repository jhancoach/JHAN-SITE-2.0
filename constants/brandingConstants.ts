import { BrandThemePreset, TeamLogoItem, PDFBrandingSettings, GlobalBrandProfile } from '../types';

export const DEFAULT_BRAND_PRESETS: BrandThemePreset[] = [
  {
    id: 'loud',
    name: 'LOUD eSports',
    teamTag: 'LLL',
    isDark: true,
    logoUrl: 'https://i.ibb.co/mCS1fCxY/Whats-App-Image-2025-10-26-at-08-14-03.jpg',
    colors: {
      primary: '#00ff66',
      secondary: '#00cc52',
      accent: '#00ff88',
      background: '#0a0d12',
      cardBackground: '#121820',
      textContrast: '#ffffff',
      mutedText: '#9ca3af',
      border: 'rgba(0, 255, 102, 0.2)'
    }
  },
  {
    id: 'furia',
    name: 'FURIA Panther',
    teamTag: 'FURIA',
    isDark: true,
    logoUrl: 'https://images.seeklogo.com/logo-png/36/1/furia-esports-logo-png_seeklogo-360408.png',
    colors: {
      primary: '#ffffff',
      secondary: '#9ca3af',
      accent: '#e5e7eb',
      background: '#09090b',
      cardBackground: '#18181b',
      textContrast: '#ffffff',
      mutedText: '#a1a1aa',
      border: 'rgba(255, 255, 255, 0.2)'
    }
  },
  {
    id: 'fluxo',
    name: 'FLUXO',
    teamTag: 'FX',
    isDark: true,
    logoUrl: 'https://images.seeklogo.com/logo-png/42/1/fluxo-esports-logo-png_seeklogo-420220.png',
    colors: {
      primary: '#a855f7',
      secondary: '#9333ea',
      accent: '#c084fc',
      background: '#0d0a18',
      cardBackground: '#18122c',
      textContrast: '#ffffff',
      mutedText: '#a8a29e',
      border: 'rgba(168, 85, 247, 0.25)'
    }
  },
  {
    id: 'pain',
    name: 'paiN Gaming',
    teamTag: 'PNG',
    isDark: true,
    logoUrl: 'https://images.seeklogo.com/logo-png/33/2/pain-gaming-logo-png_seeklogo-335340.png',
    colors: {
      primary: '#ef4444',
      secondary: '#dc2626',
      accent: '#f87171',
      background: '#120a0a',
      cardBackground: '#201212',
      textContrast: '#ffffff',
      mutedText: '#9ca3af',
      border: 'rgba(239, 68, 68, 0.25)'
    }
  },
  {
    id: 'losgrandes',
    name: 'Los Grandes / Wave',
    teamTag: 'LOS',
    isDark: true,
    logoUrl: 'https://images.seeklogo.com/logo-png/42/1/los-grandes-logo-png_seeklogo-420221.png',
    colors: {
      primary: '#f97316',
      secondary: '#ea580c',
      accent: '#fb923c',
      background: '#120c08',
      cardBackground: '#22160e',
      textContrast: '#ffffff',
      mutedText: '#9ca3af',
      border: 'rgba(249, 115, 22, 0.25)'
    }
  },
  {
    id: 'magicsquad',
    name: 'Magic Squad (Campeão Mundial)',
    teamTag: 'MGC',
    isDark: true,
    logoUrl: 'https://images.seeklogo.com/logo-png/43/1/magic-squad-logo-png_seeklogo-434079.png',
    colors: {
      primary: '#eab308',
      secondary: '#ca8a04',
      accent: '#fde047',
      background: '#121008',
      cardBackground: '#221e0e',
      textContrast: '#ffffff',
      mutedText: '#a1a1aa',
      border: 'rgba(234, 179, 8, 0.25)'
    }
  },
  {
    id: 'vivokeyd',
    name: 'Vivo Keyd Stars',
    teamTag: 'VKS',
    isDark: true,
    logoUrl: 'https://images.seeklogo.com/logo-png/44/1/vivo-keyd-stars-logo-png_seeklogo-442817.png',
    colors: {
      primary: '#8b5cf6',
      secondary: '#3b82f6',
      accent: '#a78bfa',
      background: '#090d1a',
      cardBackground: '#11182c',
      textContrast: '#ffffff',
      mutedText: '#9ca3af',
      border: 'rgba(139, 92, 246, 0.25)'
    }
  },
  {
    id: 'corinthians',
    name: 'Corinthians Free Fire',
    teamTag: 'SCCP',
    isDark: true,
    logoUrl: 'https://images.seeklogo.com/logo-png/36/1/corinthians-esports-logo-png_seeklogo-362021.png',
    colors: {
      primary: '#ffffff',
      secondary: '#dc2626',
      accent: '#ef4444',
      background: '#09090b',
      cardBackground: '#18181b',
      textContrast: '#ffffff',
      mutedText: '#71717a',
      border: 'rgba(255, 255, 255, 0.2)'
    }
  },
  {
    id: 'alpha7',
    name: 'Alpha7 Esports',
    teamTag: 'A7',
    isDark: true,
    colors: {
      primary: '#06b6d4',
      secondary: '#0891b2',
      accent: '#67e8f9',
      background: '#071018',
      cardBackground: '#0d2030',
      textContrast: '#ffffff',
      mutedText: '#94a3b8',
      border: 'rgba(6, 182, 212, 0.25)'
    }
  },
  {
    id: 'liquid',
    name: 'Team Liquid',
    teamTag: 'TL',
    isDark: true,
    logoUrl: 'https://images.seeklogo.com/logo-png/31/2/team-liquid-logo-png_seeklogo-315878.png',
    colors: {
      primary: '#38bdf8',
      secondary: '#0284c7',
      accent: '#7dd3fc',
      background: '#07111e',
      cardBackground: '#0d223c',
      textContrast: '#ffffff',
      mutedText: '#94a3b8',
      border: 'rgba(56, 189, 248, 0.25)'
    }
  },
  {
    id: 'blackdragons',
    name: 'Black Dragons',
    teamTag: 'BD',
    isDark: true,
    colors: {
      primary: '#e11d48',
      secondary: '#be123c',
      accent: '#fb7185',
      background: '#14080c',
      cardBackground: '#260f16',
      textContrast: '#ffffff',
      mutedText: '#9ca3af',
      border: 'rgba(225, 29, 72, 0.25)'
    }
  },
  {
    id: 'cyber',
    name: 'Cyber Neon Pro',
    teamTag: 'CYBER',
    isDark: true,
    colors: {
      primary: '#00f0ff',
      secondary: '#7000ff',
      accent: '#ff0077',
      background: '#080814',
      cardBackground: '#121226',
      textContrast: '#ffffff',
      mutedText: '#a1a1aa',
      border: 'rgba(0, 240, 255, 0.3)'
    }
  },
  {
    id: 'minimal_light',
    name: 'Corporate Clean Light',
    teamTag: 'PRO',
    isDark: false,
    colors: {
      primary: '#2563eb',
      secondary: '#1d4ed8',
      accent: '#3b82f6',
      background: '#f8fafc',
      cardBackground: '#ffffff',
      textContrast: '#0f172a',
      mutedText: '#64748b',
      border: 'rgba(15, 23, 42, 0.12)'
    }
  },
  {
    id: 'minimal_dark',
    name: 'Titanium Stealth Dark',
    teamTag: 'DARK',
    isDark: true,
    colors: {
      primary: '#60a5fa',
      secondary: '#3b82f6',
      accent: '#93c5fd',
      background: '#090d16',
      cardBackground: '#131b2e',
      textContrast: '#ffffff',
      mutedText: '#94a3b8',
      border: 'rgba(96, 165, 250, 0.2)'
    }
  }
];

export const INITIAL_PRESET_LOGOS: TeamLogoItem[] = [
  {
    id: 'logo-loud',
    name: 'LOUD Esports',
    category: 'LBFF & Pro League',
    imageUrl: 'https://i.ibb.co/mCS1fCxY/Whats-App-Image-2025-10-26-at-08-14-03.jpg',
    isFavorite: true
  },
  {
    id: 'logo-furia',
    name: 'FURIA Esports',
    category: 'LBFF & Pro League',
    imageUrl: 'https://images.seeklogo.com/logo-png/36/1/furia-esports-logo-png_seeklogo-360408.png',
    isFavorite: true
  },
  {
    id: 'logo-fluxo',
    name: 'FLUXO',
    category: 'LBFF & Pro League',
    imageUrl: 'https://images.seeklogo.com/logo-png/42/1/fluxo-esports-logo-png_seeklogo-420220.png',
    isFavorite: true
  },
  {
    id: 'logo-pain',
    name: 'paiN Gaming',
    category: 'LBFF & Pro League',
    imageUrl: 'https://images.seeklogo.com/logo-png/33/2/pain-gaming-logo-png_seeklogo-335340.png',
    isFavorite: true
  },
  {
    id: 'logo-los-grandes',
    name: 'Los Grandes',
    category: 'LBFF & Pro League',
    imageUrl: 'https://images.seeklogo.com/logo-png/42/1/los-grandes-logo-png_seeklogo-420221.png',
    isFavorite: true
  },
  {
    id: 'logo-magic-squad',
    name: 'Magic Squad',
    category: 'FFWS Mundial',
    imageUrl: 'https://images.seeklogo.com/logo-png/43/1/magic-squad-logo-png_seeklogo-434079.png',
    isFavorite: true
  },
  {
    id: 'logo-vivo-keyd',
    name: 'Vivo Keyd Stars',
    category: 'LBFF & Pro League',
    imageUrl: 'https://images.seeklogo.com/logo-png/44/1/vivo-keyd-stars-logo-png_seeklogo-442817.png',
    isFavorite: true
  },
  {
    id: 'logo-corinthians',
    name: 'Corinthians FF',
    category: 'LBFF & Pro League',
    imageUrl: 'https://images.seeklogo.com/logo-png/36/1/corinthians-esports-logo-png_seeklogo-362021.png',
    isFavorite: true
  },
  {
    id: 'logo-liquid',
    name: 'Team Liquid',
    category: 'FFWS Mundial',
    imageUrl: 'https://images.seeklogo.com/logo-png/31/2/team-liquid-logo-png_seeklogo-315878.png',
    isFavorite: true
  },
  {
    id: 'logo-w7m',
    name: 'W7M Esports',
    category: 'LBFF & Pro League',
    imageUrl: 'https://images.seeklogo.com/logo-png/43/1/w7m-esports-logo-png_seeklogo-434080.png',
    isFavorite: false
  },
  {
    id: 'logo-team-solid',
    name: 'Team Solid',
    category: 'LBFF & Pro League',
    imageUrl: 'https://images.seeklogo.com/logo-png/46/1/team-solid-logo-png_seeklogo-468082.png',
    isFavorite: false
  },
  {
    id: 'logo-alpha7',
    name: 'Alpha7 Esports',
    category: 'FFWS Mundial',
    imageUrl: 'https://i.ibb.co/0RYb6MsC/BE.png',
    isFavorite: false
  },
  {
    id: 'logo-black-dragons',
    name: 'Black Dragons',
    category: 'Emulador & Guildas',
    imageUrl: 'https://i.ibb.co/6RVvsxFb/SUPER-MOCHILA-DE-PERNA.png',
    isFavorite: false
  },
  {
    id: 'logo-faz-o-p',
    name: 'Faz o P (paiN Emulador)',
    category: 'Emulador & Guildas',
    imageUrl: 'https://images.seeklogo.com/logo-png/33/2/pain-gaming-logo-png_seeklogo-335340.png',
    isFavorite: false
  },
  {
    id: 'logo-crias',
    name: 'Crias (Fluxo Emulador)',
    category: 'Emulador & Guildas',
    imageUrl: 'https://images.seeklogo.com/logo-png/42/1/fluxo-esports-logo-png_seeklogo-420220.png',
    isFavorite: false
  },
  {
    id: 'logo-noise',
    name: 'NOISE (LOUD Emulador)',
    category: 'Emulador & Guildas',
    imageUrl: 'https://i.ibb.co/mCS1fCxY/Whats-App-Image-2025-10-26-at-08-14-03.jpg',
    isFavorite: false
  }
];

export const DEFAULT_PDF_BRANDING: PDFBrandingSettings = {
  layoutStyle: 'executive_dark',
  classification: 'CONFIDENCIAL',
  showWatermark: true,
  watermarkText: 'CONFIDENCIAL • DIRETORIA & COACHING STAFF',
  watermarkOpacity: 0.05,
  showCoachSignature: true,
  coachTitle: 'Head Coach & Performance Analyst',
  coachLicenseOrId: 'JHAN ANALYTICS #2026',
  showSponsorFooter: true,
  organizationTagline: 'Divisão Profissional Free Fire • Performance & Análise Tática',
  sponsorName: 'JHAN MEDEIROS ESPORTS ANALYTICS',
  includeQrCode: false
};

export const DEFAULT_GLOBAL_BRAND_PROFILE: GlobalBrandProfile = {
  teamName: 'LOUD',
  teamTagline: 'Divisão Profissional Free Fire • Elite Performance',
  activeLogoUrl: 'https://i.ibb.co/mCS1fCxY/Whats-App-Image-2025-10-26-at-08-14-03.jpg',
  selectedPresetId: 'loud',
  colors: {
    primary: '#00ff66',
    secondary: '#00cc52',
    accent: '#00ff88',
    background: '#0a0d12',
    cardBackground: '#121820',
    textContrast: '#ffffff',
    mutedText: '#9ca3af',
    border: 'rgba(0, 255, 102, 0.2)'
  },
  pdfBranding: DEFAULT_PDF_BRANDING
};
