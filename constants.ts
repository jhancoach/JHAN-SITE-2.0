
import { NavItem, SocialLink, MapData, DriveLink, Character, SiteUpdate } from './types';

export const APP_LOGO = "https://i.ibb.co/mCS1fCxY/Whats-App-Image-2025-10-26-at-08-14-03.jpg";
export const BIBLE_VERSE = "“Não a nós, Senhor, mas ao teu nome dá glória”";
export const BIBLE_REF = "Salmo 115:1";

// Keys for translation reference
export const NAV_ITEMS_KEYS = [
  { key: 'home', path: '/' },
  { key: 'game', path: '/jogo' }, 
  { key: 'news', path: '/novidades' },
  { key: 'classes', path: '/sala-de-aula' },
  { key: 'bracket', path: '/criar-chaveamento' },
  { key: 'tactical_board', path: '/quadro-tatico' },
  { key: 'downloads', path: '/downloads' },
  { key: 'about', path: '/sobre' },
];

// Fallback for simple usage if needed
export const NAV_ITEMS: NavItem[] = [
  { label: 'Início', path: '/' },
  { label: 'Jogo', path: '/jogo' },
  { label: 'Novidades', path: '/novidades' },
  { label: 'Chaveamento', path: '/criar-chaveamento' },
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
  { name: 'PURGATÓRIO', imageUrl: 'https://i.ibb.co/Y7fRQt35/PUR.jpg' },
  { name: 'SOLARA', imageUrl: 'https://i.ibb.co/v49PHbWd/SOLARA.jpg' }, 
  { name: 'NOVA TERRA', imageUrl: 'https://i.ibb.co/4TrbgG7/NOVA-TERRA-OB43.jpg' },
  { name: 'ALPINE', imageUrl: 'https://i.ibb.co/k4x6Qm0/Alpine.jpg' },
];

export const MAPS_PINGOS_DATA = [
  { name: 'BERMUDA', imageUrl: 'https://i.ibb.co/PZSN2gDg/BERMUDA-PINGOS.jpg' },
  { name: 'KALAHARI', imageUrl: 'https://i.ibb.co/SZ2qWM5/KALAHARI-PINGOS.jpg' },
  { name: 'NOVA TERRA', imageUrl: 'https://i.ibb.co/0pf20QM1/NOVA-TERRA-PINGOS.jpg' },
  { name: 'PURGATÓRIO', imageUrl: 'https://i.ibb.co/skvX2rM/PURGAT-RIO-PINGOS.jpg' },
  { name: 'SOLARA', imageUrl: 'https://i.ibb.co/DHYBSyCg/SOLARA-PINGOS.jpg' },
  { name: 'ALPINE', imageUrl: 'https://i.ibb.co/przGgXZW/ALPINE-PINGOS.jpg' },
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
  { name: 'Solara Pasta', url: 'https://drive.google.com/drive/folders/1rNnUaJP-Y0sywsdwLdbFF4ssDVr8Pbo2?usp=sharing' },
  { name: 'Solara Zip', url: 'https://fir3.net/solarazip' },
];

