

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const multer = require("multer");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use("/uploads", express.static("uploads"));

// Upload screenshots
const upload = multer({ dest: "uploads/" });

// MySQL Connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "WJ28@krhps",  // CHANGE
    database: "hackathon"
});

db.connect(err => {
    if (err) console.log("DB Error:", err);
    else console.log("MySQL Connected");
});

// ---------- ROUND SCORES ----------
const roundScores = { 1: 5, 2: 10, 3: 20 };


// ====================================================
// 1️⃣ REGISTER TEAM → stored as pending
// ====================================================
app.post("/api/register", upload.single("paymentProof"), (req, res) => {
    const { teamName, leader, members, college, email } = req.body;

    const paymentProof = req.file ? req.file.filename : null;

    const sql = `INSERT INTO teams 
        (teamName, leader, members, college, email, paymentProof, status) 
        VALUES (?, ?, ?, ?, ?, ?, 'pending')`;

    db.query(sql, [teamName, leader, members, college, email, paymentProof], (err) => {
        if (err) {
            return res.status(400).json({ status: "fail", error: err });
        }

        res.json({
            status: "pending",
            message: "Registration submitted. Waiting for approval."
        });
    });
});


// ====================================================
// 2️⃣ GET ALL TEAMS (both pending + approved)
// ====================================================
app.get("/api/teams", (req, res) => {
    db.query("SELECT * FROM teams", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});


// ====================================================
// 3️⃣ ADMIN → APPROVE TEAM (status changes)
// ====================================================
app.post("/api/approve", (req, res) => {
    const { teamName } = req.body;

    const sql = "UPDATE teams SET status='approved' WHERE teamName=?";

    db.query(sql, [teamName], (err) => {
        if (err) return res.status(500).json(err);

        res.json({ status: "approved", teamName });
    });
});


// ====================================================
// 4️⃣ SUBMIT SOLUTION + ADD SCORE
// ====================================================
app.post("/api/submit", (req, res) => {
    const { teamName, round, solution } = req.body;
    const insertSubmission = "INSERT INTO submissions (teamName, roundNumber, solution) VALUES (?, ?, ?)";
    db.query(insertSubmission, [teamName, round, solution], (err) => {
        if (err) return res.status(500).json({ status: "fail", error: err });
        const points = roundScores[round] || 0;
        const updateScore = "UPDATE teams SET score = score + ? WHERE teamName=? AND status='approved'";
        db.query(updateScore, [points, teamName], (err2) => {
            if (err2) return res.status(500).json({ status: "fail", error: err2 });
            res.json({
                status: "submitted",
                teamName,
                round,
                addedScore: points,
                message: "Solution submitted and score added."
            });
        });
    });
});




// ====================================================
// 5️⃣ LEADERBOARD → only approved teams
// ====================================================
app.get("/api/leaderboard", (req, res) => {
    const sql = "SELECT teamName AS team, score FROM teams WHERE status='approved' ORDER BY score DESC";

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);

        res.json(results);
    });
});


// ====================================================
// 🚀 START SERVER
// ====================================================
app.listen(3000, () => console.log("Backend running on port 3000"));

