const express = require("express");

const {
  authorizeUser,
  verificationMiddleWare,
  authorizeAdmin,
} = require("../utils/constants");
const {
  getAllCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getCategory,
  getAllCategoriesByUser,
} = require("../controllers/categoryController");

const router = express.Router();

router.get("/all", authorizeUser, verificationMiddleWare, getAllCategories);
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
