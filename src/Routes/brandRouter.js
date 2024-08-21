const express = require("express");

const {
  authorizeUser,
  verificationMiddleWare,
  authorizeAdmin,
} = require("../utils/constants");
const {
  getBrand,
  getAllBrands,
  updateBrand,
  deleteBrand,
  addBrand,
  getAllBrandsByUser,
} = require("../controllers/brandController");

const router = express.Router();

router.get("/all", getAllBrands);
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
