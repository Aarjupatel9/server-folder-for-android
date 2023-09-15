const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });

const loginModel = require("../mongodbModels/loginInfo");
const { verifyJWTToken } = require('./JWTservice');


var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/../logFiles/validateApiKey_debug.log', { flags: 'w' });
var log_stdout = process.stdout;

console.log = function (d) { //
    log_file.write(util.format(d) + '\n');
    log_stdout.write(util.format(d) + '\n');
};

const validApiKeys = [];
validApiKeys.push(process.env.API_SERVER_API_KEY);
// exports.validateApiKey = () => {

//     return async (req, res, next) => {
//         const apiKey = req.headers["api_key"];
//         if (validApiKeys.includes(apiKey)) {
//             console.log("validateApiKey || apiKey allowed : ", apiKey);
//             next();
//         } else {
//             console.log("validateApiKey || apiKey denied request header is : ", req);
//             res.status(401).json({ error: "Unauthorized" });
//         }
//     };
// };
module.exports = (authorizedRoles) => {
    return async (req, res, next) => {
        const token = req.cookies.token;
        if (!token) {
            return res
                .status(401)
                .json({ success: false, message: "TokenExpiredError", specialMessage: "Not Authorized. Token not found !!!" });
        }
        try {
            const { _id } = verifyJWTToken(token);
            try {
                const user = await loginModel.findById(_id);
                if (!user) {
                    return res
                        .status(401)
                        .json({ success: false, message: "TokenExpiredError", specialMessage: "User not found." });
                }

                req.user = user;
                next();
            } catch (error) {
                console.log(error);
                return res
                    .status(401)
                    .json({ success: false, message: "Internal server error" });
            }
        } catch (error) {
            console.log(error);
            if (error.name == "TokenExpiredError") {
                return res.clearCookie("token")
                    .status(401)
                    .json({ success: false, message: error.name });

            } else {
                return res
                    .status(401)
                    .json({ success: false, message: error.name });
            }
        }
    };
};

