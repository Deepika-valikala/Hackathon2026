const express = require('express');
const cors = require('cors');
const teamsRoute = require('./routes/teams');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/teams', teamsRoute);

app.get("/", (req, res) => {
    res.send("Hackathon Backend Running...");
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});
