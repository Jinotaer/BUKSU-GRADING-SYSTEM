// backend/controller/aiController.js
import express from 'express';
import rateLimit from 'express-rate-limit';
import { generateTextWithGemini } from '../services/aiService.js';

const router = express.Router();

// rate limit: adjust as needed per user/IP
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // allow 10 requests per IP per minute
  message: { error: 'Too many AI requests, please try again later' },
});

// Middleware: require student auth if project tracks user identity. Insert your auth middleware here:
// import auth from '../middleware/auth.js'; // or use your existing middleware

router.post('/generate', aiLimiter, /* auth, */ async (req, res) => {
  try {
    const { prompt, maxOutputTokens, temperature } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Optional: basic length guard
    if (prompt.length > 4000) {
      return res.status(400).json({ error: 'Prompt too long' });
    }

    const options = {};
    if (maxOutputTokens) options.maxOutputTokens = maxOutputTokens;
    if (temperature != null) options.temperature = temperature;

    const result = await generateTextWithGemini(prompt, options);

    // Logging/usage tracking (optional):
    // console.log('AI request', { userId: req.user?.id, length: prompt.length, time: Date.now() });

    res.json({ ok: true, text: result.text, raw: result.raw });
  } catch (err) {
    // Log extended information when available
    console.error('[AI] generate error', err?.message || err);
    if (err?.geminiStatus || err?.geminiData) {
      console.error('Gemini response status:', err.geminiStatus);
      console.error('Gemini response data:', JSON.stringify(err.geminiData));
    }
    // Return details useful for debugging in development, but keep generic in production
    const payload = { error: 'AI service failed' };
    if (process.env.NODE_ENV !== 'production') {
      payload.detail = err?.message || String(err);
      if (err?.geminiStatus) payload.geminiStatus = err.geminiStatus;
      if (err?.geminiData) payload.geminiData = err.geminiData;
    }
    res.status(502).json(payload);
  }
});

export default router;