const express = require("express");
const {
  registerShopOrAdmin,
  loginShopAdmin,
  forgetPasswordShopAdmin,
  verifyOtpForgetPasswordShopAdmin,
  forgetResendOtpShopAdmin,
  forgetUpdatePasswordShopAdmin,
} = require("../controllers/shopAdminController");
const { authorizeUser, verificationMiddleWare } = require("../utils/constants");
const {
  updateUserDetails,
  verifyOtpDetails,
  sendOtpDetails,
} = require("../controllers/utilControllers");

const router = express.Router();

router.post("/register", registerShopOrAdmin);
router.post("/login", loginShopAdmin);
router.post("/verify-otp", verifyOtpDetails);
router.post("/send-otp", sendOtpDetails);
router.put("/update", authorizeUser, verificationMiddleWare, updateUserDetails);

//forget password
router.post("/forget-password", forgetPasswordShopAdmin);
router.post("/verify-forget-password-otp", verifyOtpForgetPasswordShopAdmin);
router.post("/forget-resend-otp", forgetResendOtpShopAdmin);
router.post("/update-password", forgetUpdatePasswordShopAdmin);
module.exports = router;
