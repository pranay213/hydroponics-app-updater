const express = require("express");
const {
  registerUser,
  loginUser,
  updateUser,
  loginAsGuest,
  deleteUser,
  verifyUserOtp,
  sendUserOtp,
} = require("../controllers/userController");
const { authorizeUser, verificationMiddleWare } = require("../utils/constants");
const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-otp", verifyUserOtp);
router.post("/send-otp", sendUserOtp);
router.post("/login", loginUser);
router.post("/guest-login", loginAsGuest);
router.put("/update-user", authorizeUser, verificationMiddleWare, updateUser);
router.delete("/delete", authorizeUser, deleteUser);

module.exports = router;
