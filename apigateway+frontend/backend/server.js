require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

const APP_PASSWORD = process.env.APP_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000'; 

app.use(cors());
app.use(express.json());

// Middleware авторизації
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing Bearer token' });
  }
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Ендпоінт логіну
app.post('/auth', (req, res) => {
  const { password } = req.body;
  if (password !== APP_PASSWORD) return res.status(401).json({ error: 'Wrong password' });
  const token = jwt.sign({ scope: 'chat' }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

// Ендпоінт чату (Головна логіка)
app.post('/api/chatmessage', requireAuth, async (req, res) => {
  try {
    // 1. Отримуємо дані від фронтенду
    const { prompt, responseFormat, phase } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // 2. Формуємо розширене повідомлення для Python
    // Ми вставляємо вибір користувача як системну інструкцію
    const fullMessage = `
[SYSTEM CONTEXT OVERRIDE]
Current Configuration:
- ERA/PHASE: ${phase || 'Late Hankins (2019+)'}
- RESPONSE FORMAT: ${responseFormat || 'Email Response'}

Please adhere strictly to the tone and structure defined in the PERSONA for this Era and Format.

USER INPUT:
${prompt}
    `;

    // 3. Відправляємо на Python API
    // Важливо: відправляємо поле "message", бо Python чекає MessageRequest(message: str)
    const pythonResponse = await fetch(`${PYTHON_API_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: fullMessage }),
    });

    const data = await pythonResponse.json().catch(() => null);

    if (!pythonResponse.ok) {
      console.error('Python API Error:', data);
      return res.status(502).json({ error: 'Python API error', details: data });
    }

    // 4. Повертаємо відповідь фронтенду
    return res.json({ answer: data?.answer ?? '' });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Node Server running on http://localhost:${PORT}`);
});