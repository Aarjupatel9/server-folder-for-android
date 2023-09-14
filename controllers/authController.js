
const loginModel = require("../mongodbModels/loginInfo");
const userModel = require("../mongodbModels/userInfo");
const massegesModel = require("../mongodbModels/masseges");
const otpModel = require("../mongodbModels/otpModel");

const encrypt = require("../module/vigenere_enc.js");
const decrypt = require("../module/vigenere_dec.js");

const jwt = require("jsonwebtoken");


exports.loginForWeb= async (req, res) => {
    console.log("loginForWeb || start-b", req.body.credential);
    const credential = req.body.credential;

    if (credential.web) {
        var result = await loginModel.findOne({ Number: credential.number });
        if (result) {
            if (result.Password == encrypt(credential.password)) {
                var _id = result._id;
                const token = jwt.sign({ _id }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES_IN,
                });
                // console.log("The token is: " + token);
                const cookieOptions = {
                    expires: new Date(
                        Date.now() +
                        process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                    ),
                    httpOnly: true,
                    sameSite: "none",
                    secure: true,
                };
                const result1 = await userModel.findOne({ _id: result._id }, { about: 1, ProfileImageVersion: 1, displayName: 1 });// ProfileImage: 1,
                console.log("loginForWeb || result : ", result);
                console.log("loginForWeb || result1 : ", result1.about);

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
                res.cookie("jwt", token, cookieOptions);
                console.log()
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