const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const app = express();
app.use(bodyParser.json());
app.use(cors());

const teams = [];
const leaderboard = {};
const submissions = {};

const upload = multer({ dest: 'uploads/' });

// Registration endpoint (accepts payment file upload)
app.post('/api/register', upload.single('paymentProof'), (req, res) => {
  const { teamName, leader, members, college, email } = req.body;
  if (teams.find(t => t.teamName === teamName)) {
    return res.status(400).json({ status: 'fail', reason: 'Team already exists' });
  }
  const paymentProof = req.file ? req.file.filename : null;
  teams.push({ teamName, leader, members: members.split(','), college, email, paymentProof });
  leaderboard[teamName] = 0;
  res.json({ status: 'registered', teamName });
});

// Get all teams
app.get('/api/teams', (req, res) => {
  res.json(teams);
});

// Submit solutions for rounds
app.post('/api/submit', (req, res) => {
  const { teamName, round, solution } = req.body;
  if (!leaderboard[teamName]) {
    return res.status(404).json({ status: 'fail', reason: 'Team not found' });
  }
  if (!submissions[teamName]) submissions[teamName] = {};
  submissions[teamName][round] = solution;
  leaderboard[teamName] += 10;  // Demo scoring logic
  res.json({ status: 'submitted', teamName, round });
});

// Leaderboard API
app.get('/api/leaderboard', (req, res) => {
  const sorted = Object.entries(leaderboard)
    .map(([team, score]) => ({ team, score }))
    .sort((a, b) => b.score - a.score);
  res.json(sorted);
});

app.listen(3000, () => console.log('Hackathon backend running on port 3000'));
