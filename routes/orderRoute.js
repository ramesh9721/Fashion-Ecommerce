const router = require('express').Router();
const {
  createOrder,
  singleOrder,
  myOrder,
  allOrders,
  updateOrders,
  deleteOrder,
  cancelOrder,
} = require('../controllers/orderController');

const { isAuthenticatedUser, authorizeRoles } = require('../Middleware/authe');

router.route('/order/create').post(isAuthenticatedUser, createOrder);

router.route('/order/:id').get(isAuthenticatedUser, singleOrder);

router.route('/orders/me').get(isAuthenticatedUser, myOrder);

router
  .route('/admin/allorders')
  .get(isAuthenticatedUser, authorizeRoles('admin'), allOrders);

router
  .route('/admin/order/:id')
  .put(isAuthenticatedUser, authorizeRoles('admin'), updateOrders);

router
  .route('/admin/order/:id')
  .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteOrder);

router.route('/order/cancel/:id').post(isAuthenticatedUser, cancelOrder);

module.exports = router;
