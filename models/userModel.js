const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const checkEmail = require('../utils/checkEmail');

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'User must have a first name'],
      trim: true,
      minlength: [2, 'Name cannot be less than 2 characters'],
      maxlength: [20, 'Name cannot be more than 20 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'User must have a last name'],
      trim: true,
      minlength: [2, 'Name cannot be less than 2 characters'],
      maxlength: [20, 'Name cannot be more than 20 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: [true, 'The email already exists'],
      validate: {
        validator: function (email) {
          return checkEmail(email);
        },
        message: 'Please provide a valid email',
      },
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password cannot be less than 6 characters'],
      trim: true,
      select: false,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  // ensures password was modified before it runs
  if (!this.isModified('password')) return next();
  // hashes the password
  this.password = await bcrypt.hash(this.password, 12);
  // prevents passwordConfirm field from being saved to the DB
  // this.passwordConfirm = undefined;
  next();
});

UserSchema.pre('save', function (next) {
  // Sets password changed at field in the user collection
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Instance Method
UserSchema.methods.comparePassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

UserSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    // the getTime() Method changes date from y:m:d to seconds, then divided by 1000 to change to milliseconds
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    ); //The optional 10 is to specify the base of conversion (base 10)
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

UserSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken) //This would be called when confirming the reset of password
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', UserSchema);
module.exports = User;
