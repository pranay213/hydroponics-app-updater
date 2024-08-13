const ProductModel = require("../db/models/productModel");
const UserModel = require("../db/models/userModel");

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
  rating,
  price_range,
  discount,
  category,
  res,
  checkUserExist,
}) => {
  // sort by: popularity, new, price:low to high(price_asc)/high to low(price_desc), discount, recommended
  let applyFilter = {};

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
  const listCategoryList = await ProductModel.find().select({
    category: 1,
    _id: 0,
  });

  let uniqueCategoryList = [];
  if (category === "all") {
    listCategoryList?.map((eachCategory) => {
      if (!uniqueCategoryList.includes(eachCategory?.category)) {
        uniqueCategoryList.push(eachCategory?.category);
      }
    });
  } else {
    const categoryList = category.split(",");
    uniqueCategoryList = categoryList;
  }

  const maxPriceRange =
    maxPrice && maxPrice !== "n"
      ? maxPrice
      : listMaxPrice[0]?.price
      ? listMaxPrice[0]?.price
      : 10000;
  const minPriceRange = minPrice ? minPrice : 0;

  //generally all products retrieve
  const products = await ProductModel.find({
    is_premium_product: false,
    category: { $in: uniqueCategoryList }, //only returns the products which have the entered category
    name: { $regex: search_q, $options: "i" }, //"i" is for case insensitive and regex is used to match the text
    rating: { $gte: rating }, //rating
    price: {
      //price range
      $gte: minPriceRange,
      $lte: maxPriceRange,
    },
    discount: { $gte: discount }, //returns which having the greater discount then mentioned
  }).sort(applyFilter);

  const premiumProducts = await ProductModel.find({
    is_premium_product: true,
    category: { $in: uniqueCategoryList },
    name: { $regex: search_q, $options: "i" }, //"i" is for case insensitive and regex is used to match the text
    rating: { $gte: rating },
    price: {
      $gte: minPriceRange,
      $lte: maxPriceRange,
    },
    discount: { $gte: discount },
  }).sort(applyFilter);

  const checkUserIsPremiumUser = checkUserExist?.is_premium_user;
  if (checkUserIsPremiumUser) {
    return res.status(200).send({
      status: true,
      message: "Products retrieved successfully",
      data: {
        allProducts: products,
        premiumProducts,
      },
    });
  } else {
    return res.status(200).send({
      status: true,
      message: "Products retrieved successfully",
      data: {
        allProducts: products,
        premiumProducts: [],
      },
    });
  }
};

const getShopPorducts = async ({ res, sellerDetails }) => {
  const filter = { "seller.seller_id": sellerDetails?.user_id };
  const products = await ProductModel.find(filter);

  return res.status(200).send({
    status: true,
    message: "Products retrieved successfully",
    data: {
      products,
    },
  });
};

const getAllProducts = async (req, res) => {
  try {
    const { userDetails } = req.user;
    const {
      search_q = "",
      sort = "recommended",
      rating = 1,
      price_range = "0_to_n",
      discount = 0,
      category = "all",
    } = req.query;

    const checkUserExist = await UserModel.findOne({
      user_id: userDetails?.user_id,
    });
    const checkUserType =
      userDetails?.role === "buyer" || userDetails?.role === "guest";
    if (checkUserType) {
      await getBuyerPorducts({
        search_q,
        sort,
        rating,
        price_range,
        discount,
        category,
        res,
        checkUserExist,
      });
    } else {
      const checkUserIsVerified = checkUserExist?.verified;

      if (!checkUserIsVerified) {
        return res.status(400).send({
          status: false,
          message: "User Is Not Valid",
        });
      }
      await getShopPorducts({ res, sellerDetails: checkUserExist });
    }
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
  getShopPorducts,
};
