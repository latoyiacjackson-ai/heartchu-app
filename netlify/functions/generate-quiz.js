exports.handler = async function(event) {
  const json = (statusCode, bodyObj) => ({
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(bodyObj)
  });

  if (event.httpMethod === 'GET') {
    const health = event.queryStringParameters && event.queryStringParameters.health;
    if (health) {
      return json(200, { ok: true, message: 'Heartchu AI function is online.' });
    }
    return json(405, { error: 'Method not allowed.' });
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json(500, { error: 'ANTHROPIC_API_KEY is not set in Netlify environment variables.' });
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const count = Math.max(5, Math.min(12, Number(body.count) || 8));
    const customPrompt = String(body.customPrompt || '').trim();

    const system = 'You generate safe, upbeat, age-appropriate fan quiz content in strict JSON only. Do not include markdown fences. Keep it positive. Return exactly one JSON object.';

    const user = `Create a K-pop fan-style personality quiz inspired by Hearts2Hearts called Heartchu.\n\nRequirements:\n- Return strict JSON only.\n- Include keys: title, questions, results.\n- title must be a short string.\n- questions must be an array of ${count} question objects.\n- Each question object must have keys: text, answers.\n- answers must be an array of exactly 4 answer objects.\n- Each answer object must have keys: text, type.\n- The only allowed type values are: star, soft, icon, cutie.\n- results must be an object with exactly these four keys: star, soft, icon, cutie.\n- Each result must contain keys: title, description.\n- Keep all content age-appropriate, upbeat, easy to read, and fun for a young fan.\n- Avoid romance, sexuality, controversy, or anything negative.\n- Vary the questions so they feel fresh.\n- Do not mention that you are an AI.\n\nCreative direction:\n${customPrompt || 'Cute, playful, polished, colorful, and fan-friendly.'}`;

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
        max_tokens: 2200,
        temperature: 0.9,
        system,
        messages: [{ role: 'user', content: user }]
      })
    });

    const rawText = await upstream.text();
    let raw;
    try {
      raw = rawText ? JSON.parse(rawText) : {};
    } catch (e) {
      return json(502, { error: 'Anthropic returned non-JSON output.', details: rawText.slice(0, 1000) });
    }

    if (!upstream.ok) {
      return json(upstream.status, { error: raw?.error?.message || 'Anthropic request failed.', details: raw });
    }

    const text = Array.isArray(raw.content)
      ? raw.content.filter(part => part && part.type === 'text').map(part => part.text).join('\n')
      : '';

    if (!text) {
      return json(502, { error: 'No text returned from Anthropic.', details: raw });
    }

    let quiz;
    try {
      quiz = JSON.parse(text);
    } catch (err) {
      const cleaned = text
        .replace(/^```json\s*/i, '')
        .replace(/^```/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      try {
        quiz = JSON.parse(cleaned);
      } catch (err2) {
        return json(502, { error: 'Model returned text that was not valid JSON.', details: text.slice(0, 1200) });
      }
    }

    return json(200, { ok: true, quiz });
  } catch (error) {
    return json(500, { error: error && error.message ? error.message : 'Unexpected server error.' });
  }
};

