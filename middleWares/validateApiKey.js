
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
exports.validateApiKey = () => {

    return async (req, res, next) => {
        const apiKey = req.headers["api_key"];
        if (validApiKeys.includes(apiKey)) {
            console.log("validateApiKey || apiKey allowed : ", apiKey);
            next();
        } else {
            console.log("validateApiKey || apiKey denied request header is : ", req);
            res.status(401).json({ error: "Unauthorized" });
        }
    };


    
};

