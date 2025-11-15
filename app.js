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

// Round-based scoring
const roundScores = {
  1: 5,
  2: 10,
  3: 20
};

// Registration endpoint (with payment screenshot upload)
app.post('/api/register', upload.single('paymentProof'), (req, res) => {
  const { teamName, leader, members, college, email } = req.body;

  if (teams.find(t => t.teamName === teamName)) {
    return res.status(400).json({ status: 'fail', reason: 'Team already exists' });
  }

  const paymentProof = req.file ? req.file.filename : null;

  teams.push({
    teamName,
    leader,
    members: members.split(','),
    college,
    email,
    paymentProof
  });

  leaderboard[teamName] = 0; // initialize score

  res.json({ status: 'registered', teamName });
});

// Get all teams
app.get('/api/teams', (req, res) => {
  res.json(teams);
});

// Submit solutions for rounds
app.post('/api/submit', (req, res) => {
  const { teamName, round, solution } = req.body;

  // Correct check for team exist
  if (!(teamName in leaderboard)) {
    return res.status(404).json({ status: 'fail', reason: 'Team not found' });
  }

  // Save submission
  if (!submissions[teamName]) submissions[teamName] = {};
  submissions[teamName][round] = solution;

  // Scoring logic (5, 10, 20)
  const scoreToAdd = roundScores[round] || 0;
  leaderboard[teamName] += scoreToAdd;

  res.json({
    status: 'submitted',
    teamName,
    round,
    addedScore: scoreToAdd,
    totalScore: leaderboard[teamName]
  });
});

// Leaderboard API
app.get('/api/leaderboard', (req, res) => {
  const sorted = Object.entries(leaderboard)
    .map(([team, score]) => ({ team, score }))
    .sort((a, b) => b.score - a.score);

  res.json(sorted);
});

app.listen(3000, () =>
  console.log('Hackathon backend running on port 3000')
);

