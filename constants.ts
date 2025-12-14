
import { NavItem, SocialLink, MapData, DriveLink, Character } from './types';

export const APP_LOGO = "https://i.ibb.co/mCS1fCxY/Whats-App-Image-2025-10-26-at-08-14-03.jpg";
export const BIBLE_VERSE = "“Não a nós, Senhor, mas ao teu nome dá glória”";
export const BIBLE_REF = "Salmo 115:1";

// Keys for translation reference
export const NAV_ITEMS_KEYS = [
  { key: 'home', path: '/' },
  { key: 'game', path: '/jogo' }, // New consolidated item
  { key: 'downloads', path: '/downloads' },
  { key: 'about', path: '/sobre' },
];

// Fallback for simple usage if needed
export const NAV_ITEMS: NavItem[] = [
  { label: 'Início', path: '/' },
  { label: 'Jogo', path: '/jogo' },
  { label: 'Downloads', path: '/downloads' },
  { label: 'Sobre', path: '/sobre' },
];

export const SOCIAL_LINKS: SocialLink[] = [
  { name: 'Youtube', url: 'https://www.youtube.com/@jhanmedeiros', icon: 'Youtube', color: 'hover:text-red-600' },
  { name: 'Instagram', url: 'https://www.instagram.com/jhanmedeiros/', icon: 'Instagram', color: 'hover:text-pink-600' },
  { name: 'Discord', url: 'https://discord.gg/YU8uTRyz2Y', icon: 'Discord', color: 'hover:text-indigo-500' },
  { name: 'X', url: 'https://x.com/Jansey_Medeiros', icon: 'X', color: 'hover:text-black dark:hover:text-white' },
];

export const MAPS_DATA: MapData[] = [
  { name: 'BERMUDA', imageUrl: 'https://i.ibb.co/jhF5L3h/BERMUDA-NOVA-PEAK.png' },
  { name: 'KALAHARI', imageUrl: 'https://i.ibb.co/yPNSdhT/Kalahari.jpg' },
  { name: 'PURGATÓRIO', imageUrl: 'https://i.ibb.co/rsyFkch/Purgat-rio.jpg' },
  { name: 'SOLARA', imageUrl: 'https://fir3.net/SOLARACOMNOMES' }, 
  { name: 'NOVA TERRA', imageUrl: 'https://i.ibb.co/4TrbgG7/NOVA-TERRA-OB43.jpg' },
  { name: 'ALPINE', imageUrl: 'https://i.ibb.co/k4x6Qm0/Alpine.jpg' },
];

// Premium Training Map Images (Clean versions for drag & drop)
export const TRAINING_MAP_IMAGES: Record<string, string> = {
  'Bermuda': 'https://i.ibb.co/zVZRhrzW/BERMUDA.jpg',
  'Purgatório': 'https://i.ibb.co/JR6RxXdZ/PURGAT-RIO.jpg',
  'Alpine': 'https://i.ibb.co/M5SKjzyg/ALPINE.jpg',
  'Nova Terra': 'https://i.ibb.co/bgrHzY8R/NOVA-TERRA.jpg',
  'Kalahari': 'https://i.ibb.co/Mxtfgvm0/KALAHARI.jpg',
  'Solara': 'https://i.ibb.co/nMzg9Qbs/SOLARA.jpg'
};

// Exact links required for Mapping Page
export const MAPPING_MAPS: Record<string, string> = {
  'Purgatório': 'https://i.ibb.co/JR6RxXdZ/PURGAT-RIO.jpg',
  'Solara': 'https://i.ibb.co/nMzg9Qbs/SOLARA.jpg',
  'Nova Terra': 'https://i.ibb.co/bgrHzY8R/NOVA-TERRA.jpg',
  'Kalahari': 'https://i.ibb.co/Mxtfgvm0/KALAHARI.jpg',
  'Bermuda': 'https://i.ibb.co/zVZRhrzW/BERMUDA.jpg',
  'Alpine': 'https://i.ibb.co/M5SKjzyg/ALPINE.jpg'
};

export const TRAINING_RULES = [
  "⚠️ ATENÇÃO COM AS REGRAS",
  "TROCACÃO LIBERADA NA 1A SAFE APARECER, SEM RUSHS DESNECESSÁRIOS",
  "DEIXEM TODOS OS MAPAS JÁ PRONTOS",
  "TROCACÃO LIBERADA NA 2A SAFE",
  "TROCACÃO LIBERADA NA 3A SAFE",
  "PROIBIDO X1 INICIAL",
  "CAIAM SOMENTE EM SUAS CALLS",
  "EVITEM RUSHS DESNECESSÁRIOS"
];

