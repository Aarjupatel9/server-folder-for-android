const validApiKeys = [];
validApiKeys.push(process.env.API_SERVER_API_KEY);

exports.validateApiKey = (req, res, next) => {
    const apiKey = req.headers["api_key"];
    if (validApiKeys.includes(apiKey)) {
        console.log("validateApiKey || apiKey allowed : ", apiKey);
        next();
    } else {
        console.log("validateApiKey || apiKey denied : ", apiKey);
        res.status(401).json({ error: "Unauthorized" });
    }
};