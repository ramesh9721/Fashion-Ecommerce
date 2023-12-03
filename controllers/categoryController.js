const Category = require('../models/category');
const Product = require('../models/product');
const catchAsyncError = require('../Middleware/catchAsyncErrors');
const cloudinary = require('cloudinary');
const slugify = require('slugify');

exports.createCategory = catchAsyncError(async (req, res, next) => {
  try {
    const result = await cloudinary.v2.uploader.upload(req.body.image, {
      folder: 'category',
    });

    const { title } = req.body;
    const slug = slugify(title, { lower: true, remove: /[*+~.()'"!:@]/g });

    const category = new Category({
      title,
      slug,
      image: {
        public_id: result.public_id,
        url: result.secure_url,
      },
    });

    const resultt = await category.save();
    res.status(201).json({
      success: true,
      category: resultt,
    });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

//single category
exports.getOneCategory = catchAsyncError(async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (category == null) {
      return res.status(404).send({ message: 'Category not found' });
    }
    res.send(category);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

exports.updateCategory = catchAsyncError(async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!category) {
      return res.status(404).send({ message: 'Category not found' });
    }
    res.status(200).send(category);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

exports.deleteCategory = catchAsyncError(async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (category == null) {
      return res.status(404).send({ message: 'Category not found' });
    }
    await category.remove();
    res.send({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

exports.getAllCategory = catchAsyncError(async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.send(categories);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

exports.getCategoryProduct = catchAsyncError(async (req, res, next) => {
  try {
    const category = new RegExp(req.params.cat, 'i');
    const product = await Product.find({ category: category });

    if (product == null) {
      return res.status(404).send({ message: 'Category not found' });
    }

    return res.send(product);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});
