const CategoryModel = require("../db/models/categoryModel");
const { filterActiveList, sendFiltersList } = require("../utils/constants");

const addCategory = async (req, res) => {
  try {
    const { name, status, image } = req.body;
    const { userDetails } = req.user;
    if (!name && !status) {
      return res
        .status(400)
        .send({ status: false, message: "Category and status required" });
    }
    const checkCategory = await CategoryModel.findOne({
      name,
    });
    if (checkCategory) {
      return res
        .status(400)
        .send({ status: false, message: "Category already exists" });
    }
    const newCategory = new CategoryModel({
      name,
      status: status ? status : false,
      user_id: userDetails?.user_id,
      image: image ? image : "",
    });

    await newCategory.save();

    res
      .status(201)
      .send({ status: true, message: "Category Created Suceessfully" });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const { limit, page } = req.query;
    const skip = (page - 1) * limit;
    const categories = await CategoryModel.find().skip(skip).limit(limit);
    const activeCategories = filterActiveList({
      list: categories,
      type: "categories",
    });
    res.status(200).send({
      status: true,
      message: "Categories Retrieved Successfully",
      data: {
        categories: activeCategories,
      },
    });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const getAllCategoriesByUser = async (req, res) => {
  try {
    const { userDetails } = req.user;
    const { limit, page } = req.query;
    const skip = (page - 1) * limit;
    const categories = await CategoryModel.find({
      user_id: userDetails?.user_id,
    })
      .skip(skip)
      .limit(limit);
    const filterCategoriesList = sendFiltersList({
      list: categories,
      type: "brands",
    });
    res.status(200).send({
      status: true,
      message: "Categories Retrieved Successfully",
      data: {
        categories: filterCategoriesList,
      },
    });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { category_id, name, status, image } = req.body;
    if (!category_id) {
      return res
        .status(400)
        .send({ status: false, message: "Category Id Not Found" });
    }
    if (!name) {
      return res
        .status(400)
        .send({ status: false, message: "Category Name is requierd" });
    }
    let category = await CategoryModel.findById({ _id: category_id });
    if (!category) {
      return res
        .status(400)
        .send({ status: false, message: "Category Not Found" });
    }
    await CategoryModel.findByIdAndUpdate(
      { _id: category_id },
      { name, status, image },
      {
        new: true,
      }
    );
    res.status(200).send({
      status: true,
      message: "Category Updated Successfully",
    });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { category_id } = req.body;

    if (!category_id) {
      return res
        .status(400)
        .send({ status: false, message: "Category Id Not Found" });
    }

    let category = await CategoryModel.findById({ _id: category_id });
    if (!category) {
      return res
        .status(400)
        .send({ status: false, message: "Category Not Found" });
    }

    await CategoryModel.findByIdAndDelete({ _id: category_id });
    res
      .status(200)
      .send({ status: true, message: "Category Deleted Successfully" });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

//get individual category details
const getCategory = async (req, res) => {
  try {
    const { category_id } = req.params;
    if (!category_id) {
      return res
        .status(400)
        .send({ status: false, message: "Category Id Not Found" });
    }

    const category = await CategoryModel.findById({ _id: category_id });
    if (!category) {
      return res
        .status(400)
        .send({ status: false, message: "Category Not Found" });
    }
    res.status(200).send({
      status: true,
      message: "Category Retrieved Successfully",
      category,
    });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

module.exports = {
  addCategory,
  getAllCategories,
  getAllCategoriesByUser,
  updateCategory,
  deleteCategory,
  getCategory,
};
