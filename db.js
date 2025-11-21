const mysql = require('mysql2');

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "WJ28@krhps",
    database: "Hackathon"
});

db.connect((err) => {
    if (err) {
        console.log("MySQL connection error:", err);
    } else {
        console.log("MySQL Connected Successfully!");
    }
});

module.exports = db;
