const bcrypt = require("bcryptjs");
require("dotenv").config();
const createAuthRoutes =
require("./routes/auth");
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const multer = require("multer");
const bodyParser = require("body-parser");
const verifyAdmin =
require("./middleware/auth");
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use("/uploads", express.static("uploads"));

// Upload screenshots
const upload = multer({ dest: "uploads/" });

// MySQL Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) console.log("DB Error:", err);
    else console.log("MySQL Connected");
});
const authRoutes =
createAuthRoutes(db);

app.use(
    "/api/auth",
    authRoutes
);

// ---------- ROUND SCORES ----------
const roundScores = { 1: 5, 2: 10, 3: 20 };


// ====================================================
// 1️⃣ REGISTER TEAM → stored as pending
// ====================================================
app.post("/api/register", upload.single("paymentProof"), async (req, res) => {

    const {
    teamName,
    leader,
    members,
    college,
    email,
    password
} = req.body;
    const paymentProof = req.file ? req.file.filename : null;
    const hashedPassword =
    await bcrypt.hash(password,10);
    // Validate required fields
    if (!teamName || !leader || !members || !college || !email) {
        return res.status(400).json({
            status: "fail",
            message: "All fields are required."
        });
    }

    // Check for duplicate team name or email
    db.query(
        "SELECT teamName, email FROM teams WHERE teamName=? OR email=?",
        [teamName, email],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    status: "fail",
                    message: "Database error"
                });
            }

            if (result.length > 0) {

                if (result[0].teamName === teamName) {
                    return res.status(400).json({
                        status: "fail",
                        message: "Team name already exists."
                    });
                }

                if (result[0].email === email) {
                    return res.status(400).json({
                        status: "fail",
                        message: "Email is already registered."
                    });
                }
            }
db.query(
    `INSERT INTO users(name,email,password,role)
     VALUES(?,?,?,?)`,
    [
        leader,
        email,
        hashedPassword,
        "participant"
    ],
    (err) => {

        if (err) {
            return res.status(500).json(err);
        }

        db.query(
                `INSERT INTO teams
                (teamName, leader, members, college, email, paymentProof, status)
                VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
                [teamName, leader, members, college, email, paymentProof],
                (err) => {

                    if (err) {
                        return res.status(500).json({
                            status: "fail",
                            message: "Unable to register team."
                        });
                    }

                    res.status(201).json({
                        status: "success",
                        message: "Registration submitted successfully. Waiting for admin approval."
                    });

                }
            );

    }
);
            

        }
    );

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
app.post(
  "/api/approve",
  verifyAdmin,
  (req,res) => {
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

    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "No token"
        });
    }

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const { round, solution } = req.body;

        db.query(
            "SELECT teamName, status FROM teams WHERE email=?",
            [decoded.email],
            (err, result) => {

                if (err)
                    return res.status(500).json(err);

                if (result.length === 0) {
                    return res.status(404).json({
                        message: "Team not found"
                    });
                }

                const team = result[0];

                if (team.status !== "approved") {
                    return res.status(403).json({
                        message: "Team is not approved yet"
                    });
                }

                const teamName = team.teamName;

                db.query(
                    "INSERT INTO submissions (teamName, roundNumber, solution) VALUES (?, ?, ?)",
                    [teamName, round, solution],
                    (err2) => {

                        if (err2)
                            return res.status(500).json(err2);

                        const points = roundScores[round] || 0;

                        db.query(
                            "UPDATE teams SET score = score + ? WHERE teamName=?",
                            [points, teamName],
                            (err3) => {

                                if (err3)
                                    return res.status(500).json(err3);

                                res.json({
                                    status: "submitted",
                                    teamName,
                                    round,
                                    addedScore: points,
                                    message: "Solution submitted successfully."
                                });

                            }
                        );

                    }
                );

            }
        );

    } catch (err) {

        res.status(401).json({
            message: "Invalid token"
        });

    }

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
const jwt = require("jsonwebtoken");

app.get("/api/my-team", (req,res)=>{

    const token =
      req.headers.authorization?.split(" ")[1];

    if(!token){
        return res.status(401).json({
            message:"No token"
        });
    }

    try{

        const decoded =
          jwt.verify(
            token,
            process.env.JWT_SECRET
          );

        db.query(
          "SELECT * FROM teams WHERE email=?",
          [decoded.email],
          (err,result)=>{

              if(err){
                  return res.status(500).json(err);
              }

              if(result.length===0){
                  return res.json({
                      message:"No team found"
                  });
              }

              res.json(result[0]);

          }
        );

    }catch(err){

        res.status(401).json({
            message:"Invalid token"
        });

    }

});
app.get("/api/my-submissions", (req,res)=>{

    const token =
      req.headers.authorization?.split(" ")[1];

    if(!token){
        return res.status(401).json({
            message:"No token"
        });
    }

    try{

        const decoded =
          jwt.verify(
            token,
            process.env.JWT_SECRET
          );

        db.query(
          "SELECT teamName FROM teams WHERE email=?",
          [decoded.email],
          (err,teamResult)=>{

              if(err){
                  return res.status(500).json(err);
              }

              if(teamResult.length===0){
                  return res.json([]);
              }

              const teamName =
                teamResult[0].teamName;

              db.query(
                "SELECT * FROM submissions WHERE teamName=? ORDER BY id DESC",
                [teamName],
                (err2,submissions)=>{

                    if(err2){
                        return res.status(500).json(err2);
                    }

                    res.json(submissions);

                }
              );

          }
        );

    }catch(err){

        res.status(401).json({
            message:"Invalid token"
        });

    }

});
app.get("/api/admin/analytics", verifyAdmin, (req, res) => {

    db.query(
        `SELECT
            COUNT(*) AS totalTeams,
            SUM(status='approved') AS approvedTeams,
            SUM(status='pending') AS pendingTeams
         FROM teams`,
        (err, teamResult) => {

            if (err) {
                return res.status(500).json(err);
            }

            db.query(
                "SELECT COUNT(*) AS totalSubmissions FROM submissions",
                (err2, submissionResult) => {

                    if (err2) {
                        return res.status(500).json(err2);
                    }

                    res.json({
                        totalTeams: teamResult[0].totalTeams,
                        approvedTeams: teamResult[0].approvedTeams || 0,
                        pendingTeams: teamResult[0].pendingTeams || 0,
                        totalSubmissions: submissionResult[0].totalSubmissions
                    });

                }
            );

        }
    );

});
app.get("/api/admin/pending-teams", verifyAdmin, (req,res)=>{

    db.query(
      "SELECT * FROM teams WHERE status='pending'",
      (err,results)=>{

          if(err){
              return res.status(500).json(err);
          }

          res.json(results);

      }
    );

});

// ====================================================
// 🚀 START SERVER
// ====================================================
app.listen(3000, () => console.log("Backend running on port 3000"));

