require("dotenv").config();
const UserModel = require("../db/models/userModel");
const validator = require("validator");
const VerificationEmailModel = require("../db/models/verificationEmailModel");
const {
  verifyOtpAndPassword,
  makeHashText,
  generateJwtToken,
  sendOtp,
  verifyOtp,
  generateOtp,
  sendMail,
  ALLOWED_ROLES,
} = require("../utils/constants");

const forgetPasswordFunc = async ({ res, checkUserExist }) => {
  try {
    const otp = generateOtp();
    const hashedOtp = await makeHashText(otp);
    const verificationOtp = new VerificationEmailModel({
      user_id: checkUserExist?._id,
      otp: hashedOtp,
    });
    await verificationOtp.save();
    await sendMail(checkUserExist?.email, otp, checkUserExist?.name);

    const sendUserDetails = {
      id: checkUserExist?._id,
      name: checkUserExist?.name,
      verified: checkUserExist?.verified,
    };
    res.status(201).send({
      status: true,
      message: "OTP sent Successfully",
      data: {
        userDetails: sendUserDetails,
      },
    });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const verifyOtpForgetPasswordFunc = async ({ res, checkUserExist, otp }) => {
  try {
    const findUserExistWithOtp = await VerificationEmailModel.findOne({
      user_id: checkUserExist?._id,
    });

    if (!findUserExistWithOtp) {
      return res.status(404).send({
        status: false,
        message: "OTP Expired, Make Another OTP Request",
      });
    }

    const result = await verifyOtpAndPassword(findUserExistWithOtp?.otp, otp);

    if (!result) {
      return res.status(400).send({
        status: false,
        message: "Otp is invalid",
      });
    }

    await VerificationEmailModel.findByIdAndDelete(findUserExistWithOtp?._id);

    const sendDetails = {
      id: checkUserExist?._id,
    };
    res.status(200).send({
      status: true,
      message: "User Verified Successfully, update your password",
      data: {
        userDetails: sendDetails,
      },
    });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const forgetUpdatePasswordFunc = async ({
  res,
  findUserDetails,
  password,
  confirm_password,
}) => {
  try {
    if (password?.toString()?.trim() !== confirm_password?.toString()?.trim()) {
      return res.status(400).send({
        status: false,
        message: "Both Passwords should Match",
      });
    }

    if (!validator.isStrongPassword(password)) {
      return res.status(400).send({
        status: false,
        message:
          "Password Not Meet the criteria, it Must includes(password length 8 or more charaters, 1 uppercase letter, 1 special symbol)",
      });
    }

    const comparePassword = await verifyOtpAndPassword(
      findUserDetails?.password,
      password
    );

    if (comparePassword) {
      return res.status(400).send({
        status: false,
        message: "current password should not same as old password",
      });
    }
    const hashedPassword = await makeHashText(password);

    await UserModel.updateOne(
      { _id: findUserDetails?._id },
      { $set: { password: hashedPassword } }
    );
    res
      .status(200)
      .send({ status: true, message: "Password Updated Successfully" });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const forgetResendOtpFunc = async ({ res, checkUserExist }) => {
  try {
    const findUserExistWithOtp = await VerificationEmailModel.findOne({
      user_id: checkUserExist?._id,
    });

    if (findUserExistWithOtp) {
      return res.status(400).send({
        status: false,
        message:
          "Please wait 5 mins to make another otp Request (Or) Check Ur Recent Otp on Mail",
      });
    }

    const otp = generateOtp();
    const hashedOtp = await makeHashText(otp);
    const verificationOtp = new VerificationEmailModel({
      user_id: checkUserExist?._id,
      otp: hashedOtp,
    });
    await verificationOtp.save();
    await sendMail(checkUserExist?.email, otp, checkUserExist?.name);

    const sendUserDetails = {
      id: checkUserExist?._id,
      name: checkUserExist?.name,
      verified: checkUserExist?.verified,
    };
    res.status(201).send({
      status: true,
      message: "OTP sent Successfully",
      data: {
        userDetails: sendUserDetails,
      },
    });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const updateUserDetails = async (req, res) => {
  try {
    const { userDetails } = req.user;
    const requests = req.body;
    if (Object.keys(requests).length === 0) {
      return res
        .status(400)
        .send({ message: "Update Requests Should not be empty" });
    }

    const checkUserExist = await UserModel.findOne({
      user_id: userDetails?.user_id,
    });

    const result = Object.keys(requests).some((key) => {
      // Skip certain keys
      if (["old_password", "new_password", "is_premium_user"].includes(key)) {
        return false;
      }
      // Check if the property is undefined or null in checkUserExist
      return checkUserExist[key] === undefined || checkUserExist[key] === null;
    });

    if (result) {
      return res.status(400).send({
        message: "Your trying to update the property which not exist",
      });
    }

    if (requests?.user_id && checkUserExist?.user_id !== requests?.user_id) {
      //if req has user id then check logged in user //updating user_id
      const findUserIdAlreadyExist = await UserModel.findOne({
        user_id: requests?.user_id,
      });
      if (findUserIdAlreadyExist) {
        return res.status(400).send({
          message: "Enterd User Id Already Exist ! Please try an new User Id",
        });
      }
    }

    if (requests?.role) {
      if (requests?.role !== checkUserExist?.role) {
        return res
          .status(400)
          .send({ message: "You are not allowed to change the type of user" });
      }
    }

    if (requests?.verified === true || requests?.verified === false) {
      if (requests?.verified !== checkUserExist?.verified) {
        return res
          .status(400)
          .send({ message: "You can verify your account by email validation" });
      }
    }

    if (requests?.old_password && requests?.new_password) {
      //check old password not equal to new pass
      if (requests?.old_password === requests?.new_password) {
        return res.status(400).send({
          message: "Current Password Should not be same as Old Password",
        });
      }

      const checkOldPassword = await verifyOtpAndPassword(
        checkUserExist?.password,
        requests?.old_password
      );

      if (!checkOldPassword) {
        return res
          .status(400)
          .send({ message: "Please Check Your Old Password" });
      }

      if (!validator.isStrongPassword(requests?.new_password)) {
        return res.status(400).send({
          message:
            "Password Not Meet the criteria, it Must includes(password length 8 or more charaters, 1 uppercase letter, 1 special symbol)",
        });
      }
      const hashedPassword = await makeHashText(requests?.new_password);
      delete requests?.old_password, requests?.new_password;

      const req = {
        ...requests,
        password: hashedPassword,
      };
      const updateUser = { ...checkUserExist._doc, ...req }; //getting response in {checkUserExist: {_doc: {userdetails}}}

      const checkAnyChangesMade =
        JSON.stringify(updateUser) !== JSON.stringify(checkUserExist);

      if (checkAnyChangesMade) {
        await UserModel.updateOne(
          { user_id: checkUserExist?.user_id },
          { $set: updateUser },
          { new: true }
        );
        if (checkUserExist?.role === ALLOWED_ROLES[1]) {
          const filter = { seller_id: checkUserExist?.user_id };
          const updateDoc = { seller_id: requests?.user_id };
          await ProductModel.updateMany(filter, updateDoc);
        }
      }
    } else {
      const updateUser = { ...checkUserExist._doc, ...requests }; //getting response in {checkUserExist: {_doc: {userdetails}}}

      const checkAnyChangesMade =
        JSON.stringify(updateUser) !== JSON.stringify(checkUserExist);
      if (checkAnyChangesMade) {
        await UserModel.updateOne(
          { user_id: checkUserExist?.user_id },
          { $set: updateUser },
          { new: true }
        );
        if (checkUserExist?.role === ALLOWED_ROLES[1]) {
          const filter = { "seller.seller_id": checkUserExist?.user_id };
          const updateDoc = { $set: { "seller.seller_id": requests?.user_id } };
          await ProductModel.updateMany(filter, updateDoc);
        }
      }
    }

    const userDetailsAfterUpdate = await UserModel.findOne({
      user_id: requests?.user_id,
    });
    const details = {
      name: userDetailsAfterUpdate?.name,
      user_id: userDetailsAfterUpdate?.user_id,
      role: userDetailsAfterUpdate?.role,
    };
    const token = await generateJwtToken(details);
    const sendDetails = {
      name: userDetailsAfterUpdate?.name,
      user_id: userDetailsAfterUpdate?.user_id,
      role: userDetailsAfterUpdate?.role,
      verified: userDetailsAfterUpdate?.verified,
      image: userDetailsAfterUpdate?.image,
      address: userDetailsAfterUpdate?.address,
      contact: {
        email: userDetailsAfterUpdate?.contact?.email,
        mobile_number: userDetailsAfterUpdate?.contact?.mobile_number,
      },
      jwtToken: token,
    };
    res.status(200).send({
      status: true,
      message: "User Details updated successfully",
      data: {
        userDetails: sendDetails,
      },
    });
  } catch (error) {
    console.log(error.message);
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const verifyOtpDetails = async (req, res) => {
  try {
    const { user_id, otp } = req.body;
    await verifyOtp({
      res,
      user_id,
      otp,
    });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const sendOtpDetails = async (req, res) => {
  try {
    const { user_id } = req.body;
    await sendOtp({ res, user_id });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

module.exports = {
  verifyOtpForgetPasswordFunc,
  forgetUpdatePasswordFunc,
  forgetResendOtpFunc,
  forgetPasswordFunc,
  updateUserDetails,
  verifyOtpDetails,
  sendOtpDetails,
};
