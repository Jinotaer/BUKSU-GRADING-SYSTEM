// backend/controller/aiController.js
import express from 'express';
import rateLimit from 'express-rate-limit';
import { generateTextWithGemini, generateTextWithStudentContext } from '../services/aiService.js';
import { studentAuth } from '../middleware/auth.js';

const router = express.Router();

// rate limit: adjust as needed per user/IP
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // allow 10 requests per IP per minute
  message: { error: 'Too many AI requests, please try again later' },
});

// Basic AI generation without student context (for general queries)
router.post('/generate', aiLimiter, async (req, res) => {
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

    res.json({ ok: true, text: result.text, raw: result.raw });
  } catch (err) {
    console.error('[AI] generate error', err?.message || err);
    const payload = { error: 'AI service failed' };
    if (process.env.NODE_ENV !== 'production') {
      payload.detail = err?.message || String(err);
    }
    res.status(502).json(payload);
  }
});

// AI generation with student context (grades, subjects, schedule)
router.post('/generate-with-context', aiLimiter, studentAuth, async (req, res) => {
  try {
    console.log('AI generate-with-context request received');
    console.log('Student from token:', req.student);
    
    const { prompt, maxOutputTokens, temperature, includeGrades, includeSchedule, includeSubjects } = req.body;
    console.log('Request body:', { prompt: prompt?.substring(0, 100) + '...', includeGrades, includeSchedule, includeSubjects });
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (prompt.length > 4000) {
      return res.status(400).json({ error: 'Prompt too long' });
    }

    const options = {};
    if (maxOutputTokens) options.maxOutputTokens = maxOutputTokens;
    if (temperature != null) options.temperature = temperature;

    const contextOptions = {
      includeGrades: includeGrades !== false, // default true
      includeSchedule: includeSchedule !== false, // default true
      includeSubjects: includeSubjects !== false, // default true
    };
    
    console.log('Context options:', contextOptions);
    console.log('Calling generateTextWithStudentContext...');

    const result = await generateTextWithStudentContext(
      prompt, 
      req.student.id, // Changed from req.user.id to req.student.id
      options, 
      contextOptions
    );

    console.log('AI response generated successfully');
    res.json({ ok: true, text: result.text, raw: result.raw });
  } catch (err) {
    console.error('[AI] generate-with-context error', err?.message || err);
    console.error('Full error:', err);
    const payload = { error: 'AI service failed' };
    if (process.env.NODE_ENV !== 'production') {
      payload.detail = err?.message || String(err);
    }
    res.status(502).json(payload);
  }
});

// Test endpoint to verify AI service
router.post('/test', async (req, res) => {
  try {
    console.log('AI test endpoint called');
    const result = await generateTextWithGemini('Hello, can you respond with just "AI service working"?', { maxOutputTokens: 50 });
    console.log('Test AI response:', result.text);
    res.json({ ok: true, text: result.text, message: 'AI service test successful' });
  } catch (err) {
    console.error('AI test failed:', err);
    res.status(500).json({ error: 'AI test failed', detail: err.message });
  }
});

export default router;