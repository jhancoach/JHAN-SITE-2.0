export interface MetaPlayerBuild {
  roleName: string;
  activeSkill: string;
  passiveSkills: string[];
  pet: string;
  loadout: string;
  tacticalTip: string;
}

export interface MetaComposition {
  id: string;
  name: string;
  tier: 'TIER S+' | 'TIER S' | 'TIER A+';
  badge: string;
  focus: string;
  description: string;
  synergyScore: number;
  mode: string;
  keyActiveSkill: string;
  coreSkills: string[];
  petRecommendation: string;
  loadoutRecommendation: string;
  strengths: string[];
  weaknesses: string[];
  squadBuild: MetaPlayerBuild[];
}

export const META_COMPOSITIONS: MetaComposition[] = [
  {
    id: 'meta-morse-furtivo',
    name: 'Infiltração Furtiva & Mira Oculta (Meta Morse 2026)',
    tier: 'TIER S+',
    badge: 'NOVO META GARENA',
    focus: 'Infiltração, Anulação de Detecção e Mira Automática Curta',
    description: 'Aproveita ao máximo o novo personagem Morse. A habilidade Código Furtivo quebra radares, concede 20% de velocidade e assistência de mira automática em 4m, combinada com Moco para marcação, Maro para dano aumentado e Laura para precisão.',
    synergyScore: 98,
    mode: 'Campeonatos / LBFF & BR',
    keyActiveSkill: 'Morse',
    coreSkills: ['Morse', 'Moco', 'Laura', 'Maro'],
    petRecommendation: 'Cascavel (Mantis) ou Dom Pisante',
    loadoutRecommendation: 'Super Mochila de Perna',
    strengths: [
      'Indetectável a mais de 16m com +20% de velocidade de aproximação',
      'Assistência de mira automática mortal dentro de 4 metros',
      'Excelente contra marcações de longa distância e camperagem em construções'
    ],
    weaknesses: [
      'Não pode disparar durante os segundos do Modo Furtivo ativo',
      'Atraso de 1 segundo ao sair do modo furtivo'
    ],
    squadBuild: [
      {
        roleName: 'Rusher Flanker (Infiltrador)',
        activeSkill: 'Morse',
        passiveSkills: ['Kelly', 'Moco', 'Hayato'],
        pet: 'Dom Pisante',
        loadout: 'Super Mochila de Perna',
        tacticalTip: 'Ative o modo furtivo para rodear o squad inimigo e pegar o suporte de costas.'
      },
      {
        roleName: 'IGL / Capitão (Entrada)',
        activeSkill: 'Tatsuya',
        passiveSkills: ['Sonia', 'J.Biebs', 'Antonio'],
        pet: 'Punkin',
        loadout: 'Loja Tática',
        tacticalTip: 'Abra espaço com os dois dashes rápidos do Tatsuya logo após a infiltração do Morse.'
      },
      {
        roleName: 'Rusher 2 (Finalizador)',
        activeSkill: 'Orion',
        passiveSkills: ['Miguel', 'Ford', 'Kelly'],
        pet: 'Arakuda',
        loadout: 'Bônus de Equipe',
        tacticalTip: 'Use a Onda Escarlate para limpar inimigos que foram marcados pelo Morse.'
      },
      {
        roleName: 'Suporte / Sniper',
        activeSkill: 'Homero',
        passiveSkills: ['Maro', 'Laura', 'Rafael'],
        pet: 'Brabuíno',
        loadout: 'Super Mochila de Perna',
        tacticalTip: 'Dê suporte a média e longa distância com Maro + Rafael silenciado.'
      }
    ]
  },
  {
    id: 'meta-rush-tatsuya-sonia',
    name: 'Rush Agressivo & Sobrevivência Blindada',
    tier: 'TIER S+',
    badge: 'DOMINANTE NO COMPETITIVO',
    focus: 'Mobilidade Extrema, Absorção de Dano e Trocação Curta',
    description: 'A formação mais utilizada pelos principais times da LBFF e mundiais. Baseada no duplo avanço instantâneo do Tatsuya combinado com a Nanoproteção da Sonia para vencer qualquer trocação 1v1.',
    synergyScore: 99,
    mode: 'Todos os Modos (LBFF, 4x4 e BR)',
    keyActiveSkill: 'Tatsuya',
    coreSkills: ['Tatsuya', 'Sonia', 'J.Biebs', 'Kelly'],
    petRecommendation: 'Punkin (Redução de Recarga)',
    loadoutRecommendation: 'Super Mochila de Perna',
    strengths: [
      'Dashes instantâneos para desviar de tiros e quebrar miras inimigas',
      'Sonia garante sobrevida para derrubar o oponente antes de cair',
      'Velocidade e reposicionamento contínuo'
    ],
    weaknesses: [
      'Depende de boa pontaria nos primeiros segundos de contato',
      'Vulnerável a granadas de área com atraso'
    ],
    squadBuild: [
      {
        roleName: 'Rusher 1 (Ponta de Lança)',
        activeSkill: 'Tatsuya',
        passiveSkills: ['Sonia', 'Kelly', 'Hayato'],
        pet: 'Punkin',
        loadout: 'Super Mochila de Perna',
        tacticalTip: 'Puxe o primeiro dash em zigue-zague para forçar o inimigo a errar o primeiro tiro.'
      },
      {
        roleName: 'Rusher 2 (Cover Imediato)',
        activeSkill: 'Tatsuya',
        passiveSkills: ['Sonia', 'J.Biebs', 'Luna'],
        pet: 'Punkin',
        loadout: 'Loja Tática',
        tacticalTip: 'Entre logo atrás do Rusher 1 para finalizar alvos enfraquecidos.'
      },
      {
        roleName: 'IGL / Capitão',
        activeSkill: 'Homero',
        passiveSkills: ['Moco', 'Nairi', 'Antonio'],
        pet: 'Dom Pisante',
        loadout: 'Bônus de Equipe',
        tacticalTip: 'Solte o drone do Homero antes do rush para desacelerar e cegar o squad inimigo.'
      },
      {
        roleName: 'Suporte / Médico',
        activeSkill: 'Dimitri',
        passiveSkills: ['Thiva', 'Olivia', 'Kapella'],
        pet: 'Barão Turbo',
        loadout: 'Super Mochila de Perna',
        tacticalTip: 'Mantenha a zona de reviver pronta para quando os rushers sofrerem dano.'
      }
    ]
  },
  {
    id: 'meta-dimitri-thiva-resgate',
    name: 'Hospital de Batalha: Ressurreição Instantânea',
    tier: 'TIER S+',
    badge: 'META RESGATE IMORTAL',
    focus: 'Cura em Área, Auto-Revive e Levantar em 1 Segundo',
    description: 'A clássica formação imortal que virou lenda nos campeonatos oficiais. Com Dimitri e Thiva em sincronia, qualquer jogador derrubado levanta em apenas 1 segundo com HP extra fornecido por Olivia.',
    synergyScore: 97,
    mode: 'Competitivo & Ranqueada Squad',
    keyActiveSkill: 'Dimitri',
    coreSkills: ['Dimitri', 'Thiva', 'Sonia', 'Olivia'],
    petRecommendation: 'Barão Turbo ou Lontreta',
    loadoutRecommendation: 'Loja Tática / Fichas',
    strengths: [
      'Levanta aliados caídos em menos de 1 segundo',
      'Aliados levantados ganham até 80 de HP imediato graças a Olivia',
      'Permite jogar em posições de alto risco sem medo de perda definitiva'
    ],
    weaknesses: [
      'Menor poder de avanço rápido em campo aberto',
      'Vulnerável a granadas em grupo se ficarem muito colados'
    ],
    squadBuild: [
      {
        roleName: 'Suporte Central (Médico)',
        activeSkill: 'Dimitri',
        passiveSkills: ['Thiva', 'Olivia', 'Kapella'],
        pet: 'Barão Turbo',
        loadout: 'Super Mochila de Perna',
        tacticalTip: 'Abra a aura do Dimitri no momento que um aliado entrar em combate intenso.'
      },
      {
        roleName: 'Segundo Suporte / IGL',
        activeSkill: 'Dimitri',
        passiveSkills: ['Thiva', 'Nairi', 'Moco'],
        pet: 'Dom Pisante',
        loadout: 'Loja Tática',
        tacticalTip: 'Reforce o gel com Nairi para criar uma enfermaria segura e inquebrável.'
      },
      {
        roleName: 'Rusher 1',
        activeSkill: 'Tatsuya',
        passiveSkills: ['Sonia', 'Kelly', 'Hayato'],
        pet: 'Punkin',
        loadout: 'Bônus de Equipe',
        tacticalTip: 'Se for derrubado dentro da aura, você se levanta sozinho instantaneamente.'
      },
      {
        roleName: 'Rusher 2',
        activeSkill: 'Orion',
        passiveSkills: ['Miguel', 'Sonia', 'Ford'],
        pet: 'Arakuda',
        loadout: 'Super Mochila de Perna',
        tacticalTip: 'Segure a linha de frente enquanto o médico cura o restante do squad.'
      }
    ]
  },
  {
    id: 'meta-nero-rin-anticongelante',
    name: 'Controle Onírico & Anti-Gelo (Meta Nero & Rin)',
    tier: 'TIER S',
    badge: 'NOVO DUO TÁTICO',
    focus: 'Supressão de Paredes de Gel e Dano Perfurante',
    description: 'Combina a Mente Gélida de Nero (bloqueia oponentes de usar gel em raio de 8m e drena 16 HP/s) com a Rajada de Kunai da Rin que destrói o gel adversário e busca alvos automaticamente.',
    synergyScore: 95,
    mode: 'Campeonatos & Safes Finais',
    keyActiveSkill: 'Nero',
    coreSkills: ['Nero', 'Rin', 'Skyler', 'Wolfrahh'],
    petRecommendation: 'Dom Pisante ou Brabuíno',
    loadoutRecommendation: 'Martelo de Reforço',
    strengths: [
      'Desabilita completamente a defesa de gel do inimigo por 12 segundos',
      'Excelente em finais de safe onde todos se escondem atrás de paredes de gel',
      'Kunais teleguiadas causam pressão psicológica contínua'
    ],
    weaknesses: [
      'Criatura do Nero pode ser destruída se o inimigo focar nela',
      'Requer coordenação para atacar logo após o lançamento'
    ],
    squadBuild: [
      {
        roleName: 'Iniciador / Anti-Gel',
        activeSkill: 'Nero',
        passiveSkills: ['Rin', 'Moco', 'Kelly'],
        pet: 'Dom Pisante',
        loadout: 'Super Mochila de Perna',
        tacticalTip: 'Lance a criatura do Nero na direção do gel principal inimigo para bloquear a defesa deles.'
      },
      {
        roleName: 'Destruidor / Quebrador',
        activeSkill: 'Skyler',
        passiveSkills: ['Iris', 'Alvaro', 'Hayato'],
        pet: 'Brabuíno',
        loadout: 'Martelo de Reforço',
        tacticalTip: 'Use a quebra de gel do Skyler combinada com granadas de alto alcance.'
      },
      {
        roleName: 'Rusher de Limpeza',
        activeSkill: 'Tatsuya',
        passiveSkills: ['Sonia', 'Wolfrahh', 'Kelly'],
        pet: 'Punkin',
        loadout: 'Loja Tática',
        tacticalTip: 'Avance no espaço desprotegido para eliminar os oponentes sem gel.'
      },
      {
        roleName: 'IGL / Posicionamento',
        activeSkill: 'Homero',
        passiveSkills: ['Nairi', 'J.Biebs', 'Antonio'],
        pet: 'Cascavel',
        loadout: 'Bônus de Equipe',
        tacticalTip: 'Coordene a entrada do squad e use Nairi para garantir nosso próprio gel impenetrável.'
      }
    ]
  },
  {
    id: 'meta-orion-miguel-cs-squad',
    name: 'Tanque Imortal 4x4 (Orion & Miguel)',
    tier: 'TIER S+',
    badge: 'REI DO CS SQUAD 4X4',
    focus: 'Invulnerabilidade, Dreno de HP em Área e Duelos Fechados',
    description: 'A composição mais letal no modo CS 4x4 e combates em espaços confinados. Orion entra em forma invulnerável drenando HP adversário, enquanto Miguel garante 200 EP imediato a cada abate para reativar o Orion infinitamente.',
    synergyScore: 99,
    mode: 'CS Squad 4x4 & Trocação Curta',
    keyActiveSkill: 'Orion',
    coreSkills: ['Orion', 'Miguel', 'Ford', 'Hayato'],
    petRecommendation: 'Arakuda (Preserva EP)',
    loadoutRecommendation: 'Super Mochila de Perna',
    strengths: [
      'Invulnerável a tiros durante a ativação da Onda Escarlate',
      'Drena a vida de todos os inimigos próximos',
      'Reset imediato de EP com Miguel ao derrubar um oponente'
    ],
    weaknesses: [
      'Sem EP suficiente a habilidade não pode ser ativada',
      'Velocidade reduzida durante a onda escarlate'
    ],
    squadBuild: [
      {
        roleName: 'Tanque Rusher',
        activeSkill: 'Orion',
        passiveSkills: ['Miguel', 'Ford', 'Kelly'],
        pet: 'Arakuda',
        loadout: 'Super Mochila de Perna',
        tacticalTip: 'Abra a Onda Escarlate ao invadir construções ou salas fechadas.'
      },
      {
        roleName: 'Segundo Rusher',
        activeSkill: 'Tatsuya',
        passiveSkills: ['Sonia', 'Hayato', 'Luna'],
        pet: 'Punkin',
        loadout: 'Loja Tática',
        tacticalTip: 'Aproveite o dano causado pelo Orion para aplicar os disparos fatais.'
      },
      {
        roleName: 'Suporte Blindado',
        activeSkill: 'Dimitri',
        passiveSkills: ['Thiva', 'Olivia', 'J.Biebs'],
        pet: 'Barão Turbo',
        loadout: 'Bônus de Equipe',
        tacticalTip: 'Fique na retaguarda garantindo que ninguém do squad fique deitado.'
      },
      {
        roleName: 'Controle de Área',
        activeSkill: 'Homero',
        passiveSkills: ['Moco', 'Antonio', 'Kelly'],
        pet: 'Dom Pisante',
        loadout: 'Martelo de Reforço',
        tacticalTip: 'Use o drone para desacelerar o capitão adversário.'
      }
    ]
  },
  {
    id: 'meta-granadeiro-alvaro-iris',
    name: 'Artilharia Pesada: Perfuração & Dano em Área',
    tier: 'TIER S',
    badge: 'ESPECIALISTA EM SAFES',
    focus: 'Granadas de Longo Alcance e Tiros Através do Gel',
    description: 'Construída para os grandes granadeiros do cenário profissional. O Alvaro Desperto multiplica o raio e dano das explosões, enquanto Iris permite disparar através do gel inimigo marcado.',
    synergyScore: 94,
    mode: 'Competitivo Profissional (LBFF / Mundial)',
    keyActiveSkill: 'Íris',
    coreSkills: ['Íris', 'Alvaro', 'Moco', 'Nairi'],
    petRecommendation: 'Brabuíno (Arremesso Longo)',
    loadoutRecommendation: 'Super Mochila de Perna',
    strengths: [
      'Acerta oponentes escondidos atrás de Paredes de Gel',
      'Granadas com alcance estendido pelo pet Brabuíno e dano triplicado do Alvaro',
      'Excelente para aniquilar equipes inteiras presas em cantos de safe'
    ],
    weaknesses: [
      'Depende da quantidade de granadas e recursos coletados',
      'Requer excelente timing e mira parabólica'
    ],
    squadBuild: [
      {
        roleName: 'Granadeiro Oficial',
        activeSkill: 'Íris',
        passiveSkills: ['Alvaro', 'Moco', 'Kelly'],
        pet: 'Brabuíno',
        loadout: 'Super Mochila de Perna',
        tacticalTip: 'Marque o gel com Moco/Iris e lance granadas antecipadas com Brabuíno.'
      },
      {
        roleName: 'Rusher de Cobertura',
        activeSkill: 'Tatsuya',
        passiveSkills: ['Sonia', 'Hayato', 'J.Biebs'],
        pet: 'Punkin',
        loadout: 'Loja Tática',
        tacticalTip: 'Proteja o granadeiro enquanto ele cozinha e arremessa.'
      },
      {
        roleName: 'IGL / Marcador',
        activeSkill: 'Homero',
        passiveSkills: ['Nairi', 'Antonio', 'Kelly'],
        pet: 'Dom Pisante',
        loadout: 'Bônus de Equipe',
        tacticalTip: 'Gere paredes de gel com Nairi para criar cobertura aos arremessos.'
      },
      {
        roleName: 'Suporte Geral',
        activeSkill: 'Dimitri',
        passiveSkills: ['Thiva', 'Olivia', 'Kapella'],
        pet: 'Barão Turbo',
        loadout: 'Super Mochila de Perna',
        tacticalTip: 'Mantenha o time full HP antes dos confrontos de final de safe.'
      }
    ]
  }
];
