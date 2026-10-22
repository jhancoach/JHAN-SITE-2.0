import fs from 'fs';
import path from 'path';

async function extractAllSinglePass() {
  console.log("Extracting all 64 Garena Free Fire characters in single pass...");
  const characters = [];
  let currentId = 793; // Morse
  const visited = new Set();
  
  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    try {
      const res = await fetch(`https://ff.garena.com/pt/chars/${currentId}/`, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      if (res.status !== 200) {
        console.warn(`Non-200 status for ID ${currentId}: ${res.status}`);
        break;
      }
      const text = await res.text();
      const match = text.match(/window\.__NUXT__=(.*?);<\/script>/s);
      if (!match) break;
      const data = eval(match[1]);
      const d = data.data?.[1]?.charDetail;
      if (!d) break;

      // Extract cooldown from ability text (e.g. "Tempo de recarga: 45s", "Recarga: 30s")
      const cdMatch = (d.ability_introduction || '').match(/(?:recarga|tempo de espera)[^0-9]*([0-9]+)\s*s/i);
      const cooldown = cdMatch ? parseInt(cdMatch[1], 10) : null;

      const intro = (d.ability_introduction || '').toLowerCase();
      const hasCooldown = cooldown !== null && cooldown > 0;
      const hasActiveKeywords = intro.includes('tempo de recarga') || 
                                intro.includes('recarga:') || 
                                intro.includes('ao ativar') || 
                                intro.includes('ative para') ||
                                intro.includes('entra no modo') ||
                                intro.includes('cria uma aura') ||
                                intro.includes('cria um escudo') ||
                                intro.includes('ao usar a habilidade') ||
                                d.ability === 'Código Furtivo' ||
                                d.ability === 'Disparo Rebelde' ||
                                d.ability === 'Onda Escarlate' ||
                                d.ability === 'Escudo Tunado' ||
                                d.ability === 'Batida da Cura' ||
                                d.ability === 'Som na Caixa' ||
                                d.ability === 'Olho de Argos';

      const type = (hasCooldown || hasActiveKeywords) && d.ability !== '-' ? 'Ativo' : 'Passivo';

      // Suggested tactical role
      let role = 'Rusher';
      if (intro.includes('cura') || intro.includes('vida') || intro.includes('aliados') || intro.includes('resgate') || intro.includes('salvar') || intro.includes('eletroterapia')) {
        role = 'Suporte / Médico';
      } else if (intro.includes('rastreia') || intro.includes('localiza') || intro.includes('marca') || intro.includes('visão') || intro.includes('detect') || intro.includes('olho')) {
        role = 'Scout / Reconhecimento';
      } else if (intro.includes('gel') || intro.includes('granada') || intro.includes('explos') || intro.includes('dano a construções') || intro.includes('quebra')) {
        role = 'Granadeiro / Suporte';
      } else if (intro.includes('escudo') || intro.includes('proteção') || intro.includes('reduz o dano') || intro.includes('armadura')) {
        role = 'Capitão / Linha de Frente';
      } else if (intro.includes('velocidade') || intro.includes('dano') || intro.includes('penetra') || intro.includes('disparo') || intro.includes('recuo') || intro.includes('abate')) {
        role = 'Rusher Principal';
      }

      characters.push({
        id: d.id,
        name: d.name,
        en_name: d.en_name || '',
        abstract: d.abstract || '',
        introduction: (d.introduction || '').replace(/<[^>]*>?/gm, '').trim(),
        ability: d.ability || 'Habilidade Especial',
        ability_introduction: d.ability_introduction || '',
        type,
        cooldown,
        role,
        head_icon: d.head_icon || d.cover_img || '',
        skill_icon: d.skill_icon || '',
        skill_pic: d.skill_pic || '',
        cover_img: d.cover_img || '',
        character_pc: d.character_pc || d.cover_img || '',
        pc_bg: d.pc_bg || '',
        mobile_bg: d.mobile_bg || '',
        is_new: !!d.is_new,
        awaken: !!d.awaken,
        story_link: d.story_link || `https://ff.garena.com/pt/chars/${d.id}/`
      });

      console.log(`[${characters.length}/64] Extracted: ${d.name} (${d.ability}) [${type}]`);

      const nextId = d.next_char?.id;
      if (nextId && !visited.has(nextId)) {
        currentId = nextId;
      } else {
        break;
      }
    } catch (e) {
      console.error(`Error at ID ${currentId}:`, e.message);
      break;
    }
  }

  const outDir = path.resolve('src/data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, 'garenaCharacters.json');
  fs.writeFileSync(outPath, JSON.stringify(characters, null, 2), 'utf-8');
  console.log(`ALL DONE! Successfully extracted and saved ${characters.length} characters to ${outPath}`);
}

extractAllSinglePass();
