const express = require("express");
const {
  authorizeUser,
  verificationMiddleWare,
  authorizeAdmin,
} = require("../utils/constants");
const {
  addSubcatergory,
  getAllSubCategories,
  deleteSubCategory,
  updateSubCategory,
  getAllSubCategoriesByUser,
} = require("../controllers/subCategoryController");
const router = express.Router();
router.post(
  "/add",
  authorizeUser,
  verificationMiddleWare,
  authorizeAdmin,
  addSubcatergory
);
router.get("/all", authorizeUser, verificationMiddleWare, getAllSubCategories);
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
