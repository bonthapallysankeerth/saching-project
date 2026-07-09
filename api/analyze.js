import { demoResult } from './demo-data.js';

export const config = {
  api: { bodyParser: false },
};

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function isDemoRequest(body) {
  const text = body.toString('utf8', 0, Math.min(body.length, 4096));
  return text.includes('name="demo"') || text.includes('demo=true') || text.includes('demo\r\n\r\ntrue');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = await readBody(req);

  if (isDemoRequest(body)) {
    return res.status(200).json(demoResult);
  }

  // Allow local/Vercel Python or HuggingFace backend via env var
  const backend = process.env.BACKEND_URL || process.env.HF_SPACE_URL;
  if (backend) {
    try {
      const resp = await fetch(`${backend.replace(/\/$/, '')}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': req.headers['content-type'] || 'multipart/form-data' },
        body,
      });
      const data = await resp.json();
      return res.status(resp.status).json(data);
    } catch (err) {
      return res.status(502).json({ error: 'Backend unreachable', detail: String(err) });
    }
  }

  return res.status(503).json({
    detail: 'PDF analysis backend not connected. Click "Run Demo" for the presentation, or deploy the HuggingFace Space (free, no card).',
    demo_available: true,
  });
}
