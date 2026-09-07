require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./backend/config/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Boot: init DB then routes
initDb().then(() => {
  app.use('/api/auth', require('./backend/routes/auth'));
  app.use('/api/societies', require('./backend/routes/societies'));
  app.use('/api/brokers', require('./backend/routes/brokers'));
  app.use('/api/listings', require('./backend/routes/listings'));
  app.use('/api/chat', require('./backend/routes/chat'));
  app.use('/api/housing', require('./backend/routes/housing'));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`\n  ★ Hyderabad Estate VIP Server ★`);
    console.log(`  Running on http://localhost:${PORT}\n`);
  });
}).catch(err => {
  console.error('[BOOT] DB init failed:', err);
  process.exit(1);
});
