const express = require("express");
const {
  registerUser,
  loginUser,
  forgetPasswordUser,
  verifyOtpForgetPasswordUser,
  forgetUpdatePasswordUser,
  forgetResendOtpUser,
} = require("../controllers/userController");

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
const multer = require("multer");
const router = express.Router();
const upload = multer({ storage: STORAGE });

router.post("/register", registerUser);
router.post("/verify-otp", verifyOtpDetails);
router.post("/send-otp", sendOtpDetails);
router.post("/login", loginUser);
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
router.post("/forget-password", forgetPasswordUser);
router.post("/verify-forget-password-otp", verifyOtpForgetPasswordUser);
router.post("/update-password", forgetUpdatePasswordUser);
router.post("/forget-resend-otp", forgetResendOtpUser);

module.exports = router;
