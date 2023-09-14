const loginModel = require("../mongodbModels/loginInfo");
const userModel = require("../mongodbModels/userInfo");
const massegesModel = require("../mongodbModels/masseges");
const otpModel = require("../mongodbModels/otpModel");


const encrypt = require("../module/vigenere_enc.js");
const decrypt = require("../module/vigenere_dec.js");

exports.getContactsList = async (req, res) => {//authenticateToken,
    try {
        const id = req.body.id;
        console.log("getContactsList || start-b", id);
        const result = await userModel.findOne({ _id: id }, { Contacts: 1 }).populate({ path: "Contacts._id", select: "ProfileImageVersion " });
        // const result = await userModel.findOne({ _id: ObjectId(id) }, { Contacts: 1 }).populate('Contacts._id');
        console.log("contacts : ", result.Contacts);
        res.send({ status: 1, contacts: result.Contacts });
    } catch (e) {
        console.log("error : ", e);
        res.send({ status: 0 });
    }
}

exports.getContactsMasseges = async (req, res) => {//authenticateToken,
    const id = req.body.id;
    const contacts = req.body.contacts;

    if (!contacts || contacts == null) {
        res.send({ status: 0 });
    }

    console.log("/getContactsMasseges || start-b", id, " , contacts l : ", contacts.length);

    var contactsMasseges = {};
    for (const contact of contacts) {
        const result = await massegesModel.findOne({
            $or: [
                {
                    user1: id,
                    user2: contact._id,
                },
                {
                    user1: contact._id,
                    user2: id,
                },
            ],
        }, { massegeHolder: 1 });
        if (result) {
            contactsMasseges[contact._id] = result.massegeHolder;
            // console.log("/getContactsMasseges || contactsMasseges of contact : ", contact._id, " , l : ", result.massegeHolder.length);
        } else {
            // console.log("/getContactsMasseges || contactsMasseges can not be found for contact : ", contact._id);
        }
    }

    // console.log("/getContactsMasseges || contactsMasseges : ", contactsMasseges);
    // console.log("/getContactsMasseges || contactsMasseges : ", contactsMasseges.length);
    res.send({ status: 1, masseges: contactsMasseges });


};