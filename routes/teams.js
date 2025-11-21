const express = require('express');
const multer = require('multer');
const db = require('../db');
const router = express.Router();


// ---------------- FILE UPLOAD SETTINGS ------------------
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) =>
        cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });


// ---------------- TEAM REGISTRATION ---------------------
router.post('/register', upload.single("document"), (req, res) => {

    const { team_name, team_leader_id, member1, member2, member3, member4 } = req.body;

    if (!req.file) {
        return res.json({ success: false, message: "Document upload required" });
    }

    const documentPath = req.file.path;

    const sql = `
        INSERT INTO teams (team_name, team_leader_id, member1, member2, member3, member4, document_path)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [team_name, team_leader_id, member1, member2, member3, member4, documentPath],
        (err) => {
            if (err) {
                console.log(err);
                return res.json({ success: false, message: "Database error" });
            }
            res.json({
                success: true,
                message: "Registration submitted. Approval pending."
            });
        }
    );
});



// ---------------- CHECK TEAM STATUS ---------------------
router.get('/status/:id', (req, res) => {
    const { id } = req.params;

    db.query("SELECT status FROM teams WHERE id = ?", [id], (err, results) => {
        if (err || results.length === 0) {
            return res.json({ success: false, message: "Team not found" });
        }

        const status = results[0].status;

        if (status === "pending") {
            res.json({ message: "Your registration is pending. We will update you soon." });
        } else {
            res.json({ message: "Your registration is approved!" });
        }
    });
});



// ---------------- ADMIN: GET PENDING TEAMS ----------------
router.get('/pending', (req, res) => {
    db.query("SELECT * FROM teams WHERE status = 'pending'", (err, results) => {
        if (err) return res.json({ success: false });

        res.json(results);
    });
});



// ---------------- ADMIN: APPROVE TEAM --------------------
router.post('/approve/:id', (req, res) => {
    const { id } = req.params;

    db.query("UPDATE teams SET status='approved' WHERE id=?", [id], (err) => {
        if (err) return res.json({ success: false });

        res.json({ success: true, message: "Team approved successfully!" });
    });
});


module.exports = router;
