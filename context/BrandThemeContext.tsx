import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  GlobalBrandProfile, 
  BrandThemePresetId, 
  BrandColorPalette, 
  TeamLogoItem, 
  PDFBrandingSettings,
  BrandThemePreset
} from '../types';
import { 
  DEFAULT_BRAND_PRESETS, 
  INITIAL_PRESET_LOGOS, 
  DEFAULT_GLOBAL_BRAND_PROFILE,
  DEFAULT_PDF_BRANDING 
} from '../constants/brandingConstants';
import { useAuth } from '../components/FirebaseProvider';
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';

const BRAND_PROFILE_STORAGE_KEY = 'jhan_global_brand_profile_v1';
const CUSTOM_LOGOS_STORAGE_KEY = 'jhan_custom_team_logos_v1';

interface BrandThemeContextType {
  brandProfile: GlobalBrandProfile;
  activePreset: BrandThemePreset;
  allLogos: TeamLogoItem[];
  customLogos: TeamLogoItem[];
  isColorManagerOpen: boolean;
  isLogoManagerOpen: boolean;
  openColorManager: () => void;
  closeColorManager: () => void;
  openLogoManager: () => void;
  closeLogoManager: () => void;
  setPreset: (presetId: BrandThemePresetId) => void;
  setCustomColors: (colors: Partial<BrandColorPalette>) => void;
  setTeamName: (name: string) => void;
  setTeamTagline: (tagline: string) => void;
  setActiveLogo: (logoUrl: string | null) => void;
  addCustomLogo: (logo: { name: string; imageUrl: string; category?: TeamLogoItem['category'] }) => Promise<TeamLogoItem>;
  deleteCustomLogo: (id: string) => void;
  setPdfBranding: (settings: Partial<PDFBrandingSettings>) => void;
  resetToDefaultBrand: () => void;
  autoDetectBrandFromTeam: (teamName: string) => void;
}

const BrandThemeContext = createContext<BrandThemeContextType | undefined>(undefined);

