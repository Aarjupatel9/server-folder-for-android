

var nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config({ path: "../.env" });


function generateOTP() {
    const otpLength = 6;
    let otp = '';
    for (let i = 0; i < otpLength; i++) {
        otp += Math.floor(Math.random() * 10); // Generate a random digit (0-9)
    }
    return otp;
}

function sendOtp(OBJ) {
    return new Promise(function (resolve, reject) {
    
        console.log("credecial : ", process.env.OFFICIAL_EMAIL_ID, " , ", process.env.OFFICIAL_EMAIL_ID_PASS, " , email : ", OBJ.email);
        var transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.OFFICIAL_EMAIL_ID,
                pass: process.env.OFFICIAL_EMAIL_ID_PASS,
            },
        });


        var mailOptions = {
            from: "travelagency3111@gmail.com",
            to: OBJ.email,
            subject: OBJ.subject,
            html : OBJ.html
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log("error in transporter: ", error);
                reject(error);
            } else {
                console.log("Email sent : " + info.response);
                resolve(true);
            }
        });

    })
}

module.exports = sendOtp;
