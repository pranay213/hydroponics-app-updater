const validator = require("validator");
const VerificationEmailModel = require("../db/models/verificationEmailModel");
const UserModel = require("../db/models/userModel");
const {
  generateOtp,
  sendMail,
  preCheckValidations,
  makeHashText,
  REG_TYPES,
  loginUserFunction,
  ALLOWED_ROLES,
} = require("../utils/constants");

const {
  forgetPasswordFunc,
  verifyOtpForgetPasswordFunc,
  forgetUpdatePasswordFunc,
  forgetResendOtpFunc,
} = require("./utilControllers");

const registerShopOrAdmin = async (req, res) => {
  try {
    const {
      email,
      password,
      confirm_password,
      name,
      role,
      user_id,
      image,
      contact_email,
      contact_mobile_number,
    } = req.body;
    const response = await preCheckValidations({
      email,
      password,
      confirm_password,
      name,
      role,
      res,
      user_id,
      reg_type: REG_TYPES[0],
    });
    if (response === true) {
      //generating otp
      const otp = generateOtp();

      // hashing otp and password
      const hashedPassword = await makeHashText(password);
      const hashedOtp = await makeHashText(otp);

      const user = new UserModel({
        name,
        email,
        password: hashedPassword,
        role,
        user_id,
        image: image ? image : "DUMMY_PROFILE_LOGO.png",
        contact: {
          email: contact_email ? contact_email : email,
          mobile_number: contact_mobile_number ? contact_mobile_number : "",
        },
      });

      const verificationOtp = new VerificationEmailModel({
        user_id: user?._id,
        otp: hashedOtp,
      });

      const userDetails = await user.save();
      await verificationOtp.save();
      await sendMail(userDetails?.email, otp, userDetails?.name);

      const sendUserDetails = {
        id: userDetails?._id,
        name: userDetails?.name,
        verified: userDetails?.verified,
      };
      res.status(201).send({
        status: true,
        message: "OTP sent Successfully",
        data: {
          userDetails: sendUserDetails,
        },
      });
    }
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const loginShopAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.toString()?.trim() || !password?.toString()?.trim()) {
      return res
        .status(400)
        .send({ status: false, message: "Fieds Should Not Be Empty" });
    }
    if (!validator.isEmail(email)) {
      await loginUserFunction({
        res,
        password,
        email,
        type: "user_id",
        reg_type: REG_TYPES[0],
      });
    } else {
      await loginUserFunction({
        res,
        password,
        email,
        type: "email",
        reg_type: REG_TYPES[0],
      });
    }
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

//forget password controlls
const forgetPasswordShopAdmin = async (req, res) => {
  try {
    const { email } = req.body;
    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .send({ status: false, message: "Please Enter A Valid Email" });
    }
    const checkUserExist = await UserModel.findOne({ email });

    if (!checkUserExist || checkUserExist?.role === ALLOWED_ROLES[2]) {
      return res
        .status(400)
        .send({ status: false, message: "User Not Found with Entered Email" });
    }
    await forgetPasswordFunc({ res, checkUserExist });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const verifyOtpForgetPasswordShopAdmin = async (req, res) => {
  try {
    const { user_id, otp } = req.body;
    const checkUserExist = await UserModel.findOne({ _id: user_id });
    if (!checkUserExist || checkUserExist?.role === ALLOWED_ROLES[2]) {
      return res
        .status(400)
        .send({ status: false, message: "User Not Found with Entered Email" });
    }
    await verifyOtpForgetPasswordFunc({ res, checkUserExist, otp });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const forgetUpdatePasswordShopAdmin = async (req, res) => {
  try {
    const { password, confirm_password, user_id } = req.body;
    const findUserDetails = await UserModel.findOne({ _id: user_id });
    if (!findUserDetails || findUserDetails?.role === ALLOWED_ROLES[2]) {
      return res
        .status(400)
        .send({ status: false, message: "User Not Found with Entered Email" });
    }
    await forgetUpdatePasswordFunc({
      res,
      password,
      confirm_password,
      findUserDetails,
    });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const forgetResendOtpShopAdmin = async (req, res) => {
  try {
    const { user_id } = req.body;
    const checkUserExist = await UserModel.findOne({ _id: user_id });
    if (!checkUserExist || checkUserExist?.role === ALLOWED_ROLES[2]) {
      return res
        .status(400)
        .send({ status: false, message: "User Not Found with Entered Email" });
    }
    await forgetResendOtpFunc({
      res,
      checkUserExist,
    });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

module.exports = {
  registerShopOrAdmin,
  loginShopAdmin,
  forgetPasswordShopAdmin,
  verifyOtpForgetPasswordShopAdmin,
  forgetUpdatePasswordShopAdmin,
  forgetResendOtpShopAdmin,
};
