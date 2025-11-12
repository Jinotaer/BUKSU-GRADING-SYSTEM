// backend/services/aiService.js
import axios from 'axios';
// Optionally import Google client instead if you prefer the client library

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_REST_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim() || null;

// Simple REST POST to Gemini
export async function generateTextWithGemini(prompt, options = {}) {
  if (!GEMINI_API_KEY) {
    const e = new Error('Gemini API key not configured');
    e.code = 'NO_API_KEY';
    throw e;
  }

  // Build request body according to the Gemini REST API shape.
  const body = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      // optional: maxOutputTokens, temperature, topP, etc.
      ...options
    }
  };

  try {
    const resp = await axios.post(`${GEMINI_REST_URL}?key=${encodeURIComponent(GEMINI_API_KEY)}`, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000
    });

    // Parse the Gemini response structure
    const text = resp?.data?.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(resp?.data);
    return { text, raw: resp.data };
  } catch (err) {
    // Normalize error and include HTTP status/data when available for easier debugging
    const respData = err?.response?.data;
    const status = err?.response?.status;
    const message = respData?.error?.message || respData || err?.message || 'Unknown error';
    const errMessage = `Gemini request failed${status ? ` (status ${status})` : ''}: ${typeof message === 'string' ? message : JSON.stringify(message)}`;
    const e = new Error(errMessage);
    // attach original error and response details for logging
    e.cause = err;
    e.geminiStatus = status;
    e.geminiData = respData;
    throw e;
  }
}
