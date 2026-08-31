
export interface NavItem {
  label: string;
  path: string;
}

export interface SocialLink {
  name: string;
  url: string;
  icon: string;
  color: string;
}

export interface MapData {
  name: string;
  imageUrl: string;
  downloadUrl?: string; // If different from image
}

export interface DriveLink {
  name: string;
  url: string;
}

export interface Character {
  name: string;
  imageUrl: string;
  type?: 'Ativo' | 'Passivo'; // Inferred from sheet or UI
  ability?: string;
}

export interface Pet {
  name: string;
  imageUrl: string;
  ability?: string;
}

export interface LoadoutItem {
  name: string;
  imageUrl: string;
}

export interface SafeZone {
  mapName: string;
  safeNumber: string; // e.g. "Safe 1", "Safe 2"
  imageUrl: string;
}

export interface PlayerComposition {
  id: number;
  name: string;
  role: string; // Added role field
  photoUrl: string | null;
  pet: Pet | null;
  loadout: LoadoutItem | null;
  skills: (Character | null)[];
}

export interface VideoClass {
  id?: string;
  title: string;
  youtubeId: string;
  description?: string;
  category?: string;
  createdAt?: any;
}

export interface Resource {
  id?: string;
  name: string;
  imageUrl: string;
  category?: string;
  createdAt?: any;
}

export interface SiteUpdate {
  id: string;
  title: string;
  tag: 'NOVO' | 'MELHORIA' | 'DESTAQUE' | 'CORREÇÃO' | 'IMPORTANTE';
  version: string;
  date: string;
  description: string;
  details?: string[];
  iconName?: string;
  linkPath?: string;
  linkText?: string;
  featured?: boolean;
  author?: string;
  createdAt?: any;
}

export interface CoachChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface CoachNote {
  id: string;
  title: string;
  map: 'Bermuda' | 'Purgatório' | 'Kalahari' | 'Alpine' | 'Nova Terra' | 'Solara' | 'Geral';
  safeZone: string;
  category: string;
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  content: string;
  checklist?: CoachChecklistItem[];
  tags: string[];
  pinned?: boolean;
  color?: string;
  userId: string;
  authorName?: string;
  createdAt: number;
  updatedAt: number;
}

export type BrandThemePresetId = 
  | 'loud' 
  | 'furia' 
  | 'fluxo' 
  | 'pain' 
  | 'losgrandes' 
  | 'magicsquad' 
  | 'corinthians' 
  | 'vivokeyd' 
  | 'alpha7' 
  | 'liquid' 
  | 'blackdragons' 
  | 'cyber' 
  | 'minimal_light'
  | 'minimal_dark' 
  | 'custom';

export interface BrandColorPalette {
  primary: string;        // Hex, e.g. #00ff66
  secondary: string;      // Hex, e.g. #00cc52
  accent: string;         // Hex, e.g. #00ff88
  background: string;     // Hex, e.g. #0d1117
  cardBackground: string; // Hex, e.g. #161b22
  textContrast: string;   // Hex, e.g. #ffffff
  mutedText: string;      // Hex, e.g. #9ca3af
  border: string;         // Hex, e.g. rgba(255,255,255,0.1)
}

export interface BrandThemePreset {
  id: BrandThemePresetId;
  name: string;
  teamTag: string;
  colors: BrandColorPalette;
  logoUrl?: string;
  isDark: boolean;
}

export interface TeamLogoItem {
  id: string;
  name: string;
  imageUrl: string;
  category: 'LBFF & Pro League' | 'FFWS Mundial' | 'Emulador & Guildas' | 'Meus Logos' | 'Outros';
  isCustom?: boolean;
  isFavorite?: boolean;
  createdAt?: number;
}

export type PDFClassification = 'CONFIDENCIAL' | 'USO INTERNO' | 'DIRETORIA' | 'PÚBLICO' | 'CUSTOMIZADO';
export type PDFLayoutStyle = 'executive_dark' | 'corporate_light' | 'sponsor_grid';

export interface PDFBrandingSettings {
  layoutStyle: PDFLayoutStyle;
  classification: PDFClassification;
  customClassificationText?: string;
  showWatermark: boolean;
  watermarkText: string;
  watermarkOpacity: number;
  showCoachSignature: boolean;
  coachTitle: string;
  coachLicenseOrId?: string;
  showSponsorFooter: boolean;
  organizationTagline: string;
  sponsorName?: string;
  sponsorLogoUrl?: string;
  includeQrCode?: boolean;
}

export interface GlobalBrandProfile {
  teamName: string;
  teamTagline: string;
  activeLogoUrl: string | null;
  selectedPresetId: BrandThemePresetId;
  colors: BrandColorPalette;
  pdfBranding: PDFBrandingSettings;
}

