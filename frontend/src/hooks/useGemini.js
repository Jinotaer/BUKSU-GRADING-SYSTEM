// frontend/src/hooks/useGemini.js
import { useState, useCallback } from 'react';
import axios from 'axios';

export default function useGemini() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use a Vite env var when available, otherwise default to backend on port 5000.
  // In development you can set VITE_API_BASE=http://localhost:5000
  const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE) || 'http://localhost:5000';

  const generate = useCallback(async (prompt, opts = {}) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await axios.post(`${API_BASE}/api/ai/generate`, { prompt, ...opts }, { timeout: 30000 });
      setLoading(false);
      if (resp.data?.ok) return { text: resp.data.text, raw: resp.data.raw };
      throw new Error(resp.data?.error || 'AI responded without ok');
    } catch (err) {
      setLoading(false);
      const message = err?.response?.data?.error || err?.message || String(err);
      setError(message);
      return { error: err?.response?.data || message };
    }
  }, [API_BASE]);

  return { generate, loading, error };
}