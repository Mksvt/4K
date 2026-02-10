require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

const APP_PASSWORD = process.env.APP_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://python-api:8000';

const ENABLE_KEEPALIVE_PINGS = String(
  process.env.ENABLE_KEEPALIVE_PINGS || 'true'
).toLowerCase();
const KEEPALIVE_INTERVAL_MS = Number(
  process.env.KEEPALIVE_INTERVAL_MS || 5 * 60 * 1000
);

app.use(cors());
app.use(express.json());

function assertConfigured(res) {
  if (!APP_PASSWORD) {
    res
      .status(500)
      .json({ error: 'Server misconfigured: APP_PASSWORD is missing' });
    return false;
  }
  if (!JWT_SECRET) {
    res
      .status(500)
      .json({ error: 'Server misconfigured: JWT_SECRET is missing' });
    return false;
  }
  return true;
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing Bearer token' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.auth = payload;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

async function pingPythonApiOnce() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const resp = await fetch(`${PYTHON_API_URL}/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!resp.ok) {
      console.warn(`Keepalive ping: python-api unhealthy (${resp.status})`);
      return;
    }
  } catch (error) {
    console.warn(`Keepalive ping: python-api unreachable (${error.message})`);
  }
}

function handleAuth(req, res) {
  if (!assertConfigured(res)) return;

  const { password } = req.body || {};
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  if (password !== APP_PASSWORD) {
    return res.status(401).json({ error: 'Wrong password' });
  }

  const token = jwt.sign({ scope: 'chat' }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  return res.json({ token });
}

app.post('/auth', handleAuth);
app.post('/api/auth', handleAuth);

async function handleChatMessage(req, res) {
  try {
    const { prompt } = req.body || {};

    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    const upstream = await fetch(`${PYTHON_API_URL}/chatmessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    const data = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      return res.status(502).json({
        error: 'Python API error',
        details: data,
        status: upstream.status,
      });
    }

    return res.json({ answer: data?.answer ?? '' });
  } catch (error) {
    console.error('Ошибка:', error);
    return res
      .status(500)
      .json({ error: 'Server error', details: error.message });
  }
}

app.post('/chatmessage', requireAuth, handleChatMessage);
app.post('/api/chatmessage', requireAuth, handleChatMessage);

// Backward-compatible alias
app.post('/api/chat', requireAuth, handleChatMessage);

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
  console.log(`PYTHON_API_URL: ${PYTHON_API_URL}`);

  if (ENABLE_KEEPALIVE_PINGS === 'true' && Number.isFinite(KEEPALIVE_INTERVAL_MS) && KEEPALIVE_INTERVAL_MS > 0) {
    pingPythonApiOnce();
    setInterval(pingPythonApiOnce, KEEPALIVE_INTERVAL_MS).unref();
    console.log(`Keepalive pings enabled: every ${KEEPALIVE_INTERVAL_MS}ms`);
  }
});
