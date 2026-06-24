const axios = require('axios');

/**
 * Centralized unified AI completion utility using Groq with Gemini as a fallback.
 * Supports standard message arrays and optional JSON output format.
 */
const getAICompletion = async (messages, maxTokens = 500, responseFormat = null) => {
  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama3-70b-8192', 'mixtral-8x7b-32768'];
  const groqApiKey = process.env.GROQ_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  // 1. Try Groq (Direct REST via axios)
  if (groqApiKey) {
    for (const modelName of models) {
      try {
        const payload = {
          model: modelName,
          messages,
          max_tokens: maxTokens
        };
        if (responseFormat) {
          payload.response_format = responseFormat;
        }
        
        const response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          payload,
          {
            headers: {
              'Authorization': `Bearer ${groqApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 8000
          }
        );

        const content = response.data?.choices?.[0]?.message?.content;
        if (content) return content;
      } catch (e) {
        console.warn(`⚠️ Groq model ${modelName} call failed:`, e.message);
      }
    }
  }

  // 2. Try Gemini (via structured payload)
  if (geminiApiKey) {
    try {
      const contents = messages.map(m => {
        let role = m.role === 'assistant' ? 'model' : m.role;
        if (role === 'system') role = 'user'; // Map system role for compatibility
        return {
          role,
          parts: [{ text: m.content }]
        };
      });

      const payload = {
        contents,
        generationConfig: {
          maxOutputTokens: maxTokens
        }
      };
      
      if (responseFormat && responseFormat.type === 'json_object') {
        payload.generationConfig.responseMimeType = 'application/json';
      }

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (content) return content;
    } catch (e) {
      console.error('❌ Gemini API call failed:', e.message);
    }
  }

  throw new Error('All AI providers failed or credentials are missing');
};

/**
 * Standard utility to stream AI responses directly to an HTTP response object.
 */
const streamAI = async (res, systemPrompt, userPrompt) => {
  try {
    const content = await getAICompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], 2000);
    res.write(content);
    res.end();
  } catch (e) {
    res.status(500).write(JSON.stringify({ error: e.message }));
    res.end();
  }
};

module.exports = { getAICompletion, streamAI };
