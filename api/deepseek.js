

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  // Basic rate-limit (10 req / minute / IP) in memory
  // Works fine for low-traffic MVPs; for production use Upstash, Redis, etc.
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  global.rateMap = global.rateMap || new Map();
  const bucket = global.rateMap.get(ip) || [];
  // keep only hits from the last minute
  const recent = bucket.filter(t => now - t < 60_000);
  if (recent.length >= 10) {
    return res.status(429).json({ error: 'Too many requests – slow down!' });
  }
  recent.push(now);
  global.rateMap.set(ip, recent);

  // Secret key from Vercel env vars
  const KEY = process.env.DEEPSEEK_KEY;
  if (!KEY) {
    return res.status(500).json({ error: 'Server misconfig: no API key' });
  }

  try {
    const forward = await fetch(
      'https://api.deepseek.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${KEY}`,
          'Content-Type':  'application/json'
        },
        body: JSON.stringify(req.body)
      }
    );

    // Propagate DeepSeek errors
    if (!forward.ok) {
      const txt = await forward.text();
      return res.status(forward.status).send(txt);
    }

    const data = await forward.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(502).json({ error: 'Upstream fetch failed' });
  }
}