export const BrandThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Modals state
  const [isColorManagerOpen, setIsColorManagerOpen] = useState(false);
  const [isLogoManagerOpen, setIsLogoManagerOpen] = useState(false);

  // Custom logos state (stored locally + synced)
  const [customLogos, setCustomLogos] = useState<TeamLogoItem[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_LOGOS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Dynamic logos from Firestore 'teamLogos' collection (same as Logos de Times page)
  const [firestoreLogos, setFirestoreLogos] = useState<TeamLogoItem[]>([]);

  // Global brand profile state
  const [brandProfile, setBrandProfile] = useState<GlobalBrandProfile>(() => {
    try {
      const saved = localStorage.getItem(BRAND_PROFILE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        
        let teamName = parsed.teamName;
        if (!teamName || teamName.toLowerCase().includes('fluxo') || teamName === 'EQUIPE ESPORTS') {
          teamName = 'LOUD';
        }

        let activeLogoUrl = parsed.activeLogoUrl;
        if (activeLogoUrl && activeLogoUrl.includes('fluxo')) {
          activeLogoUrl = DEFAULT_GLOBAL_BRAND_PROFILE.activeLogoUrl;
        }

        let selectedPresetId = parsed.selectedPresetId;
        if (!selectedPresetId || selectedPresetId === 'fluxo') {
          selectedPresetId = 'loud';
        }

        return {
          ...DEFAULT_GLOBAL_BRAND_PROFILE,
          ...parsed,
          teamName,
          activeLogoUrl,
          selectedPresetId,
          colors: {
            ...DEFAULT_GLOBAL_BRAND_PROFILE.colors,
            ...(parsed.colors || {})
          },
          pdfBranding: {
            ...DEFAULT_PDF_BRANDING,
            ...(parsed.pdfBranding || {})
          }
        };
      }
    } catch (e) {
      console.error('Error loading brand profile:', e);
    }
    return DEFAULT_GLOBAL_BRAND_PROFILE;
  });

  // Apply CSS custom properties dynamically to root element
  useEffect(() => {
    const root = document.documentElement;
    const { colors } = brandProfile;

    root.style.setProperty('--brand-primary', colors.primary);
    root.style.setProperty('--brand-secondary', colors.secondary);
    root.style.setProperty('--brand-accent', colors.accent);
    root.style.setProperty('--brand-bg', colors.background);
    root.style.setProperty('--brand-card', colors.cardBackground);
    root.style.setProperty('--brand-border', colors.border);
    root.style.setProperty('--brand-text', colors.textContrast);
    root.style.setProperty('--brand-muted', colors.mutedText);

    // Save to localStorage
    try {
      localStorage.setItem(BRAND_PROFILE_STORAGE_KEY, JSON.stringify(brandProfile));
    } catch (e) {
      console.error('Error saving brand profile:', e);
    }
  }, [brandProfile]);

  // Save custom logos to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_LOGOS_STORAGE_KEY, JSON.stringify(customLogos));
    } catch (e) {
      console.error('Error saving custom logos:', e);
    }
  }, [customLogos]);

  // Sync with Firestore if authenticated
  useEffect(() => {
    if (!user) return;

    const syncFromCloud = async () => {
      try {
        const brandRef = doc(db, 'userBranding', user.uid);
        const snapshot = await getDoc(brandRef);
        if (snapshot.exists()) {
          const cloudData = snapshot.data();
          if (cloudData.brandProfile) {
            setBrandProfile(prev => ({
              ...prev,
              ...cloudData.brandProfile,
              colors: {
                ...prev.colors,
                ...(cloudData.brandProfile.colors || {})
              }
            }));
          }
          if (Array.isArray(cloudData.customLogos)) {
            setCustomLogos(cloudData.customLogos);
          }
        }
      } catch (err) {
        console.warn('Cloud sync read skipped:', err);
      }
    };

    syncFromCloud();
  }, [user]);

  // Subscribe to 'teamLogos' collection in Firestore so team logos page items sync everywhere
  useEffect(() => {
    try {
      const q = query(collection(db, 'teamLogos'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || 'TIME',
            category: data.category || 'LBFF & Pro League',
            imageUrl: data.imageUrl,
            isCustom: false
          } as TeamLogoItem;
        });
        setFirestoreLogos(items);
      }, (err) => {
        console.warn('Firestore teamLogos listener error:', err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Error setting up teamLogos listener:', e);
    }
  }, []);

  // Persist to Cloud on changes (debounced/on action)
  const saveToCloud = useCallback(async (newProfile: GlobalBrandProfile, newLogos: TeamLogoItem[]) => {
    if (!user) return;
    try {
      const brandRef = doc(db, 'userBranding', user.uid);
      await setDoc(brandRef, {
        brandProfile: newProfile,
        customLogos: newLogos,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (err) {
      console.warn('Cloud sync write skipped:', err);
    }
  }, [user]);

  // Active preset lookup
  const activePreset = DEFAULT_BRAND_PRESETS.find(p => p.id === brandProfile.selectedPresetId) || DEFAULT_BRAND_PRESETS[0];

  // Combined logos: custom first + firestore + initial presets, deduplicated by URL or ID
  const allLogos: TeamLogoItem[] = React.useMemo(() => {
    const combined = [...customLogos, ...firestoreLogos, ...INITIAL_PRESET_LOGOS];
    const seen = new Set<string>();
    const result: TeamLogoItem[] = [];

    for (const item of combined) {
      if (!item.imageUrl) continue;
      const key = `${item.name.toLowerCase().trim()}_${item.imageUrl.trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    }
    return result;
  }, [customLogos, firestoreLogos]);

  // Actions
  const openColorManager = () => setIsColorManagerOpen(true);
  const closeColorManager = () => setIsColorManagerOpen(false);
  const openLogoManager = () => setIsLogoManagerOpen(true);
  const closeLogoManager = () => setIsLogoManagerOpen(false);

  const setPreset = (presetId: BrandThemePresetId) => {
    const preset = DEFAULT_BRAND_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    setBrandProfile(prev => {
      const updated: GlobalBrandProfile = {
        ...prev,
        selectedPresetId: presetId,
        teamName: prev.teamName === 'EQUIPE ESPORTS' || prev.teamName === 'LINEUP TREINO' ? preset.name : prev.teamName,
        activeLogoUrl: preset.logoUrl || prev.activeLogoUrl,
        colors: { ...preset.colors },
        pdfBranding: {
          ...prev.pdfBranding,
          watermarkText: `${preset.name.toUpperCase()} • PERFORMANCE & SCOUT`
        }
      };
      saveToCloud(updated, customLogos);
      return updated;
    });
  };

  const setCustomColors = (colors: Partial<BrandColorPalette>) => {
    setBrandProfile(prev => {
      const updated: GlobalBrandProfile = {
        ...prev,
        selectedPresetId: 'custom',
        colors: {
          ...prev.colors,
          ...colors
        }
      };
      saveToCloud(updated, customLogos);
      return updated;
    });
  };

  const setTeamName = (name: string) => {
    setBrandProfile(prev => {
      const updated: GlobalBrandProfile = { ...prev, teamName: name };
      saveToCloud(updated, customLogos);
      return updated;
    });
  };

  const setTeamTagline = (tagline: string) => {
    setBrandProfile(prev => {
      const updated: GlobalBrandProfile = { ...prev, teamTagline: tagline };
      saveToCloud(updated, customLogos);
      return updated;
    });
  };

  const setActiveLogo = (logoUrl: string | null) => {
    setBrandProfile(prev => {
      const updated: GlobalBrandProfile = { ...prev, activeLogoUrl: logoUrl };
      saveToCloud(updated, customLogos);
      return updated;
    });
  };

  const addCustomLogo = async (logo: { name: string; imageUrl: string; category?: TeamLogoItem['category'] }): Promise<TeamLogoItem> => {
    const newLogo: TeamLogoItem = {
      id: `custom-logo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: logo.name,
      imageUrl: logo.imageUrl,
      category: logo.category || 'Meus Logos',
      isCustom: true,
      isFavorite: true,
      createdAt: Date.now()
    };

    setCustomLogos(prev => {
      const updated = [newLogo, ...prev];
      saveToCloud(brandProfile, updated);
      return updated;
    });

    return newLogo;
  };

  const deleteCustomLogo = (id: string) => {
    setCustomLogos(prev => {
      const updated = prev.filter(l => l.id !== id);
      saveToCloud(brandProfile, updated);
      return updated;
    });

    if (brandProfile.activeLogoUrl?.includes(id)) {
      setActiveLogo(null);
    }
  };

  const setPdfBranding = (settings: Partial<PDFBrandingSettings>) => {
    setBrandProfile(prev => {
      const updated: GlobalBrandProfile = {
        ...prev,
        pdfBranding: {
          ...prev.pdfBranding,
          ...settings
        }
      };
      saveToCloud(updated, customLogos);
      return updated;
    });
  };

  const resetToDefaultBrand = () => {
    setBrandProfile(DEFAULT_GLOBAL_BRAND_PROFILE);
    saveToCloud(DEFAULT_GLOBAL_BRAND_PROFILE, customLogos);
  };

  const autoDetectBrandFromTeam = (teamName: string) => {
    const lower = teamName.toLowerCase().trim();
    let foundPreset: BrandThemePreset | undefined;

    if (lower.includes('loud') || lower.includes('noise')) {
      foundPreset = DEFAULT_BRAND_PRESETS.find(p => p.id === 'loud');
    } else if (lower.includes('furia')) {
      foundPreset = DEFAULT_BRAND_PRESETS.find(p => p.id === 'furia');
    } else if (lower.includes('fluxo') || lower.includes('crias')) {
      foundPreset = DEFAULT_BRAND_PRESETS.find(p => p.id === 'fluxo');
    } else if (lower.includes('pain') || lower.includes('faz o p')) {
      foundPreset = DEFAULT_BRAND_PRESETS.find(p => p.id === 'pain');
    } else if (lower.includes('los') || lower.includes('grandes') || lower.includes('onda')) {
      foundPreset = DEFAULT_BRAND_PRESETS.find(p => p.id === 'losgrandes');
    } else if (lower.includes('magic') || lower.includes('squad')) {
      foundPreset = DEFAULT_BRAND_PRESETS.find(p => p.id === 'magicsquad');
    } else if (lower.includes('corinthians') || lower.includes('sccp')) {
      foundPreset = DEFAULT_BRAND_PRESETS.find(p => p.id === 'corinthians');
    } else if (lower.includes('keyd') || lower.includes('vivo')) {
      foundPreset = DEFAULT_BRAND_PRESETS.find(p => p.id === 'vivokeyd');
    } else if (lower.includes('alpha7') || lower.includes('a7')) {
      foundPreset = DEFAULT_BRAND_PRESETS.find(p => p.id === 'alpha7');
    } else if (lower.includes('liquid')) {
      foundPreset = DEFAULT_BRAND_PRESETS.find(p => p.id === 'liquid');
    } else if (lower.includes('black dragons') || lower.includes('bd')) {
      foundPreset = DEFAULT_BRAND_PRESETS.find(p => p.id === 'blackdragons');
    }

    if (foundPreset) {
      setPreset(foundPreset.id);
    }
  };

  return (
    <BrandThemeContext.Provider value={{
      brandProfile,
      activePreset,
      allLogos,
      customLogos,
      isColorManagerOpen,
      isLogoManagerOpen,
      openColorManager,
      closeColorManager,
      openLogoManager,
      closeLogoManager,
      setPreset,
      setCustomColors,
      setTeamName,
      setTeamTagline,
      setActiveLogo,
      addCustomLogo,
      deleteCustomLogo,
      setPdfBranding,
      resetToDefaultBrand,
      autoDetectBrandFromTeam
    }}>
      {children}
    </BrandThemeContext.Provider>
  );
};

export const useBrandTheme = () => {
  const context = useContext(BrandThemeContext);
  if (!context) {
    throw new Error('useBrandTheme must be used within a BrandThemeProvider');
  }
  return context;
};
