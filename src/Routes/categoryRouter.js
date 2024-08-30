const express = require("express");
const multer = require("multer");

const {
  authorizeUser,
  verificationMiddleWare,
  authorizeAdmin,
  STORAGE,
  checkImageUploadType,
  IMAGE_UPLOAD_TYPES,
} = require("../utils/constants");
const {
  getAllCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getCategory,
  getAllCategoriesByUser,
} = require("../controllers/categoryController");
const { uploadImageToDb } = require("../controllers/utilControllers");

const router = express.Router();
const upload = multer({ storage: STORAGE });

router.get("/all", getAllCategories);
router.post(
  "/upload_image",
  upload.single("image"),
  authorizeUser,
  verificationMiddleWare,
  checkImageUploadType({ imageType: IMAGE_UPLOAD_TYPES.filter }),
  uploadImageToDb
);
router.post(
  "/add",
  authorizeUser,
  verificationMiddleWare,
  authorizeAdmin,
  addCategory
);
router.put(
  "/update",
  authorizeUser,
  verificationMiddleWare,
  authorizeAdmin,
  updateCategory
);
router.delete(
  "/delete",
  authorizeUser,
  verificationMiddleWare,
  authorizeAdmin,
  deleteCategory
);
router.get(
  "/filterAll",
  authorizeUser,
  verificationMiddleWare,
  authorizeAdmin,
  getAllCategoriesByUser
);
router.get(
  "/:category_id",
  authorizeUser,
  verificationMiddleWare,
  authorizeAdmin,
  getCategory
);

module.exports = router;
