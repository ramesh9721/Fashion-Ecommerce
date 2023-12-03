const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Please enter your name'],
    maxLength: [50, 'Name cannot exceed 50 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Please enter your Lastname'],
    maxLength: [50, 'Lastname cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please enter your Email'],
    unique: true,
    validate: [validator.isEmail, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please enter your password'],
    select: false,
    // validate: {
    //   validator: function (v) {
    //     return validator.isStrongPassword(v, {
    //       minLength: 8,
    //       minLowercase: 1,
    //       minUppercase: 1,
    //       minNumbers: 1,
    //     });
    //   },
    //   message:
    //     'Password must be at least 8 characters long and include at least one lowercase letter, one uppercase letter, and one number',
    // },
  },
  avatar: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  role: {
    type: String,
    default: 'user',
  },

  address: {
    type: String,
    required: [true, 'Please enter your Address'],
  },
  contact: {
    type: Number,
    required: [true, 'Please enter your Contact'],
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },

  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWTPRIVATEKEY, {
    expiresIn: '1h',
  });
};

//compare Password
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

//reset password token
userSchema.methods.getResetPassToken = function () {
  const tokenReset = crypto.randomBytes(20).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(tokenReset)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return tokenReset;
};

module.exports = mongoose.model('user', userSchema);
