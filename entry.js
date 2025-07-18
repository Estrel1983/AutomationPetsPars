const express = require('express')
const { runStats } = require('./script');

require('dotenv').config({ path: __dirname + '/.env' });
console.log('Loaded env in entry.js, DATABASE_URL:', process.env.DATABASE_URL);

const app = express();
const pool = require('./db');
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
});
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});
app.post('/run', async (req, res) => {
  const { username, password, profileUrl } = req.body;

  if (!username || !password || !profileUrl) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    console.log(username, password, profileUrl);
    const result = await runStats(username, password, profileUrl);
    console.log("RESULT EXISTS \n" + JSON.stringify(result, null, 2));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

app.get('/ping', async (req, res) => {
  console.log('Ping handler started');

  try {
    const result = await pool.query('SELECT * FROM "completed-orders" WHERE id=1');
    console.log('Query result:', result.rows);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));