export const MAP_LOCATIONS: Record<string, string[]> = {
  'Bermuda': ['RIM', 'PEAK', 'SENTOSA', 'CLOCK', 'BIMA', 'CAPE', 'SHIP', 'KATU', 'MILL', 'MARS', 'HANGAR', 'GRAVE', 'OBS', 'POCHI', 'PFM', 'FACTORY', 'REPRESA'],
  'Purgatório': ['LUMBER', 'FIELDS', 'ILHA', 'CENTRAL', 'BR CIMA', 'QUARRY', 'MARBLE', 'CROSS', 'FORGE', 'SKI', 'FIRE', 'MT VILA', 'GOLF', 'CAMPSITE', 'BR BAIXO', 'MTGQ'],
  'Alpine': ['FOZ', 'VANTAGEM', 'ESTAÇÃO', 'NEVADO', 'GUARNIÇÃO', 'DOCAS', 'COLONIA', 'F VERMELHA', 'VILAREJO', 'LIBERDADE', 'QUARTEL', 'FERROVIARIA', 'LITORAL', 'CARROSSEL', 'USINA'],
  'Nova Terra': ['PONTES GÊMEAS', 'ACD DE BOXE', 'UNIVERSIDADE', 'MANGUEZAL', 'GALERIA DECA', 'PARQUE', 'TIROLESA', 'CIDADE VELHA', 'MUSEU', 'FAZENDINHA', 'FEIRA PLAZA', 'VIADUTO', 'PLANETARIO', 'ROBO'],
  'Kalahari': ['PLAYGROUND', 'PRISÃO', 'SANTUÁRIO', 'RUINAS', 'P SEGURO', 'REFINARIA', 'LABIRINTO', 'P COMANDO', 'ASSENTAMENTO', 'SUBMARINO', 'CAMARA', 'C ELEFANTES', 'P BAU'],
  'Solara': ['ENSEADA', 'TORRE DE TV', 'PISCINÃO', 'MOINHO', 'ROLIUDE', 'LABORATORIO', 'ARCO', 'RESORT', 'CACHOEIRA', 'FLORESOPOLIS', 'AQUARIO', 'PARQUE', 'CLUBE DA CELA']
};

export const AERIAL_LINKS: DriveLink[] = [
  { name: 'Bermuda', url: 'https://drive.google.com/drive/folders/19N5hSofqFVCGDiHEU_wKmtVmHW1a1UfJ' },
  { name: 'Purgatório', url: 'https://drive.google.com/drive/folders/1yDGP-7iCCBa4S63mik-MFVOGOebCogdB?usp=sharing' },
  { name: 'Kalahari', url: 'https://drive.google.com/drive/folders/16UUsxWUhWxmHfL-2X46wc4yfmo_A_f-u?usp=sharing' },
  { name: 'Alpine', url: 'https://drive.google.com/drive/folders/15btlRqv-5LvdMHTyG6HQERbUdWRwWtOS?usp=sharing' },
  { name: 'Nova Terra', url: 'https://drive.google.com/drive/u/1/folders/103a5Zw2n-nUZiXkAjfUGeGKfhSNMPVAx' },
  { name: 'Solara Pasta', url: 'https://fir3.net/solarapasta' },
  { name: 'Solara Zip', url: 'https://fir3.net/solarazip' },
];

export const EXTRA_CHARACTERS: Character[] = [
  {
    name: 'Nero',
    imageUrl: 'https://i.ibb.co/9HSp4GsC/NERO.png',
    type: 'Ativo',
    ability: 'Habilidade Especial'
  }
];

export const LOADOUTS_DATA = [
  { name: 'SUPER MOCHILA DE PERNA', imageUrl: 'https://i.ibb.co/6RVvsxFb/SUPER-MOCHILA-DE-PERNA.png' },
  { name: 'LOJA TÁTICA', imageUrl: 'https://i.ibb.co/wV7Sp5G/LOJA-TATICA.png' },
  { name: 'BÔNUS DE EQUIPE', imageUrl: 'https://i.ibb.co/0RYb6MsC/BE.png' },
  { name: 'MARTELO DE REFORÇO', imageUrl: 'https://i.ibb.co/TMqT2SYy/MARTELO.png' },
];

export const SHEETS = {
  PETS: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTlLgHrmm-CtAzyLyV2q8LGg8ukxqfxHv7ZSKz2kN0UUHvtS8GWS1ecQjGqJaGDdC66X1vdY-0elkQB/pub?output=csv',
  CHARACTERS: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQAOlpDQSpX79En0qb-tnZOsT-KfGdv_Ay4xFhSFufM5VpGCfu_AeNCaPextHRTGznfZE_1YkpzvT2-/pub?output=csv',
  SAFES: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3pTmPhxm_Yu7UGJhvK6gjZ5kyi_rF1Py_458T5BfkKS7ivvPWexc9BNPtuQbWDvKYLmkkE_dwfHCl/pub?output=csv'
};
