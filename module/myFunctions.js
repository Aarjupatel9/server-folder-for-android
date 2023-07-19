

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

// const otp = generateOTP();
// console.log(otp); // Output: e.g., 123456

function sendOtp(email) {
    return new Promise(function (resolve, reject) {
        const otp = generateOTP();
        console.log("credecial : ", process.env.OFFICIAL_EMAIL_ID, " , ", process.env.OFFICIAL_EMAIL_ID_PASS)
        var transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.OFFICIAL_EMAIL_ID,
                pass: process.env.OFFICIAL_EMAIL_ID_PASS,
            },
        });


        var mailOptions = {
            from: "travelagency3111@gmail.com",
            to: `${email}`,
            subject: "Recovery email",
            html: `hello, your email address is added to a massenger account , your opt for verify the Email is  <h2>  ${otp}</h2>  <br><br><br><br><hr>  if you are not aware of this action then dont worry, we will keep you secure`,

        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                reject(error);
            } else {
                console.log("Email sent : " + info.response);
                console.log("enter in send email section , email is in progress");
                resolve(otp);
            }
        });


    })
}

module.exports = sendOtp;
