
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
  activeChar: Character | null;
  pet: Pet | null;
  loadout: LoadoutItem | null;
  passiveChars: (Character | null)[];
}
