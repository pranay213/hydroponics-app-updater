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
  addSubcatergory,
  getAllSubCategories,
  deleteSubCategory,
  updateSubCategory,
  getAllSubCategoriesByUser,
} = require("../controllers/subCategoryController");
const { uploadImageToDb } = require("../controllers/utilControllers");
const router = express.Router();
const upload = multer({ storage: STORAGE });

router.post(
  "/add",
  authorizeUser,
  verificationMiddleWare,
  authorizeAdmin,
  addSubcatergory
);
router.post(
  "/upload_image",
  upload.single("image"),
  authorizeUser,
  verificationMiddleWare,
  checkImageUploadType({ imageType: IMAGE_UPLOAD_TYPES.filter }),
  uploadImageToDb
);
router.get("/all", getAllSubCategories);
router.get(
  "/filterAll",
  authorizeUser,
  verificationMiddleWare,
  authorizeAdmin,
  getAllSubCategoriesByUser
);

router.delete(
  "/delete",
  authorizeUser,
  verificationMiddleWare,
  authorizeAdmin,
  deleteSubCategory
);

router.put(
  "/update",
  authorizeUser,
  verificationMiddleWare,
  authorizeAdmin,
  updateSubCategory
);
module.exports = router;
