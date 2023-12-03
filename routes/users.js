const router = require('express').Router();
const {
  registerUser,
  loginUser,
  logout,
  forgotPassword,
  resetPassword,
  getUserDetails,
  getUpdatePassword,
  getUpdateProfile,
  getAllUsers,
  getUser,
  getDeleteUser,
  verifyUser,
  updateUserRole,
} = require('../controllers/userController');

const { isAuthenticatedUser, authorizeRoles } = require('../Middleware/authe');

//to register
router.route('/register').post(registerUser);

//to login
router.route('/login').post(loginUser);

//to verify
router.route('/verify/:token').get(verifyUser);

//to logout
router.route('/logout').get(logout);

//forget password
router.route('/password/forgot-password').post(forgotPassword);

//to reset password with new token
router.route('/password/reset/:token').put(resetPassword);

//own profile
router.route('/profile').get(isAuthenticatedUser, getUserDetails);

//to update password
router
  .route('/password/update-password')
  .put(isAuthenticatedUser, getUpdatePassword);

//to update profile
router.route('/profile/update').put(isAuthenticatedUser, getUpdateProfile);

//getting all users
router
  .route('/admin/users')
  .get(isAuthenticatedUser, authorizeRoles('admin'), getAllUsers);

//single user from id
router
  .route('/admin/user/:id')
  .get(isAuthenticatedUser, authorizeRoles('admin'), getUser);

router
  .route('/admin/user/:id')
  .put(isAuthenticatedUser, authorizeRoles('admin'), updateUserRole);

router
  .route('/admin/user/:id')
  .delete(isAuthenticatedUser, authorizeRoles('admin'), getDeleteUser);

module.exports = router;
