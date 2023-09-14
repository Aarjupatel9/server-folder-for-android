const loginModel = require("../mongodbModels/loginInfo");
const userModel = require("../mongodbModels/userInfo");
const massegesModel = require("../mongodbModels/masseges");
const otpModel = require("../mongodbModels/otpModel");


exports.getContactsList = async (req, res) => {//authenticateToken,
    try {
        const id = req.body.id;
        console.log("getContactsList || start-b", id);
        const result = await userModel.findOne({ _id: ObjectId(id) }, { Contacts: 1 }).populate({ path: "Contacts._id", select: "ProfileImageVersion " });
        // const result = await userModel.findOne({ _id: ObjectId(id) }, { Contacts: 1 }).populate('Contacts._id');
        console.log("contacts : ", result.Contacts);
        res.send({ status: 1, contacts: result.Contacts });
    } catch (e) {
        console.log("error : ", e);
        res.send({ status: 0 });
    }
}