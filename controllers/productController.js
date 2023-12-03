const Product = require('../models/product');
const Category = require('../models/category');
const ErrorHandler = require('../utils/errorhandler');
const catchAsyncError = require('../Middleware/catchAsyncErrors');
const features = require('../utils/features');
const slugify = require('slugify');
const cloudinary = require('cloudinary');

//create new product = /api/v1/product/new for ADMIN **************************************************************************************************************
exports.newProduct = catchAsyncError(async (req, res, next) => {
  let pImages = [];

  if (typeof req.body.images === 'string') {
    pImages.push(req.body.images);
  } else {
    pImages = req.body.images;
  }

  const productImages = [];

  for (let i = 0; i < pImages.length; i++) {
    const element = await cloudinary.v2.uploader.upload(pImages[i], {
      folder: 'products',
    });
    productImages.push({
      public_id: element.public_id,
      url: element.secure_url,
    });
  }

  req.body.images = productImages;
  req.body.user = req.user.id;

  const { name, price, description, stock, category, images } = req.body;

  const product = new Product({
    name,
    slug: slugify(name),
    price,
    description,
    category,
    stock,
    images,
    user: req.body.user,
  });

  try {
    const result = await product.save();
    res.status(201).json({
      success: true,
      product: result,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: 'Product creation failed',
      error: error,
    });
  }
});

exports.getProductId = catchAsyncError(async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

//add stock of a product
exports.updateProductStock = catchAsyncError(async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    // Update stock
    const stock = req.body.stock;

    if (isNaN(stock)) {
      return res.status(400).json({ error: 'Invalid stock value' });
    }

    const oldStock = product.stock;
    product.stock = product.stock + stock;

    // Add stock record to history
    product.stock_history.push({
      quantity: req.body.stock,
      date: Date.now(),
    });

    const stockUpdateHistory = product.stock_history.filter(
      (record) => record.quantity === stock
    );

    // Set the user field to the ID of the currently authenticated user
    product.user = req.user._id;

    await product.save();

    // Construct the response object
    const response = {
      id: product._id,
      name: product.name,
      stock: product.stock,
      oldStock: oldStock,
      stockUpdateHistory: stockUpdateHistory,
    };

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

//Get all products => /api/v1/products **************************************************************************************************************
exports.getProducts = catchAsyncError(async (req, res, next) => {
  const resPerPage = 8;
  const productsCount = await Product.countDocuments();
  const keyFeature = new features(Product.find(), req.query)
    .search()
    .filter()
    .pagination(resPerPage);

  const products = await keyFeature.query;

  res.status(200).json({
    sucess: true,
    products,
    productsCount,
    resPerPage,
  });
});

// Get All Products --Home page
exports.getAllProductsHome = catchAsyncError(async (req, res) => {
  const resPerPage = 3;
  const productsCount = await Product.countDocuments();
  const apiFeatures = new features(Product.find(), req.query)
    .search()
    .filter()
    .pagination(resPerPage);
  const products = await apiFeatures.query;

  res.status(200).json({
    success: true,
    products,
    resPerPage,
    productsCount,
  });
});

// Get all ADMIN products
exports.getAdminProducts = catchAsyncError(async (req, res, next) => {
  const products = await Product.find();

  res.status(200).json({
    sucess: true,
    products,
  });
});

//update Products (ADMIN)**************************************************************************************************************
exports.updateProduct = catchAsyncError(async (req, res, next) => {
  let product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler('Product not found', 404));
  }

  if (req.body.category) {
    const categoryDoc = await Category.findOne({ title: req.body.category });
    if (!categoryDoc) {
      return res.status(404).json({
        message: `Category not found`,
      });
    }
  }

  let images = [];

  if (typeof req.body.images === 'string') {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  if (images !== undefined) {
    // Deleting Images From Cloudinary
    for (let i = 0; i < product.images.length; i++) {
      await cloudinary.v2.uploader.destroy(product.images[i].public_id);
    }

    const imagesLinks = [];

    for (let i = 0; i < images.length; i++) {
      const result = await cloudinary.v2.uploader.upload(images[i], {
        folder: 'products',
      });

      imagesLinks.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    req.body.images = imagesLinks;
  }

  product = await Product.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true }
  );

  return res.status(200).json({
    product,
  });
});

//single product details **************************************************************************************************************
exports.singleProduct = catchAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler('Product not found', 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

//Delete product details **************************************************************************************************************
exports.deleteProduct = catchAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler('Product not found', 404));
  }
  await product.remove();

  res.status(200).json({
    success: true,
    message: 'Product Deleted Sucessfully',
  });
});

// create a new review
exports.createNewReview = catchAsyncError(async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  const review = {
    user: req.user._id,
    name: req.user.firstName,
    rating: Number(rating),
    comment,
  };

  const product = await Product.findById(productId);

  const isReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );

  if (isReviewed) {
    product.reviews.forEach((review) => {
      if (review.user.toString() === req.user._id.toString()) {
        review.comment = comment;
        review.rating = rating;
      }
    });
  } else {
    product.reviews.push(review);
    product.numofReviews = product.reviews.length;
  }

  let avg = 0;

  product.reviews.forEach((rev) => {
    avg += rev.rating;
  });

  product.ratings = avg / product.reviews.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({ success: true });
});

// get all new review
exports.getAllProductReviews = catchAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.query.id);

  if (!product) {
    return next(new ErrorHandler('Product not found', 404));
  }

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

// delete review
exports.deleteProductReview = catchAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);

  if (!product) {
    return next(new ErrorHandler('Product not found', 404));
  }

  const reviews = product.reviews.filter(
    (revi) => revi._id.toString() !== req.query.id.toString()
  );

  const numofReviews = reviews.length;

  const ratings =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    reviews.length;

  await Product.findByIdAndUpdate(
    req.query.productId,
    {
      reviews,
      ratings,
      numofReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
  });
});
