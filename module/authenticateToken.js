const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const token = req.cookies.jwt; // Assuming the JWT token is stored in a cookie named 'jwt'
    console.log("authenticateToken || start-t", token);

    if (!token) {
        return res.sendStatus(401); // Unauthorized if the token is not present
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403); // Forbidden if the token is invalid or expired
        }

        // Token is valid, store the user data in the request object for future use
        req.user = user;
        next();
    });
};

module.exports = authenticateToken;
