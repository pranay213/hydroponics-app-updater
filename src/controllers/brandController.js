const BrandModel = require("../db/models/brandModel");
const CategoryModel = require("../db/models/categoryModel");
const SubCatergoryModel = require("../db/models/subCatergoryModel");
const { filterActiveList } = require("../utils/constants");

const addBrand = async (req, res) => {
  try {
    const { name, status, image } = req.body;
    const { userDetails } = req.user;
    if (!name && !status) {
      return res
        .status(400)
        .send({ status: false, message: "Brand and status required" });
    }
    const checkBrand = await BrandModel.findOne({
      name,
    });
    if (checkBrand) {
      return res
        .status(400)
        .send({ status: false, message: "Brand Name already exists" });
    }

    const newBrand = new BrandModel({
      name,
      status: status ? status : false,
      user_id: userDetails?.user_id,
      image: image ? image : "",
    });
    await newBrand.save();
    res
      .status(201)
      .send({ status: true, message: "Brand Created Suceessfully" });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const getAllBrands = async (req, res) => {
  try {
    const { limit, page, category, sub_catergory } = req.query;
    const skip = (page - 1) * limit;
    const findCategory = await CategoryModel.findOne({
      name: category,
    });
    const findSubCategory = await SubCatergoryModel.findOne({
      name: sub_catergory,
    });
    if (category && sub_catergory && !findCategory && !findSubCategory) {
      return res
        .status(400)
        .send({ status: false, message: "Entered Sub Category Not Exist" });
    }

    const brandsIds = findSubCategory?.brands;

    if (category && sub_catergory) {
      const brands = await BrandModel?.find({
        _id: { $in: brandsIds },
      });
      const activeBrands = filterActiveList({ list: brands, type: "brands" });
      const sendBrands = activeBrands?.map((eachBrand) => {
        return {
          _id: eachBrand?._id,
          name: eachBrand?.name,
          image: eachBrand?.image,
        };
      });
      res.status(200).send({
        status: true,
        message: "Brands Retrieved Successfully",
        data: {
          brands: sendBrands,
        },
      });
    } else {
      const brands = await BrandModel.find().skip(skip).limit(limit);
      const activeBrands = filterActiveList({ list: brands, type: "brands" });
      res.status(200).send({
        status: true,
        message: "Brands Retrieved Successfully",
        data: {
          brands: activeBrands,
        },
      });
    }
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const getAllBrandsByUser = async (req, res) => {
  try {
    const { userDetails } = req.user;
    const { limit, page } = req.query;
    const skip = (page - 1) * limit;
    const brands = await BrandModel.find({
      user_id: userDetails?.user_id,
    })
      .skip(skip)
      .limit(limit);
    const activeBrands = filterActiveList({ list: brands, type: "brands" });
    res.status(200).send({
      status: true,
      message: "Brands Retrieved Successfully",
      data: {
        brands: activeBrands,
      },
    });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const updateBrand = async (req, res) => {
  try {
    const requests = req.body;
    const { brand_id, name, status, image } = requests;
    if (!brand_id) {
      return res
        .status(400)
        .send({ status: false, message: "Brand Id Not Found" });
    }
    if (!name) {
      return res
        .status(400)
        .send({ status: false, message: "Category Name is requierd" });
    }

    let brand = await BrandModel.findById({ _id: brand_id });
    if (!brand) {
      return res
        .status(400)
        .send({ status: false, message: "Brand Not Found" });
    }
    await BrandModel.findByIdAndUpdate(
      { _id: brand_id },
      { name, status, image },
      {
        new: true,
      }
    );
    res.status(200).send({
      status: true,
      message: "Brand Updated Successfully",
    });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const deleteBrand = async (req, res) => {
  try {
    const { brand_id } = req.body;

    if (!brand_id) {
      return res
        .status(400)
        .send({ status: false, message: "Brand Id Not Found" });
    }

    let brand = await BrandModel.findById({ _id: brand_id });
    if (!brand) {
      return res
        .status(400)
        .send({ status: false, message: "Brand Not Found" });
    }
    await BrandModel.findByIdAndDelete({ _id: brand_id });
    res
      .status(200)
      .send({ status: true, message: "Brand Deleted Successfully" });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const getBrand = async (req, res) => {
  try {
    const { brand_id } = req.params;
    if (!brand_id) {
      return res
        .status(400)
        .send({ status: false, message: "Brand Id Not Found" });
    }
    const brand = await BrandModel.findById({ _id: brand_id });

    if (!brand) {
      return res
        .status(400)
        .send({ status: false, message: "Brand Not Found" });
    }
    res.status(200).send({
      status: true,
      message: "Brand Retrieved Successfully",
      brand,
    });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

module.exports = {
  addBrand,
  updateBrand,
  deleteBrand,
  getBrand,
  getAllBrands,
  getAllBrandsByUser,
};
