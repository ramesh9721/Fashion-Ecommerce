const Order = require('../models/order');
const Product = require('../models/product');
const ErrorHandler = require('../utils/errorhandler');
const catchAsyncError = require('../Middleware/catchAsyncErrors');

/*********************************create order*************************************************************/
exports.createOrder = catchAsyncError(async (req, res, next) => {
  let {
    firstName,
    address,
    city,
    province,
    contact,
    orderItems,
    paymentInfo,
    totalPrice,
  } = req.body;

  orderItems = JSON.parse(orderItems);
  const order = await Order.create({
    firstName,
    address,
    city,
    province,
    contact,
    orderItems,
    paymentInfo,
    totalPrice,
    paidAt: Date.now(),
    user: req.user._id,
  });

  res.status(201).json({
    success: true,
    order,
  });
});

//single order
exports.singleOrder = catchAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'firstName email'
  );

  if (!order) {
    return next(new ErrorHandler('Order not found with the id', 404));
  }
  res.status(200).json({
    success: true,
    order,
  });
});

//login user Orders
exports.myOrder = catchAsyncError(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id });

  if (!orders) {
    return next(new ErrorHandler('Order not found with the id', 404));
  }
  res.status(200).json({
    success: true,
    orders,
  });
});

//all orders (admin)
exports.allOrders = catchAsyncError(async (req, res, next) => {
  const orders = await Order.find();

  let totalAmt = 0;

  orders.forEach((order) => {
    totalAmt += order.totalPrice;
  });

  res.status(200).json({
    success: true,
    totalAmt,
    orders,
  });
});

//update orders (admin)
exports.updateOrders = catchAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler('Order not found with this id', 404));
  }

  if (order.orderStatus === 'Delivered') {
    return next(new ErrorHandler('Already delivered the order', 400));
  }

  order.orderStatus = req.body.status;

  if (req.body.status === 'Delivered') {
    order.deliveredAt = Date.now();
    order.orderItems.forEach(async (ord) => {
      const product = await Product.findById(ord.product);
      product.stock -= ord.quantity;
      await product.save({ validateBeforeSave: false });
    });
  }

  await order.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});

// order delete
exports.deleteOrder = catchAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler('Order not found with this id', 404));
  }

  await order.remove();

  res.status(200).json({
    success: true,
  });
});

exports.cancelOrder = catchAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler('Order not found with this id', 404));
  }

  if (order.orderStatus === 'Cancelled') {
    return next(new ErrorHandler('Order is already cancelled', 400));
  }

  if (order.orderStatus === 'Delivered') {
    return next(new ErrorHandler('Cannot cancel a delivered order', 400));
  }

  order.orderStatus = 'Cancelled';

  await order.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});
