import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const PORT = 3000;

async function startServer() {
  const app = express();

  // Support base64 image uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Lazy / safe Gemini AI client
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured on the server.");
    }
    return new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Scoreboard Extraction API
  app.post("/api/extract-scoreboard", async (req, res) => {
    try {
      const { images } = req.body;

      if (!images || !Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ error: "Nenhuma imagem fornecida para extração." });
      }

      const ai = getGeminiClient();

      const systemPrompt = `Você é um analista especialista em Esports e Reconhecimento Óptico de Telas do Garena Free Fire (FFWS, LBFF, BR Ranqueado).
Sua missão é extrair com 100% de exatidão e fidelidade todos os dados contidos no print da tela pós-partida do Free Fire.

O PRINT PODE ESTAR EM UM DE DOIS FORMATOS OFICIAIS:

============================================================
FORMATO 1: TELA DE RESUMO GERAL PÓS-PARTIDA (EXEMPLO MAIS COMUM)
============================================================
- CABEÇALHO SUPERIOR ESQUERDO:
  * Modo de jogo: ex: "BR RANQUEADO", "CS RANQUEADO", "SALA PERSONALIZADA".
  * Mapa: ex: "SOLARA", "BERMUDA", "PURGATÓRIO", "ALPINE", "NOVA TERRA", "KALAHARI".
- CENTRO DA TELA (COLOCAÇÃO / BOOYAH):
  * Emblema central dourado com número grande: ex: "1 BOOYAH!", "2 BOOYAH!", "3 BOOYAH!", "#1", "#3", "Classificação #1", "Classificação #3".
  * Retorne o número inteiro (ex: 3 para "3 BOOYAH!", 1 para "1 BOOYAH!").
- TABELA DE JOGADORES (4 LINHAS COM AS COLUNAS CLARAS):
  * Coluna PONTUAÇÃO (Hexágono/Medalha): Valor numérico decimal como 15.0, 13.2, 11.3, 9.5, etc.
  * Coluna APELIDO: Nickname em destaque (ex: "Nickz LOUD", "choro7 fé!", "LOUD JOKER", "LOUD JHAN") e linha secundária de time se houver.
  * Coluna K: Abates / Kills (ex: 23, 12, 7, 4).
  * Coluna A: Assistências (ex: 6, 9, 3, 4).
  * Coluna DMG: Dano total causado (ex: 16980, 4651, 2863, 1777).
  * Coluna RESSURGIMENTO: Quantidade de revives/respawns do jogador (ex: 1, 2, 2, 0).
  * Coluna TEMPO DE SOBREVIVÊNCIA: Formato MM'SS" (ex: "14'35\\"").
- RODAPÉ ESQUERDO: ID da Partida (ex: "2090079783537920000#J42261C087C1271").

============================================================
FORMATO 2: TELA DETALHADA "ESTATÍSTICAS DA PARTIDA" (COLUNAS COLORIDAS)
============================================================
- Coluna LARANJA (Jogador): Nickname + linha inferior com K/D/A no formato "K / D / A" (ex: "23 / 1 / 6" -> Kills: 23, Deaths: 1, Assists: 6).
- Coluna AZUL: DMG (Dano Total Causado).
- Coluna VERDE: Dano Real.
- Coluna LILÁS / ROXO: Derrubados (Knocks).
- Coluna CIANO: Cura (Healing).
- Coluna AMARELO: Levantados (Revives).
- Coluna ROSA: Ressurgimento (Respawns).
- Coluna BRANCO: % Acerto na Cabeça (Headshot Rate).

TABELA OFICIAL DE PONTOS DE COLOCAÇÃO LBFF:
- 1º = 12 pts, 2º = 9 pts, 3º = 8 pts, 4º = 7 pts, 5º = 6 pts, 6º = 5 pts, 7º = 4 pts, 8º = 3 pts, 9º = 2 pts, 10º = 1 pt, 11º/12º = 0 pts.

Retorne SEMPRE o JSON estritamente estruturado com todos os 4 jogadores preenchidos com máxima fidelidade.`;

      // Process images
      const results = [];

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const rawBase64 = img.data.replace(/^data:image\/\w+;base64,/, "");
        const mimeType = img.mimeType || "image/png";

        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.7-flash",
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: rawBase64,
                  },
                },
                { text: systemPrompt },
              ],
            },
            config: {
              temperature: 0.1,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  map: { type: Type.STRING, description: "Nome exato do mapa: Solara, Bermuda, Purgatório, Alpine, Nova Terra, Kalahari" },
                  rank: { type: Type.INTEGER, description: "Colocação do squad (1 para Booyah, 2, 3, etc)" },
                  placementPoints: { type: Type.INTEGER, description: "Pontos de colocação da LBFF" },
                  gameMode: { type: Type.STRING, description: "Modo de jogo detectado (ex: BR Ranqueado)" },
                  matchId: { type: Type.STRING, description: "Código de hash ou ID da partida" },
                  players: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING, description: "Nick exato do jogador" },
                        kills: { type: Type.INTEGER, description: "Abates (K)" },
                        deaths: { type: Type.INTEGER, description: "Mortes (D)" },
                        assists: { type: Type.INTEGER, description: "Assistências (A)" },
                        damage: { type: Type.INTEGER, description: "Dano total (DMG)" },
                        realDamage: { type: Type.INTEGER, description: "Dano real" },
                        knocks: { type: Type.INTEGER, description: "Derrubados" },
                        healing: { type: Type.INTEGER, description: "Cura" },
                        revives: { type: Type.INTEGER, description: "Levantados/Ressurgimentos" },
                        headshotRate: { type: Type.STRING, description: "Taxa % acerto na cabeça" },
                        score: { type: Type.NUMBER, description: "Pontuação individual" },
                        survivalTime: { type: Type.STRING, description: "Tempo de sobrevivência" },
                      },
                      required: ["name", "kills", "damage"],
                    },
                  },
                },
                required: ["map", "rank", "players"],
              },
            },
          });

          const jsonText = response.text || "{}";
          const parsed = JSON.parse(jsonText);

          // Fallback placement points if not defined
          if (parsed.placementPoints === undefined || parsed.placementPoints === null) {
            const r = parsed.rank || 1;
            const ptsTable: Record<number, number> = { 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1 };
            parsed.placementPoints = ptsTable[r] || 0;
          }

          results.push({
            success: true,
            index: i,
            filename: img.filename || `print_${i + 1}`,
            data: parsed,
          });
        } catch (itemErr: any) {
          console.error(`Erro ao processar imagem ${i}:`, itemErr);
          results.push({
            success: false,
            index: i,
            filename: img.filename || `print_${i + 1}`,
            error: itemErr.message || "Falha ao extrair dados da imagem",
          });
        }
      }

      res.json({
        totalProcessed: images.length,
        results: results,
      });
    } catch (err: any) {
      console.error("Erro geral na extração:", err);
      res.status(500).json({ error: err.message || "Erro interno do servidor ao processar imagens." });
    }
  });

  // Vite development middleware vs production static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
