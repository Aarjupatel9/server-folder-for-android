const dotenv = require("dotenv");
dotenv.config({ path: "../.env" });
const jwt = require("jsonwebtoken");

const JWT_SEC = process.env.JWT_SECRET;
const JWT_EXP = process.env.JWT_SECRET_EXPIRE;
const JWT_SECRET_EXPIRE = process.env.JWT_SECRET_EXPIRE;

const genJWTToken = (payload, type = null) => {

    try {
        const token = jwt.sign(
            payload,
            JWT_SEC,
            {
                expiresIn: type ? JWT_SECRET_EXPIRE : JWT_EXP
            });

        return token;
    } catch (error) {
        console.log(error);
        throw new Error("Error generating JWT token");
    }

}

const verifyJWTToken = (token) => {
    try {
        const payload = jwt.verify(token, JWT_SEC);
        return payload;
    } catch (error) {
        throw error;
    }
}

module.exports = { genJWTToken, verifyJWTToken };