const express = require('express')
const { runStats } = require('./script');

const app = express();
app.use(express.json());
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
app.listen(3000, () => console.log('Listening on port 3000'));