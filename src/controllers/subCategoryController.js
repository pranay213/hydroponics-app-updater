const CategoryModel = require("../db/models/categoryModel");
const SubCatergoryModel = require("../db/models/subCatergoryModel");
const { filterActiveList, sendFiltersList } = require("../utils/constants");

const addSubcatergory = async (req, res) => {
  try {
    const { userDetails } = req.user;
    const { name, status, category, brands, image } = req.body;
    if (!name || Object.keys(category)?.length === 0 || brands?.length === 0) {
      return res.status(400).send({
        status: false,
        message: "Name, category, and brands are required fields",
      });
    }
    const brandsIds = brands?.map((eachBrand) => eachBrand?.id);

    const newSubCategory = new SubCatergoryModel({
      name,
      status,
      category: category?.id,
      brands: brandsIds,
      user_id: userDetails?.user_id,
      image: image ? image : "",
    });
    await newSubCategory.save();
    res.status(201).send({
      status: true,
      message: "SubCategory created successfully",
    });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const getAllSubCategories = async (req, res) => {
  try {
    const { limit, page, category } = req.query;
    const skip = (page - 1) * limit;
    const findCategory = await CategoryModel.findOne({
      name: category,
    });

    if (category && !findCategory) {
      return res
        .status(400)
        .send({ status: false, message: "Entered Category Not Exist" });
    }
    if (category) {
      const subCategories = await SubCatergoryModel.find({
        category: findCategory?._id,
      });

      const activeSubCategories = filterActiveList({
        list: subCategories,
        type: "sub-category",
      });
      res.status(200).send({
        status: true,
        message: "Sub Categories Retrieved Successfully",
        data: {
          subCategories: activeSubCategories,
        },
      });
    } else {
      const subCategories = await SubCatergoryModel.find()
        .skip(skip)
        .limit(limit);
      const activeSubCategories = filterActiveList({
        list: subCategories,
        type: "sub-category",
      });
      res.status(200).send({
        status: true,
        message: "Sub Categories Retrieved Successfully",
        data: {
          subCategories: activeSubCategories,
        },
      });
    }
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const getAllSubCategoriesByUser = async (req, res) => {
  try {
    const { userDetails } = req.user;
    const { limit, page } = req.query;
    const skip = (page - 1) * limit;
    const subCategories = await SubCatergoryModel.find({
      user_id: userDetails?.user_id,
    })
      .skip(skip)
      .limit(limit);
    const filterSubCategoriesList = sendFiltersList({
      list: subCategories,
      type: "sub-category",
    });
    res.status(200).send({
      status: true,
      message: "Sub Categories Retrieved Successfully",
      data: {
        subCategories: filterSubCategoriesList,
      },
    });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const deleteSubCategory = async (req, res) => {
  try {
    const { sub_category_id } = req.body;
    if (!sub_category_id) {
      return res
        .status(400)
        .send({ status: false, message: "Sub Category Id Not Found" });
    }
    let subCategory = await SubCatergoryModel.findById({
      _id: sub_category_id,
    });
    if (!subCategory) {
      return res
        .status(400)
        .send({ status: false, message: "Sub Category Not Found" });
    }
    await SubCatergoryModel.findByIdAndDelete({ _id: sub_category_id });
    res
      .status(200)
      .send({ status: true, message: "Sub Category Deleted Successfully" });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const updateSubCategory = async (req, res) => {
  try {
    const { sub_category_id, name, status, category, brands, image } = req.body;

    if (!sub_category_id) {
      return res
        .status(400)
        .send({ status: false, message: "Sub Category Id Not Found" });
    }

    if (!name || Object.keys(category)?.length === 0 || brands?.length === 0) {
      return res
        .status(400)
        .send({ status: false, message: "All Fields are required" });
    }
    const brandsIds = brands?.map((eachBrand) => eachBrand?.id);
    const categoryId = category?.id;

    const findSubCategory = await SubCatergoryModel.findOne({
      _id: sub_category_id,
    });
    if (!findSubCategory) {
      return res
        .status(400)
        .send({ status: false, message: "Sub Category Not Exist" });
    }

    await SubCatergoryModel.findByIdAndUpdate(
      { _id: sub_category_id },
      {
        $set: {
          name,
          status,
          category: categoryId,
          brands: brandsIds,
          image,
        },
      },
      {
        new: true,
      }
    );

    res.status(200).send({
      status: true,
      message: "Sub Category Updated Successfully",
    });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const getSubCategory = async (req, res) => {
  try {
    const { sub_category_id } = req.params;
    if (!sub_category_id) {
      return res
        .status(400)
        .send({ status: false, message: "Brand Id Not Found" });
    }
    const subCategory = await SubCatergoryModel.findById({
      _id: sub_category_id,
    });

    if (!subCategory) {
      return res
        .status(400)
        .send({ status: false, message: "Brand Not Found" });
    }
    res.status(200).send({
      status: true,
      message: "Brand Retrieved Successfully",
      subCategory,
    });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

module.exports = {
  addSubcatergory,
  getAllSubCategories,
  getAllSubCategoriesByUser,
  deleteSubCategory,
  updateSubCategory,
  getSubCategory,
};
