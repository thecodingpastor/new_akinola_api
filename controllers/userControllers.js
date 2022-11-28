const User = require('../models/userModel');
const factory = require('./factoryHandler');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.getMe = factory.getOne(User);

// This was made by me to log in a user who has his (unexpired and valid) token in his localStorage
exports.checkAuth = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  const { phone, state, country, gender, relationship } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { phone, state, country, gender, relationship },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!user) return next(new AppError(`That user does not exist`, 404));

  res.status(200).json({
    status: 'success',
    data: user,
  });
});

exports.changePassword = catchAsync(async (req, res, next) => {
  const { newPassword, confirmPassword } = req.body;
  if (newPassword !== confirmPassword)
    return next(new AppError('Passwords do not match', 404));

  const user = await User.findById(req.user._id).select('+password');
  if (!user)
    return next(
      new AppError("This user's details is incorrect, try agin later.", 401)
    );

  // if (!(await user.comparePassword(oldPassword, user.password)))
  //   return next(
  //     new AppError('Old password is incorrect. Try forgot password', 401)
  //   );

  user.password = newPassword;
  await user.save();

  res.status(200).json({ data: 'Password changed, log in again.' });
});

// iammichaelakinola@gmail.com
