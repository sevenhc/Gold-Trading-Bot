const jwt = require("jsonwebtoken");

let refreshTokens = [];

const userSignOut = (req, res, next) => {
    const refreshToken = req.body.token;
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
    res.status(200).json("You logged out successfully.");
}

const refreshToken = (req, res, next) => {    
    const refreshToken = req.body.token;    
    if (!refreshToken) {        
        return res.status(401).json("You are not authenticated!");
    }    
    if (!refreshTokens.includes(refreshToken)) {        
        return res.status(403).json("Refresh token is not valid!");
    }
    jwt.verify(refreshToken, JWT_KEY, (err, user) => {
        if (err) {            
            return res.status(403).json("Refresh token is not valid!");
        }
        refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
        const newAccessToken = generateAccessToken(user.userid);
        const newRefreshToken = generateRefreshToken(user.userid);        
        res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    });
}

const verifyToken = (req, res, next) => {    
    const authHeader = req.headers.token;
    if (authHeader) {
        const token = authHeader.split(" ")[1];
        jwt.verify(token, JWT_KEY, (err, user) => {
            if (err) {                
                return res.status(403).send("Invalid Token.");
            }
            let userid = (req.body.hasOwnProperty("userid")) ? req.body.userid :
                (req.params.hasOwnProperty("userid")) ? req.params.userid : req.query.userid;
           
            if (parseInt(userid) === user.userid) {
                req.user = user;
                next();
            } else {               
                return res.status(403).send("Invalid Tokens.");
            }
        })
    } else {
        return res.status(401).send("You are not authenticated");
    }
}

const generateAccessToken = (userid) => {
    return jwt.sign({ userid: userid }, JWT_KEY, {
        expiresIn: "1h",
    });
};

const generateRefreshToken = (userid) => {
    const refreshToken = jwt.sign({ userid: userid }, JWT_KEY);
    refreshTokens.push(refreshToken);
    return refreshToken;
};

module.exports = { verifyToken, generateAccessToken, generateRefreshToken, refreshToken, userSignOut }