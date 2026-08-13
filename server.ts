import express from "express";
import path from "path";
import cors from "cors"; // 1. Import CORS
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);

  // 2. Configure CORS middleware (Place BEFORE any routes)
  app.use(
    cors({
      origin: [
        "https://badergorchene.github.io",
        "http://localhost:5173",
        "http://localhost:3000",
      ],
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );

  // Handle CORS preflight explicitly across all routes
  app.options("*", cors());

  app.use(express.json({ limit: "15mb" }));

  // Initialize Gemini API client securely on the server
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // API Route: Tunisian Passport OCR & Data Extraction
  app.post("/api/extract-passport", async (req, res) => {
    try {
      const { imageBase64, mimeType = "image/jpeg" } = req.body;

      if (!imageBase64) {
        return res.status(400).json({
          success: false,
          error: "Aucune image ou PDF fourni (imageBase64 requis).",
        });
      }

      // Ensure imageBase64 is a string (data URL or base64)
      if (typeof imageBase64 !== "string") {
        console.warn(
          "Received non-string imageBase64 in /api/extract-passport:",
          typeof imageBase64,
        );
        return res.status(400).json({
          success: false,
          error:
            "Invalid payload: imageBase64 must be a base64 string or data URL.",
        });
      }

      // Clean base64 string if data URL prefix exists
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");

      const ai = getGeminiClient();

      const prompt = `
Vous êtes un expert OCR spécialisé dans la lecture et l'extraction de données à partir de passeports tunisiens (Passeport de la République Tunisienne / الجمهورية التونسية - جواز سفر).
Analyse minutieusement l'image ou le document PDF du passeport tunisien fourni et extrait toutes les informations clés dans le format JSON strict requis.

Attention particulière pour les passeports tunisiens:
- Le nom et le prénom apparaissent en français (latin) et en arabe.
- Le numéro de passeport tunisien commence généralement par un préfixe (ex: N, P, etc.) suivi de chiffres (ex: N2891048 ou 0881234).
- Extrais la bande MRZ (Machine Readable Zone) si disponible au bas de la page.
- Identifie le numéro de carte d'identité nationale (CIN) si mentionné.
- Extrais le sexe (M ou F), la date de naissance, la date d'émission et la date d'expiration.
`;

      // 3. Updated to gemini-3.5-flash-lite
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          {
            text: prompt,
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              passportNumber: {
                type: Type.STRING,
                description: "Numéro de passeport tunisien (ex: N2891048)",
              },
              surnameLatin: {
                type: Type.STRING,
                description: "Nom de famille en caractères latins",
              },
              givenNamesLatin: {
                type: Type.STRING,
                description: "Prénom(s) en caractères latins",
              },
              fullNameArabic: {
                type: Type.STRING,
                description: "Nom et Prénom complets en arabe",
              },
              cinNumber: {
                type: Type.STRING,
                description:
                  "Numéro de la CIN (Carte d'Identité Nationale) si visible",
              },
              nationality: {
                type: Type.STRING,
                description: "Nationalité (ex: TUNISIENNE / تونسي)",
              },
              dateOfBirth: {
                type: Type.STRING,
                description: "Date de naissance au format JJ/MM/AAAA",
              },
              placeOfBirth: {
                type: Type.STRING,
                description: "Lieu de naissance",
              },
              sex: { type: Type.STRING, description: "Sexe ('M' ou 'F')" },
              issueDate: {
                type: Type.STRING,
                description: "Date d'émission au format JJ/MM/AAAA",
              },
              expiryDate: {
                type: Type.STRING,
                description: "Date d'expiration au format JJ/MM/AAAA",
              },
              issuingAuthority: {
                type: Type.STRING,
                description: "Autorité de délivrance (ex: TUNIS)",
              },
              mrz1: {
                type: Type.STRING,
                description: "Première ligne de la zone MRZ",
              },
              mrz2: {
                type: Type.STRING,
                description: "Deuxième ligne de la zone MRZ",
              },
              confidenceScore: {
                type: Type.NUMBER,
                description: "Score de confiance global (0 à 100)",
              },
            },
            required: [
              "passportNumber",
              "surnameLatin",
              "givenNamesLatin",
              "fullNameArabic",
              "dateOfBirth",
              "expiryDate",
            ],
          },
        },
      });

      const extractedData = JSON.parse(response.text || "{}");
      return res.json({ success: true, data: extractedData });
    } catch (err: any) {
      console.error("Erreur lors de l'extraction du passeport:", err);
      return res.status(500).json({
        success: false,
        error:
          err.message ||
          "Erreur serveur lors du traitement du passeport avec Gemini API.",
      });
    }
  });

  // Vite middleware for dev / static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
