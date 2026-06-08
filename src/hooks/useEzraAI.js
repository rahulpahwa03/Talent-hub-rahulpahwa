// src/hooks/useEzraAI.js
// Hook to query OpenRouter AI for natural language candidate search

export function useEzraAI() {
  const queryEzra = async (text) => {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_OPENROUTER_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'auto',
          messages: [{ role: 'user', content: text }],
        }),
      });
      const data = await response.json();
      // Expect AI to return a JSON block inside its message content
      const content = data?.choices?.[0]?.message?.content || '';
      // Try to extract JSON object
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return parsed;
        } catch (e) {
          // fall back to empty
        }
      }
      // Fallback: simple keyword matcher (same as previous)
      const lower = text.toLowerCase();
      const result = {};
      if (lower.includes('java') || lower.includes('developer')) {
        result.skills = ['Java'];
      }
      if (lower.includes('h1b')) result.visa = 'H1B';
      if (lower.includes('texas') || lower.includes('tx')) result.location = 'Texas';
      // parse experience number
      const expMatch = lower.match(/(\d+)\s*years?/);
      if (expMatch) result.minExp = parseInt(expMatch[1], 10);
      return result;
    } catch (err) {
      console.error('Ezra AI error', err);
      return {};
    }
  };
  return { queryEzra };
}
