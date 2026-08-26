const jwt = require("jsonwebtoken");

function verifyAdmin(req,res,next){

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

        if(decoded.role !== "admin"){

            return res.status(403).json({
                message:"Admin only"
            });

        }

        next();

    }catch(err){

        return res.status(401).json({
            message:"Invalid token"
        });

    }
}

module.exports = verifyAdmin;