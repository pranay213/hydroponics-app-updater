const express = require("express");
const multer = require("multer");
const {
  registerShopOrAdmin,
  loginShopAdmin,
  forgetPasswordShopAdmin,
  verifyOtpForgetPasswordShopAdmin,
  forgetResendOtpShopAdmin,
  forgetUpdatePasswordShopAdmin,
} = require("../controllers/shopAdminController");
const {
  authorizeUser,
  verificationMiddleWare,
  STORAGE,
  checkImageUploadType,
  IMAGE_UPLOAD_TYPES,
} = require("../utils/constants");
const {
  updateUserDetails,
  verifyOtpDetails,
  sendOtpDetails,
  uploadImageToDb,
} = require("../controllers/utilControllers");

const router = express.Router();
const upload = multer({ storage: STORAGE });

router.post("/register", registerShopOrAdmin);
router.post("/login", loginShopAdmin);
router.post("/verify-otp", verifyOtpDetails);
router.post("/send-otp", sendOtpDetails);
router.put("/update", authorizeUser, verificationMiddleWare, updateUserDetails);
router.post(
  "/upload_image",
  upload.single("image"),
  authorizeUser,
  verificationMiddleWare,
  checkImageUploadType({ imageType: IMAGE_UPLOAD_TYPES.user }),
  uploadImageToDb
);
//forget password
router.post("/forget-password", forgetPasswordShopAdmin);
router.post("/verify-forget-password-otp", verifyOtpForgetPasswordShopAdmin);
router.post("/forget-resend-otp", forgetResendOtpShopAdmin);
router.post("/update-password", forgetUpdatePasswordShopAdmin);
module.exports = router;
