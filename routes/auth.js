const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();

module.exports = (db) => {

  router.post("/signup", async (req,res)=>{

    try{

      const {name,email,password} = req.body;

      if(!name || !email || !password){
        return res.status(400).json({
          message:"All fields are required"
        });
      }

      const hashedPassword =
        await bcrypt.hash(password,10);

      const sql =
      `INSERT INTO users(name,email,password)
       VALUES(?,?,?)`;

      db.query(
        sql,
        [name,email,hashedPassword],
        (err,result)=>{

          if(err){
            return res.status(400).json({
              message:"User already exists",
              error:err
            });
          }

          res.json({
            message:"Signup successful"
          });

        }
      );

    }catch(err){

      res.status(500).json({
        message:"Server error"
      });

    }

  });
router.post("/login",(req,res)=>{

    const {email,password} = req.body;

    const sql =
        "SELECT * FROM users WHERE email=?";

    db.query(
        sql,
        [email],
        async (err,result)=>{

            if(err){
                return res.status(500).json(err);
            }

            if(result.length === 0){
                return res.status(401).json({
                    message:"User not found"
                });
            }

            const user = result[0];

            const match =
                await bcrypt.compare(
                    password,
                    user.password
                );

            if(!match){
                return res.status(401).json({
                    message:"Invalid password"
                });
            }

            db.query(
    "SELECT status FROM teams WHERE email=?",
    [user.email],
    (err, teamResult) => {

        if (err) {
            return res.status(500).json(err);
        }

        // Skip approval check for admins
        if (user.role !== "admin") {

            if (teamResult.length === 0) {
                return res.status(404).json({
                    message: "No team registered."
                });
            }

            if (teamResult[0].status !== "approved") {
                return res.status(403).json({
                    message: "Your team registration is pending admin approval."
                });
            }
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "24h"
            }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    }
);

        }
    );

});
router.get("/profile",(req,res)=>{

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
          "SELECT id,name,email,role FROM users WHERE id=?",
          [decoded.id],
          (err,result)=>{

              if(err){
                  return res.status(500).json(err);
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
  return router;
};