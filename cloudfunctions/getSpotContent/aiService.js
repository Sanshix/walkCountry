const config = require('./config');

function cleanJsonContent(content) {
  if (!content || typeof content !== 'string') return '';
  return content
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
}

async function callAI(prompt) {
  if (!config.AI_API_KEY) {
    throw new Error('AI_NOT_CONFIGURED');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${config.AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.AI_API_KEY}`
      },
      body: JSON.stringify({
        model: config.AI_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: {
          type: 'json_object'
        }
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      throw new Error(`AI_HTTP_ERROR_${res.status}`);
    }

    const data = await res.json();
    const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

    if (!content) {
      throw new Error('AI_EMPTY_CONTENT');
    }

    return JSON.parse(cleanJsonContent(content));
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  callAI
};
