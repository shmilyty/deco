const config = require('./config');
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const treesRoutes = require('./routes/trees');

const app = express();

// --- CORS ---
const corsOptions = config.IS_DEV
  ? { origin: true, credentials: true }
  : {
      origin: config.ALLOWED_ORIGINS.length > 0 ? config.ALLOWED_ORIGINS : false,
      credentials: true,
    };
app.use(cors(corsOptions));

// --- Body parsing ---
app.use(express.json());

// --- Rate limiting ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后再试' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '登录请求过于频繁' },
});

// --- Rewrite /tree/api/* → /api/* so routes work with and without reverse proxy ---
app.use((req, res, next) => {
  if (req.url.startsWith('/tree/api/')) {
    req.url = req.url.slice(5);
  } else if (req.url.startsWith('/tree/uploads/')) {
    req.url = req.url.slice(5);
  }
  next();
});

app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// --- Static files ---
const distPath = path.join(__dirname, '../dist');
app.use('/tree', express.static(distPath));
app.use(express.static(distPath));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/trees', treesRoutes);

// Legacy compatibility redirects
app.get('/api/decorations', (req, res) => res.redirect(307, '/api/trees/legacy/decorations'));
app.post('/api/decorations', (req, res) => res.redirect(307, '/api/trees/legacy/decorations'));

// --- SPA fallback ---
app.get('/tree/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// --- Error handling ---
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('只允许上传图片文件')) {
    return res.status(400).json({ error: err.message });
  }
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || '服务器内部错误' });
});

// --- Start ---
app.listen(config.PORT, () => {
  console.log(`🎄 Backend running at http://localhost:${config.PORT}`);
  console.log(`   Visit: http://localhost:${config.PORT}/tree/`);
  console.log(`🔒 Unlock date: ${config.UNLOCK_DATE.toLocaleString()}`);
  if (config.IS_DEV) {
    console.log('🔧 Dev mode enabled:');
    console.log(`   - Mock login: http://localhost:${config.PORT}/api/auth/dev-login`);
    console.log('   - Turnstile verification: SKIPPED');
  }
});
