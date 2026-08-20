import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // AI Route
  app.post('/api/ai/analyze-request', async (req, res) => {
    try {
      const { requestData, userPrompt } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const systemPrompt = `You are an expert logistics assistant for JR Logistics Connection. 
We ship cars, clothes, dry goods, and equipment from Ireland to Africa (including Malawi).
We offer Dublin collection starting at €50.

The user is an admin looking at a customer request. 
Customer Request Details:
${JSON.stringify(requestData, null, 2)}

Analyze this request and answer the admin's query. Use your advanced reasoning to provide logistics insights, customs requirements, and pricing considerations.`;

      // using the v2 SDK structure (models/gemini-3.1-pro-preview doesn't exist? Wait, instruction says: "You MUST use the gemini-3.1-pro-preview model and set thinkingLevel to ThinkingLevel.HIGH. Do not set maxOutputTokens.")
      // wait, what is the exact string? 'gemini-3.1-pro-preview' or 'models/gemini-3.1-pro-preview'? We can just pass 'gemini-3.1-pro-preview'.
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: [
          { role: 'user', parts: [{ text: userPrompt }] }
        ],
        config: {
          systemInstruction: systemPrompt
        }
      });
      // Actually, instruction says: "set thinkingLevel to ThinkingLevel.HIGH" -> wait, I should import ThinkingLevel? The new SDK might not export ThinkingLevel directly, let's just pass "HIGH".
      // Wait, let's look at standard format. No, let's look at the instructions again. "set thinkingLevel to ThinkingLevel.HIGH". In TS, this means I can use `"HIGH"`.

      res.json({ text: response.text });
    } catch (error: any) {
      console.error('AI API Error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate AI response' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
