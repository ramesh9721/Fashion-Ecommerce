const ErrorHandler = require('../utils/errorhandler');
const User = require('../models/user');
const catchAsyncErrors = require('../Middleware/catchAsyncErrors');
const tokenSend = require('../utils/tokenjwt');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary');

//Register
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  const cloudInary = await cloudinary.v2.uploader.upload(req.body.avatar, {
    folder: 'avatars',
    width: 150,
    crop: 'scale',
  });

  const { firstName, lastName, email, password, address, contact } = req.body;

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    address,
    contact,
    avatar: {
      public_id: cloudInary.public_id,
      url: cloudInary.secure_url,
    },
  });

  const token = jwt.sign({ id: user._id }, process.env.JWTPRIVATEKEY, {
    expiresIn: '1d',
  });

  const verifyLink = `${req.protocol}://${req.get(
    'host'
  )}/api/log/verify/${token}`;

  const message = `Please click the following link to verify your email: \n\n ${verifyLink}`;
  try {
    await sendEmail({
      email: user.email,
      subject: `Email Verification`,
      message,
    });
    res.status(200).json({
      sucess: true,
      message: `Email sent to ${user.email} sucessfully`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error sending verification email. Please try again later',
    });
  }
});

exports.verifyUser = async (req, res) => {
  const { token } = req.params;
  try {
    const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY);
    const user = await User.findByIdAndUpdate(
      decoded.id,
      { isVerified: true },
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
    }

    res.redirect('http://localhost:3000/login?verified=true');
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: 'Invalid token',
    });
  }
};

//login
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  //if user has benn given both email and password
  if (!email || !password) {
    return next(new ErrorHandler('Please enter email and password', 400));
  }
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorHandler('Invalid email or password', 401));
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler('Invalid email or password', 401));
  }

  if (!user.isVerified) {
    return res.status(400).json({
      status: 'fail',
      message: 'Email not verified',
    });
  }

  tokenSend(user, 200, res);
});

//Logout

exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie('token', null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'logged out',
  });
});

//forgot Password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler('User not found', 404));
  }

  const tokenReset = user.getResetPassToken();

  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${tokenReset}`;

  const message = `Your password reset Token is: \n\n ${resetPasswordUrl}`;
  try {
    await sendEmail({
      email: user.email,
      subject: `Password Recovery`,
      message,
    });
    console.log(
      `Email sent to ${user.email} successfully with message: ${message}`
    );
    res.status(200).json({
      sucess: true,
      message: `Email sent to ${user.email} sucessfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler(error.message, 500));
  }
});

//reset Password
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler(
        'Reset Password token is invalid or has benn expired',
        400
      )
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler('Password does not match', 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  tokenSend(user, 200, res);
});

//user details
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user,
  });
});

//user password (update)
exports.getUpdatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler('Old password is incorrect', 401));
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler('Password does not match', 400));
  }

  user.password = req.body.newPassword;

  await user.save();

  tokenSend(user, 200, res);
});

//user profile (update)
exports.getUpdateProfile = catchAsyncErrors(async (req, res, next) => {
  const updateUserData = {};
  if (req.body.firstName) {
    updateUserData.firstName = req.body.firstName;
  }
  if (req.body.lastName) {
    updateUserData.lastName = req.body.lastName;
  }
  if (req.body.email) {
    updateUserData.email = req.body.email;
  }
  if (req.body.address) {
    updateUserData.address = req.body.address;
  }
  if (req.body.contact) {
    updateUserData.contact = req.body.contact;
  }

  if (req.body.avatar !== undefined && req.body.avatar !== '') {
    const user = await User.findById(req.user.id);
    const avatarID = user.avatar.public_id;
    await cloudinary.v2.uploader.destroy(avatarID);

    const cloudinaryResponse = await cloudinary.v2.uploader.upload(
      req.body.avatar,
      {
        folder: 'avatars',
        width: 150,
        crop: 'scale',
      }
    );

    updateUserData.avatar = {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    };
  }

  const user = await User.findByIdAndUpdate(req.user.id, updateUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});

//all users details
exports.getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    success: true,
    users,
  });
});

//user details for admin(single user)

exports.getUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User does not exist with given Id: ${req.params.id}`)
    );
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// update User Role -- Admin
exports.updateUserRole = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    role: req.body.role,
  };

  await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});

//delete user
exports.getDeleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User does not exist with given Id: ${req.params.id}`)
    );
  }

  await user.remove();

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});
