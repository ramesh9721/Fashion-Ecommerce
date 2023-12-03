const router = require('express').Router();
const {
  getOneCategory,
  updateCategory,
  deleteCategory,
  getAllCategory,
  createCategory,
  getCategoryProduct,
} = require('../controllers/categoryController');
const { isAuthenticatedUser, authorizeRoles } = require('../Middleware/authe');

// Create a new category
router
  .route('/category/new')
  .post(isAuthenticatedUser, authorizeRoles('admin'), createCategory);

// Update a category by ID
router
  .route('/category/:id')
  .put(isAuthenticatedUser, authorizeRoles('admin'), updateCategory);

// Delete a category by ID
router
  .route('/category/:id')
  .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteCategory);

// Get all categories
router.route('/category/all').get(getAllCategory);

// Get a single category by ID
router.route('/category/:id').get(getOneCategory);

router.route('/category/products/:cat').get(getCategoryProduct);

module.exports = router;
