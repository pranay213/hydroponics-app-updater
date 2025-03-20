const express = require("express");
const {
  registerUser,
  loginUser,
  forgetPasswordUser,
  verifyOtpForgetPasswordUser,
  forgetUpdatePasswordUser,
  forgetResendOtpUser,
} = require("../controllers/userController");
const { authorizeUser, verificationMiddleWare } = require("../utils/constants");
const {
  updateUserDetails,
  verifyOtpDetails,
  sendOtpDetails,
} = require("../controllers/utilControllers");
const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-otp", verifyOtpDetails);
router.post("/send-otp", sendOtpDetails);
router.post("/login", loginUser);
router.put("/update", authorizeUser, verificationMiddleWare, updateUserDetails);

//forget password
router.post("/forget-password", forgetPasswordUser);
router.post("/verify-forget-password-otp", verifyOtpForgetPasswordUser);
router.post("/update-password", forgetUpdatePasswordUser);
router.post("/forget-resend-otp", forgetResendOtpUser);

module.exports = router;
