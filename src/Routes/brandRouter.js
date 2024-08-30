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
  getBrand,
  getAllBrands,
  updateBrand,
  deleteBrand,
  addBrand,
  getAllBrandsByUser,
} = require("../controllers/brandController");
const { uploadImageToDb } = require("../controllers/utilControllers");

const router = express.Router();
const upload = multer({ storage: STORAGE });

router.get("/all", getAllBrands);
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
  addBrand
);
router.put(
  "/update",
  authorizeUser,
  verificationMiddleWare,
  authorizeAdmin,
  updateBrand
);
router.delete(
  "/delete",
  authorizeUser,
  verificationMiddleWare,
  authorizeAdmin,
  deleteBrand
);

router.get(
  "/filterAll",
  authorizeUser,
  verificationMiddleWare,
  authorizeAdmin,
  getAllBrandsByUser
);

router.get(
  "/:brand_id",
  authorizeUser,
  verificationMiddleWare,
  authorizeAdmin,
  getBrand
);

module.exports = router;
