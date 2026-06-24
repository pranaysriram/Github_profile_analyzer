require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const profilesRouter = require('./routes/profiles');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (_req, res) => {
  res.json({
    name: 'GitHub Profile Analyzer',
    endpoints: {
      'POST /api/profiles/analyze': 'body: { username } — fetch & store insights',
      'GET  /api/profiles': 'list all analyzed profiles',
      'GET  /api/profiles/:username': 'get one stored profile',
      'DELETE /api/profiles/:username': 'remove a stored profile',
      'GET  /health': 'health check',
    },
  });
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/profiles', profilesRouter);

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found', path: req.path }));

// error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`GitHub Profile Analyzer running on http://localhost:${port}`);
});