export const EXTRA_CHARACTERS: Character[] = [
  {
    name: 'Nero',
    imageUrl: 'https://i.ibb.co/9HSp4GsC/NERO.png',
    type: 'Ativo',
    ability: 'Habilidade Especial'
  },
  {
    name: 'Morse',
    imageUrl: 'https://i.ibb.co/vxyycXym/morse.png',
    type: 'Ativo',
    ability: 'Habilidade Especial'
  },
  {
    name: 'Ray',
    imageUrl: 'https://i.ibb.co/M55pwhqr/image.png',
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

export const RECURSOS_DATA = [
  { name: 'CALENDÁRIO COMPROMISSOS', imageUrl: 'https://i.ibb.co/rR6W5Sg/calendario.png' },
  { name: 'PLANILHA DE SCOUT MOB', imageUrl: 'https://i.ibb.co/Y7fRQt35/PUR.jpg' },
  { name: 'PLANILHA DE SCOUT EMULADOR', imageUrl: 'https://i.ibb.co/v49PHbWd/SOLARA.jpg' },
  { name: 'MODELO DE RELATÓRIO PDF', imageUrl: 'https://i.ibb.co/k4x6Qm0/Alpine.jpg' },
  { name: 'PACK DE LOGOS PNG', imageUrl: 'https://i.ibb.co/0RYb6MsC/BE.png' },
  { name: 'BANNER TEMPLATE PSD', imageUrl: 'https://i.ibb.co/TMqT2SYy/MARTELO.png' },
  { name: 'TABELA DE PONTUAÇÃO LBFF', imageUrl: 'https://i.ibb.co/wV7Sp5G/LOJA-TATICA.png' },
  { name: 'OVERLAY STREAM TÁTICO', imageUrl: 'https://i.ibb.co/6RVvsxFb/SUPER-MOCHILA-DE-PERNA.png' },
  { name: 'MINIATURA YOUTUBE EDITÁVEL', imageUrl: 'https://i.ibb.co/mCS1fCxY/Whats-App-Image-2025-10-26-at-08-14-03.jpg' },
  { name: 'MAPAS COMPETITIVOS 4K', imageUrl: 'https://i.ibb.co/jhF5L3h/BERMUDA-NOVA-PEAK.png' },
  { name: 'FUNDO DE TELA TÁTICO', imageUrl: 'https://i.ibb.co/JR6RxXdZ/PURGAT-RIO.jpg' },
  { name: 'GUIA DE CALLS BERMUDA', imageUrl: 'https://i.ibb.co/zVZRhrzW/BERMUDA.jpg' },
  { name: 'GUIA DE CALLS PURGATÓRIO', imageUrl: 'https://i.ibb.co/JR6RxXdZ/PURGAT-RIO.jpg' },
  { name: 'GUIA DE CALLS SOLARA', imageUrl: 'https://i.ibb.co/nMzg9Qbs/SOLARA.jpg' },
  { name: 'MODELO DE CONTRATO BASE', imageUrl: 'https://i.ibb.co/v49PHbWd/SOLARA.jpg' },
];

export const SHEETS = {
  PETS: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTlLgHrmm-CtAzyLyV2q8LGg8ukxqfxHv7ZSKz2kN0UUHvtS8GWS1ecQjGqJaGDdC66X1vdY-0elkQB/pub?output=csv',
  CHARACTERS: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQAOlpDQSpX79En0qb-tnZOsT-KfGdv_Ay4xFhSFufM5VpGCfu_AeNCaPextHRTGznfZE_1YkpzvT2-/pub?output=csv',
  SAFES: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3pTmPhxm_Yu7UGJhvK6gjZ5kyi_rF1Py_458T5BfkKS7ivvPWexc9BNPtuQbWDvKYLmkkE_dwfHCl/pub?output=csv'
};

export const SITE_UPDATES_DATA: SiteUpdate[] = [
  {
    id: 'upd-coach-notebook-cloud',
    title: 'Caderno Tático do Coach: Anotações por Mapa & Safe Salvas na Nuvem',
    tag: 'DESTAQUE',
    version: 'v2.9.0',
    date: '31/08/2026',
    description: 'Central de estratégias e anotações para o técnico e IGL, com sincronização em tempo real via login Google no Firestore.',
    details: [
      'Organização por Mapa (Bermuda, Purgatório, Kalahari, Alpine, Nova Terra, Solara) e Fase da Safe (Drop, Safe 1-4, Endgame).',
      'Checklist de execução tática interativo direto no card da anotação com contador de progresso.',
      'Modelos rápidos prontos para treino (Split de Drop, Hold de Casa Forte, Análise de Rival e Rush Final).',
      'Cópia com 1-clique formatada com emojis para canais do Discord e WhatsApp.',
      'Sincronização na nuvem com Firestore e modo offline com persistência local instantânea.'
    ],
    iconName: 'BookOpen',
    linkPath: '/caderno-coach',
    linkText: 'Abrir Caderno Tático',
    featured: true,
    author: 'Jhan Medeiros'
  },
  {
    id: 'upd-ocr-guide-2026',
    title: 'Scanner de Prints do Free Fire com Guia Oficial & IA Aprimorada',
    tag: 'NOVO',
    version: 'v2.8.0',
    date: '24/08/2026',
    description: 'Novo sistema visual de conferência e leitura OCR automática de tabelas de pontuação do Free Fire pós-partida.',
    details: [
      'Guia interativo com réplica 1:1 pixel-perfect da tela de resultados do Free Fire (Solara, Booyah 3, squad completo).',
      'Detecção e leitura automática de Pontuação, Apelido/Nick, Kills (K), Assistências (A), Dano (DMG), Ressurgimentos e Tempo.',
      'Suporte para carregar foto do próprio celular diretamente no guia de exemplo com ampliação e modo tela cheia.',
      'Exportação instantânea dos dados extraídos para o gerador de relatórios e estatísticas da equipe.'
    ],
    iconName: 'ScanLine',
    linkPath: '/jogo',
    linkText: 'Experimentar Leitor de Prints',
    featured: true,
    author: 'Jhan Medeiros'
  },
  {
    id: 'upd-tactical-board-solara',
    title: 'Quadro Tático 2.0 com Mapa Solara & Ferramentas Avançadas',
    tag: 'NOVO',
    version: 'v2.7.0',
    date: '18/08/2026',
    description: 'Atualização completa do Quadro Tático Competitivo de Free Fire com os 6 mapas oficiais atualizados.',
    details: [
      'Inclusão do novo mapa competitivo Solara em alta resolução 4K.',
      'Ferramentas de desenho livre, setas táticas, círculos de Safe Zone dinâmicos e marcação de rotação.',
      'Biblioteca de ícones de jogadores, droppings de pings, veículos e caixas de suprimentos.',
      'Exportação de prancheta em PNG de alta definição para apresentar em reuniões táticas.'
    ],
    iconName: 'LayoutGrid',
    linkPath: '/quadro-tatico',
    linkText: 'Abrir Quadro Tático',
    featured: true,
    author: 'Jhan Medeiros'
  },
  {
    id: 'upd-bracket-creator-lbff',
    title: 'Criador de Chaveamento & Torneios LBFF com Logos Automáticos',
    tag: 'NOVO',
    version: 'v2.6.0',
    date: '10/08/2026',
    description: 'Monte chaveamentos profissionais eliminatórios e grupos de torneios com logos oficiais de organizações.',
    details: [
      'Suporte a múltiplos formatos: 8, 12, 16, 24 ou 48 equipes com chave winners e losers.',
      'Seleção facilitada de logos de times consagrados (LOUD, FURIA, paiN, Vivo Keyd, etc.).',
      'Exportação em imagem para transmissão (Overlay Stream) e redes sociais.',
      'Calculadora de pontuação oficial LBFF automática por tabela.'
    ],
    iconName: 'Trophy',
    linkPath: '/criar-chaveamento',
    linkText: 'Criar Chaveamento',
    featured: false,
    author: 'Jhan Medeiros'
  },
  {
    id: 'upd-classroom-analysts',
    title: 'Sala de Aula Pro: Masterclasses de Análise e Posicionamento',
    tag: 'MELHORIA',
    version: 'v2.5.0',
    date: '02/08/2026',
    description: 'Nova seção de vídeo-aulas exclusivas com análises profundas de quedas, scouts e macro-game.',
    details: [
      'Categorização por Nível: Básico, Intermediário, Avançado e Análise Profissional.',
      'Painel de administração para adicionar novas aulas do YouTube com miniaturas e descrições.',
      'Filtro por mapas e tópicos (Drop, Rotação, Fechamento de Safe, Granadas táticas).',
      'Área de comentários e anotações para estudantes da metodologia.'
    ],
    iconName: 'GraduationCap',
    linkPath: '/sala-de-aula',
    linkText: 'Acessar Sala de Aula',
    featured: false,
    author: 'Jhan Medeiros'
  },
  {
    id: 'upd-custom-line-squad',
    title: 'Montador de Squad & Construtor de Linhas Personalizadas',
    tag: 'MELHORIA',
    version: 'v2.4.0',
    date: '25/07/2026',
    description: 'Crie composições de jogadores personalizadas combinando habilidades ativas, passivas, pets e loadouts.',
    details: [
      'Adição dos personagens mais recentes e habilidades atualizadas do meta competitivo.',
      'Definição de funções: Capitão/IGL, Rusher 1, Rusher 2 e Suporte/Granadeiro.',
      'Cards visuais estilizados para postar em Instagram Stories e canais de comunicação.',
      'Armazenamento na nuvem sincronizado em tempo real.'
    ],
    iconName: 'Users',
    linkPath: '/jogo',
    linkText: 'Montar Composição',
    featured: false,
    author: 'Jhan Medeiros'
  },
  {
    id: 'upd-downloads-scout-pack',
    title: 'Hub de Recursos: Planilhas de Scout, Logos PNG e Mapas 4K',
    tag: 'IMPORTANTE',
    version: 'v2.3.0',
    date: '15/07/2026',
    description: 'Centralização de todos os arquivos, overlays de stream e planilhas indispensáveis para analistas e técnicos.',
    details: [
      'Download direto de pastas do Google Drive com fotos aéreas de alta resolução de todos os mapas.',
      'Modelos editáveis de relatório pós-jogo em PDF e planilhas automatizadas de scout.',
      'Pack de logos transparentes em PNG de times emuladores e móbile.',
      'Guias de calls e regras oficiais para salas de treino.'
    ],
    iconName: 'Download',
    linkPath: '/downloads',
    linkText: 'Ver Recursos Disponíveis',
    featured: false,
    author: 'Jhan Medeiros'
  }
];

