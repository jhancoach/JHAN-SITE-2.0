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

      const ai = getGeminiClient();      const systemPrompt = `Você é um analista especialista em Esports e Reconhecimento Óptico de Telas do Garena Free Fire (FFWS, LBFF, BR Ranqueado).
Sua missão é extrair com 100% de exatidão e fidelidade todos os dados contidos no print da tela pós-partida ("ESTATÍSTICAS DA PARTIDA" / "BR RANQUEADO" / "BOOYAH!").

ESTRUTURA DAS COLUNAS E TABELA DO SQUAD:
A tabela possui 4 linhas (1 para cada jogador do Squad) e várias colunas coloridas:
1. COLUNA DO JOGADOR (Laranja):
   - Nome do Jogador (Nick): Ex: "Nickz LOUD", "choro7 fé!", "LOUD JOKER", "LOUD JHAN", "LOUD Cauan7", etc.
   - DIRETAMENTE EMBAIXO DO NOME DO JOGADOR está o K/D/A no formato "K / D / A" ou "K/D/A":
     * 1º valor (K) = KILLS (Abates do jogador)
     * 2º valor (D) = MORTES (Deaths do jogador)
     * 3º valor (A) = ASSISTÊNCIAS (Assists do jogador)
   Exemplos reais de leitura de KDA:
   - "23/1/6" -> kills: 23, deaths: 1, assists: 6
   - "12/1/9" -> kills: 12, deaths: 1, assists: 9
   - "7/1/3"  -> kills: 7, deaths: 1, assists: 3
   - "4/2/4"  -> kills: 4, deaths: 2, assists: 4
   - "16/0/7" -> kills: 16, deaths: 0, assists: 7
   ATENÇÃO CRÍTICA: K = Kills (Abates), D = Mortes (Deaths), A = Assistências. NUNCA confunda Kills com Mortes ou Assistências!

2. COLUNA AZUL: DMG (Dano Total Causado) - Ex: 16980, 4651, 2863, 1777
3. COLUNA VERDE: Dano Real - Ex: 4939, 1765, 1036, 1285
4. COLUNA LILÁS / ROXO: Derrubados (Knocks) - Ex: 24, 11, 7, 4
5. COLUNA CIANO: Cura (Healing) - Ex: 1020, 935, 734, 190
6. COLUNA AMARELO: Levantados (Revives) - Ex: 0, 0, 0, 0
7. COLUNA ROSA: Ressurgimento (Respawns) - Ex: 1, 2, 2, 0
8. COLUNA BRANCO: % Acerto na Cabeça (Headshot Rate) - Ex: "39.13%", "25.00%"

COLOCAÇÃO / RANK & MAPA:
- Colocação (Rank): 1 para Booyah / 1º lugar, 2 para 2º lugar, etc.
- Mapa: "Solara", "Bermuda", "Purgatório", "Alpine", "Nova Terra", "Kalahari".

TABELA OFICIAL DE PONTUAÇÃO LBFF:
- 1º = 12 pts, 2º = 9 pts, 3º = 8 pts, 4º = 7 pts, 5º = 6 pts, 6º = 5 pts, 7º = 4 pts, 8º = 3 pts, 9º = 2 pts, 10º = 1 pt, 11º/12º = 0 pts.

Retorne SEMPRE o JSON estritamente estruturado com os 4 jogadores preenchidos com máxima precisão.`;

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
