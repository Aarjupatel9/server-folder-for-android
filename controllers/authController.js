const dotenv = require("dotenv");
dotenv.config({ path: "../.env" });

const loginModel = require("../mongodbModels/loginInfo");
const userModel = require("../mongodbModels/userInfo");
const massegesModel = require("../mongodbModels/masseges");
const otpModel = require("../mongodbModels/otpModel");

const encrypt = require("../module/vigenere_enc.js");
const decrypt = require("../module/vigenere_dec.js");

const jwt = require("jsonwebtoken");
const { genJWTToken } = require("../middleWares/JWTservice");


const cookieOptions = {
    expires: new Date(
        Date.now() +
        process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    sameSite: "none",
    secure: true,
};


exports.loginForWeb= async (req, res) => {
    console.log("loginForWeb || start-b", req.body.credential);
    const credential = req.body.credential;

    if (credential.web) {
        var result = await loginModel.findOne({ Number: credential.number });
        if (result) {
            if (result.Password == encrypt(credential.password)) {


                const payload = {
                    _id: result._id,
                    Number: result.Number
                };

                // Sign token
                const token = genJWTToken(payload);

                console.log("The token is: " + token);
                
                const result1 = await userModel.findOne({ _id: result._id }, { about: 1, ProfileImageVersion: 1, displayName: 1 });// ProfileImage: 1,
                // console.log("loginForWeb || result : ", result);
                // console.log("loginForWeb || result1 : ", result1.about);

                const data = {
                    _id: result._id,
                    number: result.Number,
                    name: result.Name,
                    AccStatus: result.AccStatus,
                    tokenFCM: result.tokenFCM,
                    recoveryEmail: result.RecoveryEmail,
                    about: result1.about,
                    displayName: result1.displayName,
                    profileImageVersion: result1.ProfileImageVersion,
                }
                // console.log("loginForWeb || data : ", data);
                res.cookie("token", token, cookieOptions);
                res.send({ status: 1, data: data, token: token });
            } else {
                res.send({ status: 2 });
            }
        } else {
            res.send({ status: 0 });
        }
    } else {
        res.send({ status: 5 });
    }
};