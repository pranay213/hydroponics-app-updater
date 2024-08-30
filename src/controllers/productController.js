require("dotenv").config();
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const { v4: uniqueId } = require("uuid");
const ProductModel = require("../db/models/productModel");
const UserModel = require("../db/models/userModel");
const {
  filterUniqueListFn,
  getFiltersListFromProducts,
  filterProductDetails,
  CLOUDINARY_CONFIG,
} = require("../utils/constants");

const addProduct = async (req, res) => {
  try {
    const {
      product_id,
      name,
      price,
      category,
      sub_category,
      brand,
      description,
      features = [],
      images = [],
      specifications = {},
      stock = {},
      is_premium = false,
      discount = 0,
    } = req.body;

    if (
      !product_id ||
      !name ||
      !price ||
      !category ||
      Object?.keys(specifications)?.length === 0 ||
      !brand ||
      !description ||
      features?.length === 0 ||
      images?.length === 0
    ) {
      return res
        .status(400)
        .send({ status: false, message: "Fields Must Not Be Empty" });
    }

    const { userDetails } = req.user;

    const checkSellerDetails = await UserModel.findOne({
      user_id: userDetails?.user_id,
    });

    const sellerDetails = {
      seller_id: checkSellerDetails?.user_id,
      name: checkSellerDetails?.name,
      contact: {
        email: checkSellerDetails?.contact?.email,
        mobile_number: checkSellerDetails?.contact?.mobile_number,
      },
    };

    const newProduct = new ProductModel({
      product_id,
      name,
      category,
      sub_category,
      brand,
      price,
      description,
      features,
      images,
      seller: sellerDetails,
      specifications,
      stock,
      is_premium,
      discount,
    });
    await newProduct.save();
    res
      .status(201)
      .send({ status: true, message: "Product Created Suceessfully" });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const getBuyerPorducts = async ({
  search_q,
  sort,
  price_range,
  discount,
  category,
  res,
  sub_category,
  brand,
}) => {
  // sort by: popularity, new, price:low to high(price_asc)/high to low(price_desc), discount, recommended
  let applyFilter = { price: 1, discount: -1, rating: -1 };

  const [minPrice, maxPrice] = price_range?.split("_to_");

  switch (sort) {
    case "recommended":
      applyFilter = { price: 1, discount: -1, rating: -1 };
      break;
    case "price_asc":
      applyFilter = { price: 1 };
      break;
    case "price_desc":
      applyFilter = { price: -1 };
      break;
    case "discount":
      applyFilter = { discount: -1 };
      break;
    case "rating":
      applyFilter = { rating: -1 };
      break;
    case "new":
      applyFilter = { createdAt: -1 };
  }

  const listMaxPrice = await ProductModel.find().sort({ price: -1 }).limit(1);
  const { allCategoriesList, allSubCategoriesList, allBrandsList } =
    await getFiltersListFromProducts(ProductModel);

  const filterCategoriesList = filterUniqueListFn({
    filter: category,
    filterValue: "all",
    list: allCategoriesList,
    type: "category",
  });
  const filterSubCategoriesList = filterUniqueListFn({
    filter: sub_category,
    filterValue: "all",
    list: allSubCategoriesList,
    type: "sub_category",
  });
  const filterBrandsList = filterUniqueListFn({
    filter: brand,
    filterValue: "all",
    list: allBrandsList,
    type: "brand",
  });

  const maxPriceRange =
    maxPrice && maxPrice !== "n" ? maxPrice : listMaxPrice[0]?.price;

  const minPriceRange = minPrice ? Number(minPrice) : 0;

  //based on category, sub_category, brand, search_q, rating
  //rating is not added yet
  const products = await ProductModel.find({
    category: { $in: filterCategoriesList },
    sub_category: { $in: filterSubCategoriesList },
    brand: { $in: filterBrandsList },
    name: { $regex: search_q, $options: "i" }, //"i" is for case insensitive and regex is used to match the text
    price: {
      $gte: minPriceRange,
      $lte: maxPriceRange,
    },
    discount: { $gte: discount }, //returns which having the greater discount then mentioned
    is_premium: false,
  }).sort(applyFilter);

  const filterAllProducts = products?.map((eachProduct) =>
    filterProductDetails(eachProduct)
  );

  res.status(200).send({
    status: true,
    message: "Products retrieved successfully",
    data: {
      products: filterAllProducts,
    },
  });

  // const premiumProducts = await ProductModel.find({
  //   category: { $in: uniqueCategoryList },
  //   name: { $regex: search_q, $options: "i" }, //"i" is for case insensitive and regex is used to match the text
  //   rating: { $gte: rating },
  //   price: {
  //     $gte: minPriceRange,
  //     $lte: maxPriceRange,
  //   },
  //   discount: { $gte: discount },
  // is_premium: true,
  // }).sort(applyFilter);

  // const checkUserIsPremiumUser = checkUserExist?.is_premium_user;
  // if (checkUserIsPremiumUser) {
  //   return res.status(200).send({
  //     status: true,
  //     message: "Products retrieved successfully",
  //     data: {
  //       allProducts: products,
  //       premiumProducts,
  //     },
  //   });
  // } else {
  //   return res.status(200).send({
  //     status: true,
  //     message: "Products retrieved successfully",
  //     data: {
  //       allProducts: products,
  //       premiumProducts: [],
  //     },
  //   });
  // }
};

const getAllProductsByUser = async (req, res) => {
  try {
    const { userDetails } = req.user;
    const filter = { "seller.seller_id": userDetails?.user_id };
    const products = await ProductModel.find(filter);
    return res.status(200).send({
      status: true,
      message: "Products retrieved successfully",
      data: {
        products,
      },
    });
  } catch (error) {
    res.status(400).send({ message: "Something Went Wrong" });
  }
};

const uploadProductImages = async (req, res) => {
  try {
    const images = req.files;
    const imageIds = req.body.image_ids;

    if (!images || images?.length === 0) {
      return res
        .status(400)
        .send({ status: false, message: "No files uploaded." });
    }

    cloudinary.config({
      ...CLOUDINARY_CONFIG,
    });
    const uploadImagesPromises = images.map(async (eachImage, index) => {
      const imageId = imageIds[index];
      const uploadResult = await cloudinary.uploader.upload(eachImage.path, {
        public_id: uniqueId(),
        resource_type: "image",
        upload_preset: process.env.CLOUDINARY_PRODUCTS_PRESET,
      });
      fs.unlinkSync(eachImage.path);
      return {
        ...uploadResult,
        image_id: imageId,
      };
    });

    const allImages = await Promise.all(uploadImagesPromises);
    if (allImages?.length > 0) {
      const sendImageDetails = allImages?.map((eachImage) => {
        return {
          image_id: eachImage?.image_id,
          url: eachImage?.public_id?.slice(28),
          alt: eachImage?.original_filename,
          uploaded: true,
        };
      });
      res.status(200).send({
        status: true,
        message: "Images Upload Successful",
        data: {
          images: sendImageDetails,
        },
      });
    } else {
      return res
        .status(400)
        .send({ status: false, message: "Failed to upload images" });
    }
  } catch (error) {
    res.status(400).send({
      status: false,
      message: "Something Went Wrong",
    });
  }
};

const deleteImagesFromCloudinary = async (req, res) => {
  try {
    const images_list = req.body;
    if (!images_list || images_list.length === 0) {
      return res
        .status(400)
        .send({ status: false, message: "No images to delete" });
    }
    cloudinary.config({
      ...CLOUDINARY_CONFIG,
    });
    const deleteImagesPromise = images_list?.map(async (eachImage) => {
      const result = await cloudinary.uploader.destroy(
        `${process.env.CLOUDINARY_PRODUCTS_PRESET}/${eachImage?.url}`
      );
      return result;
    });
    const results = await Promise.all(deleteImagesPromise);
    const errors = results.filter((result) => result?.error);
    if (errors?.length > 0) {
      return res.status(500).send({
        status: false,
        message:
          images_list?.length > 1
            ? "Some images failed to delete"
            : "Image Delete Failed",
        errors,
      });
    }
    return res.status(200).send({
      status: true,
      message:
        images_list?.length > 1
          ? "Images deleted successfully"
          : "Image deleted successfully",
    });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const {
      search_q = "",
      sort = "recommended",
      rating = 1,
      price_range = "0_to_n",
      discount = 0,
      category = "all",
      sub_category = "all",
      brand = "all",
    } = req.query;
    getBuyerPorducts({
      search_q,
      sort,
      rating,
      price_range,
      discount,
      category,
      res,
      brand,
      sub_category,
    });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { userDetails } = req.user;
    const requests = req.body;

    if (Object.keys(requests)?.length === 0) {
      return res
        .status(400)
        .send({ status: false, message: "Requests Should not be empty" });
    }

    if (!requests?.product_id) {
      return res
        .status(400)
        .send({ status: false, message: "Proudct Id Not Found" });
    }

    const checkProductExist = await ProductModel.findOne({
      product_id: requests?.product_id,
    });

    if (!checkProductExist) {
      return res.status(400).send({
        status: false,
        message: "Your trying to update a product which does not exist",
      });
    }

    const checkTheUserIdWithProduct =
      checkProductExist?.seller?.seller_id === userDetails?.user_id;
    if (!checkTheUserIdWithProduct) {
      return res.status(400).send({
        status: false,
        message: "Your Not Allowed To Update A Product",
      });
    }

    const result = Object.keys(requests).some((key) => {
      // Skip certain keys
      if (["is_premium"].includes(key)) {
        return false;
      }
      // Check if the property is undefined or null in checkProductExist
      return (
        checkProductExist[key] === undefined || checkProductExist[key] === null
      );
    });

    if (result) {
      return res.status(400).send({
        status: false,
        message: "Your trying to update the property which not exist",
      });
    }

    const updateProductDetails = { ...checkProductExist._doc, ...requests };
    const checkAnyChangesMade =
      JSON.stringify(checkProductExist) !==
      JSON.stringify(updateProductDetails);
    if (checkAnyChangesMade) {
      await ProductModel.updateOne(
        { _id: checkProductExist?._id },
        { $set: updateProductDetails },
        { new: true }
      );
      res
        .status(200)
        .send({ status: true, message: "Product Updated Successfully" });
    }
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { userDetails } = req.user;
    const { product_id } = req.body;

    if (!product_id) {
      return res
        .status(400)
        .send({ status: false, message: "Proudct Id Not Found" });
    }

    const checkProductExist = await ProductModel.findOne({
      product_id,
    });

    if (!checkProductExist) {
      return res.status(400).send({
        status: false,
        message: "Your trying to delete a product which does not exist",
      });
    }

    const checkTheUserIdWithProduct =
      checkProductExist?.seller?.seller_id === userDetails?.user_id;
    if (!checkTheUserIdWithProduct) {
      return res.status(400).send({
        status: false,
        message: "Your Not Allowed To Delete A Product",
      });
    }

    await ProductModel.findOneAndDelete({ product_id });
    res
      .status(200)
      .send({ status: true, message: "Product Deleted Successfully" });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

//get individual product details
const getProduct = async (req, res) => {
  try {
    const { userOrShopDetails } = req.user;
    const product_id = req.params.product_id;
    if (!product_id) {
      return res
        .status(400)
        .send({ status: false, message: "Proudct Id Not Found" });
    }
    const checkUserExist = await UserModel.findOne({
      user_id: userOrShopDetails?.user_id,
    });

    const checkUserIsVerified = checkUserExist?.verified;
    if (!checkUserIsVerified) {
      return res
        .status(400)
        .send({ status: false, message: "User is Not Verified or Not Valid" });
    }

    const checkProductExist = await ProductModel.findOne({
      _id: product_id,
    });

    if (!checkProductExist) {
      return res.status(400).send({
        status: false,
        message: "Your trying to access a product which does not exist",
      });
    }

    const checkProductIsPremium = checkProductExist?.is_premium_product;
    if (checkProductIsPremium) {
      const checkUserIsPremiumUser = checkUserExist?.is_premium_user;
      if (!checkUserIsPremiumUser) {
        return res.status(400).send({
          status: false,
          message: "Your Not allowed to access this product",
        });
      } else {
        res.status(200).send({
          status: true,
          message: "Product Retrieved Successfully",
          productDetails: checkProductExist,
        });
      }
    } else {
      res.status(200).send({ status: true, productDetails: checkProductExist });
    }
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const addReview = async (req, res) => {
  try {
    const { userOrShopDetails } = req.user;
    const { comment, rating } = req.body;
    const findUser = await UserModel.findOne({ user_id: userOrShopDetails });
    if (!findUser) {
      return res.status(400).send({ status: false, message: "User Not Exist" });
    }
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

module.exports = {
  getAllProducts,
  addProduct,
  deleteProduct,
  updateProduct,
  getProduct,
  addReview,
  getAllProductsByUser,
  uploadProductImages,
  deleteImagesFromCloudinary,
};
