const express = require("express");

const {
  authorizeUser,
  verificationMiddleWare,
  authorizeSeller,
  STORAGE,
} = require("../utils/constants");
const {
  getAllProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getProduct,
  getAllProductsByUser,
  uploadProductImages,
  deleteImagesFromCloudinary,
} = require("../controllers/productController");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: STORAGE });

router.get("/all", getAllProducts);

router.get(
  "/filterAll",
  authorizeUser,
  verificationMiddleWare,
  authorizeSeller,
  getAllProductsByUser
);
router.post(
  "/upload_product_images",
  upload.array("images"),
  authorizeUser,
  authorizeSeller,
  uploadProductImages
);
router.delete(
  "/delete_product_images",
  authorizeUser,
  authorizeSeller,
  deleteImagesFromCloudinary
);
router.post(
  "/add",
  authorizeUser,
  verificationMiddleWare,
  authorizeSeller,
  addProduct
);
router.put(
  "/update",
  authorizeUser,
  verificationMiddleWare,
  authorizeSeller,
  updateProduct
);
router.delete(
  "/delete",
  authorizeUser,
  verificationMiddleWare,
  authorizeSeller,
  deleteProduct
);
router.get("/:product_id", getProduct);

module.exports = router;
