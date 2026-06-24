// server/algorithms/photoQuality.js
/**
 * AI PHOTO QUALITY ANALYZER
 *
 * Uses Groq / Gemini Vision to:
 * 1. Detect blurry / out-of-focus photos
 * 2. Score photo quality (0-100)
 * 3. Generate tags (outdoor, group, food, landscape, night, etc.)
 * 4. Write a short AI caption
 * 5. Auto-select best photos from a batch
 */

const OpenAI = require('openai');

// Unified resilient AI vision completion helper (Groq with Gemini Fallback)
const getAIVisionCompletion = async (imageUrl, textPrompt) => {
  // 1. Try Groq (Llama 3.2 11B Vision)
  try {
    const groqClient = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1'
    });
    const response = await groqClient.chat.completions.create({
      model: 'llama-3.2-11b-vision-preview',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: imageUrl, detail: 'low' }
          },
          {
            type: 'text',
            text: textPrompt
          }
        ]
      }]
    });
    return response.choices[0].message.content;
  } catch (groqError) {
    console.error('⚠️ Groq Vision failed, falling back to Gemini:', groqError.message);
    
    // 2. Try Gemini (gemini-1.5-flash)
    try {
      const geminiClient = new OpenAI({
        apiKey: process.env.GEMINI_API_KEY,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
      });
      const response = await geminiClient.chat.completions.create({
        model: 'gemini-1.5-flash',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            },
            {
              type: 'text',
              text: textPrompt
            }
          ]
        }]
      });
      return response.choices[0].message.content;
    } catch (geminiError) {
      console.error('❌ Gemini Vision failed:', geminiError.message);
      throw new Error('All Vision AI providers failed');
    }
  }
};

/**
 * Analyze a single photo for quality
 * @param {string} imageUrl - Cloudinary URL
 * @returns {Object} quality analysis result
 */
const analyzePhotoQuality = async (imageUrl) => {
  try {
    const textPrompt = `Analyze this photo and return ONLY valid JSON (no markdown, no explanation):
{
  "qualityScore": <0-100 integer>,
  "qualityLabel": "<excellent|good|average|poor|blurry>",
  "isBlurry": <true|false>,
  "isBestShot": <true if this is worth keeping as a highlight>,
  "tags": ["<tag1>","<tag2>","<tag3>"],
  "caption": "<10 words max describing the photo>",
  "reasons": "<1 sentence why this score>"
}

Scoring guide:
- 90-100: Sharp, well-lit, well-composed, great moment
- 70-89: Good quality, minor issues
- 50-69: Average, some blur or lighting issues
- 30-49: Poor quality, significantly blurry or dark
- 0-29: Very blurry, completely dark, or unusable

Tags should be from: outdoor, indoor, group, selfie, food, landscape, night, beach, mountain, city, nature, portrait, action, party, celebration`;

    const text = await getAIVisionCompletion(imageUrl, textPrompt);
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

    return {
      qualityScore: Math.max(0, Math.min(100, parsed.qualityScore || 50)),
      qualityLabel: parsed.qualityLabel || 'average',
      isBlurry: parsed.isBlurry || false,
      isBestPhoto: parsed.isBestShot && (parsed.qualityScore >= 70),
      tags: parsed.tags || [],
      description: parsed.caption || '',
      reasons: parsed.reasons || ''
    };
  } catch (err) {
    console.error('Photo analysis error:', err.message);
    // Return default if AI fails
    return {
      qualityScore: 50,
      qualityLabel: 'average',
      isBlurry: false,
      isBestPhoto: false,
      tags: [],
      description: '',
      reasons: 'Analysis unavailable'
    };
  }
};

/**
 * Analyze a batch of photos and select the best ones
 * Used after group upload to auto-curate highlights
 *
 * @param {Array} photos - [{_id, cloudinaryUrl, uploadedBy}]
 * @returns {Object} {analyzed: [], bestPhotoIds: []}
 */
const analyzeBatchPhotos = async (photos) => {
  // Process in parallel with rate limiting (max 3 at a time)
  const results = [];
  const batchSize = 3;

  for (let i = 0; i < photos.length; i += batchSize) {
    const batch = photos.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(async (photo) => {
        const analysis = await analyzePhotoQuality(photo.cloudinaryUrl);
        return { photoId: photo._id, ...analysis };
      })
    );
    results.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean));

    // Small delay between batches to respect rate limits
    if (i + batchSize < photos.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Best photos = score >= 75 AND not blurry
  const bestPhotoIds = results
    .filter(r => r.qualityScore >= 75 && !r.isBlurry)
    .sort((a, b) => b.qualityScore - a.qualityScore)
    .map(r => r.photoId);

  return { analyzed: results, bestPhotoIds };
};

/**
 * Quick blur detection using simple heuristics on file metadata
 * Used as a fast pre-filter before expensive AI analysis
 *
 * @param {Object} fileInfo - {size, width, height, filename}
 * @returns {boolean} true if likely blurry
 */
const quickBlurHeuristic = (fileInfo) => {
  // Very small file size often means blurry or low quality
  if (fileInfo.size && fileInfo.size < 50 * 1024) return true; // < 50KB
  // Extreme aspect ratios can indicate accidental screenshots
  if (fileInfo.width && fileInfo.height) {
    const ratio = fileInfo.width / fileInfo.height;
    if (ratio > 5 || ratio < 0.2) return true;
  }
  return false;
};

/**
 * Unified text completion helper using OpenAI format
 * @param {string} textPrompt - The prompt for text completion
 * @returns {Promise<string>} response content
 */
const getAITextCompletion = async (textPrompt) => {
  const models = ['llama-3.1-8b-instant', 'llama3-8b-8192', 'llama-3.3-70b-versatile'];
  const groqClient = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1'
  });

  for (const model of models) {
    try {
      const response = await groqClient.chat.completions.create({
        model,
        max_tokens: 600,
        messages: [{ role: 'user', content: textPrompt }]
      });
      return response.choices[0].message.content;
    } catch (groqError) {
      console.warn(`Groq text model ${model} failed:`, groqError.message);
    }
  }

  // Fallback to Gemini
  try {
    const geminiClient = new OpenAI({
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
    });
    const response = await geminiClient.chat.completions.create({
      model: 'gemini-1.5-flash',
      max_tokens: 600,
      messages: [{ role: 'user', content: textPrompt }]
    });
    return response.choices[0].message.content;
  } catch (geminiError) {
    console.error('❌ Gemini Text failed:', geminiError.message);
    throw new Error('All Text AI providers failed');
  }
};

module.exports = { analyzePhotoQuality, analyzeBatchPhotos, quickBlurHeuristic, getAITextCompletion };

