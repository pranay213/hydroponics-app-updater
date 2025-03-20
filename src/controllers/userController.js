require("dotenv").config();
const validator = require("validator");
const UserModel = require("../db/models/userModel");
const VerificationEmailModel = require("../db/models/verificationEmailModel");
const {
  generateOtp,
  makeHashText,
  sendMail,
  preCheckValidations,
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

const registerUser = async (req, res) => {
  try {
    const { email, password, confirm_password, name, user_id, image } =
      req.body;
    const response = await preCheckValidations({
      email,
      password,
      confirm_password,
      name,
      role: ALLOWED_ROLES[2],
      res,
      user_id,
      reg_type: REG_TYPES[1],
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
        role: ALLOWED_ROLES[2],
        user_id,
        image: image ? image : "DUMMY_PROFILE_LOGO.png",
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

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.toString().trim() || !password?.toString().trim()) {
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
        reg_type: REG_TYPES[1],
      });
    } else {
      await loginUserFunction({
        res,
        password,
        email,
        type: "email",
        reg_type: REG_TYPES[1],
      });
    }
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userDetails } = req.user;

    const findUser = await UserModel.findOne({ user_id: userDetails?.user_id });

    if (!findUser) {
      return res.status(400).send({ message: "User Not Exist" });
    }
    const checkUserIsVerified = findUser?.verified;
    if (!checkUserIsVerified) {
      return res
        .status(400)
        .send({ status: false, message: "User is Not Verified or Not Valid" });
    }
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

//forget password controlls
const forgetPasswordUser = async (req, res) => {
  try {
    const { email } = req.body;
    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .send({ status: false, message: "Please Enter A Valid Email" });
    }
    const checkUserExist = await UserModel.findOne({ email });

    if (
      !checkUserExist ||
      checkUserExist?.role === ALLOWED_ROLES[0] ||
      checkUserExist?.role === ALLOWED_ROLES[1]
    ) {
      return res
        .status(400)
        .send({ status: false, message: "User Not Found with Entered Email" });
    }
    await forgetPasswordFunc({ res, checkUserExist });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const verifyOtpForgetPasswordUser = async (req, res) => {
  try {
    const { user_id, otp } = req.body;
    const checkUserExist = await UserModel.findOne({ _id: user_id });
    if (
      !checkUserExist ||
      checkUserExist?.role === ALLOWED_ROLES[0] ||
      checkUserExist?.role === ALLOWED_ROLES[1]
    ) {
      return res
        .status(400)
        .send({ status: false, message: "User Not Found with Entered Email" });
    }
    await verifyOtpForgetPasswordFunc({ res, checkUserExist, otp });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const forgetUpdatePasswordUser = async (req, res) => {
  try {
    const { password, confirm_password, user_id } = req.body;
    const findUserDetails = await UserModel.findOne({ _id: user_id });
    if (
      !findUserDetails ||
      findUserDetails?.role === ALLOWED_ROLES[0] ||
      findUserDetails?.role === ALLOWED_ROLES[1]
    ) {
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

const forgetResendOtpUser = async (req, res) => {
  try {
    const { user_id } = req.body;
    const checkUserExist = await UserModel.findOne({ _id: user_id });
    if (
      !checkUserExist ||
      checkUserExist?.role === ALLOWED_ROLES[0] ||
      checkUserExist?.role === ALLOWED_ROLES[1]
    ) {
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
  registerUser,
  loginUser,
  deleteUser,
  forgetPasswordUser,
  verifyOtpForgetPasswordUser,
  forgetUpdatePasswordUser,
  forgetResendOtpUser,
};
