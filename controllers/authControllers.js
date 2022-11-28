const { promisify } = require("util");

const jwt = require("jsonwebtoken");

const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const assignToken = require("../utils/token");
const crypto = require("crypto");

const createSendToken = (user, statusCode, res) => {
  const token = assignToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
  };
  res.cookie("jwt", token, cookieOptions);
  user.password = undefined; //Removes password from the output
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  //1.) Get token from request headers and check if its there
  // I may need to implement removal of the token from request headers in production
  let token;
  const headAuth = req.headers.authorization;
  if (headAuth && headAuth.startsWith("Bearer")) {
    token = headAuth.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError("Please log in to have access", 401));
  }

  // 2.) Verify the token
  const decodedToken = await promisify(jwt.verify)(
    token,
    process.env.JWT_TOKEN
  );

  // 3.) Check if user still exists
  const user = await User.findById(decodedToken.id);
  if (!user)
    return next(
      new AppError("The user who signed in does not exist any longer", 401)
    );

  // 4.) Check if user changed password after the token was issued
  if (user.changedPasswordAfter(decodedToken.iat))
    return next(
      new AppError(
        "You recently changed your password, please log in again",
        401
      )
    );
  // GRANT ACCESS TO PROTECTED ROUTES
  req.user = user;
  // res.locals.user = user;
  next();
});

exports.createUser = catchAsync(async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;
  let allowedEmails = [
    "iammichaelakinola@gmail.com",
    "thecodingpastor@gmail.com",
  ];

  // These checks for only allowed emails and malicious user creation
  if (!allowedEmails.includes(email))
    return next(new AppError("Access denied!", 400));
  let check = await User.findOne({ email });
  if (check) return next(new AppError("Access denied!", 400));

  const newUser = await User.create({
    firstName: firstName.toLowerCase(),
    lastName: lastName.toLowerCase(),
    email: email.toLowerCase(),
    password,
  });
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1.) Checks if email and password is not empty?
  if (!email || !password) {
    return next(new AppError(`Please provide an email and a password`, 400));
  }
  //2.) Check if user with this email exists
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password, user.password)))
    return next(new AppError("Email or password is incorrect.", 401));

  // 3.) Send token to client if everything is OK
  createSendToken(user, 200, res);
});

// This was made by me to log in a user who has his (unexpired and valid) token in his localStorage
exports.checkAuth = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: "success",
    user: req.user,
  });
});

exports.logout = (req, res, next) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  };
  res.cookie("jwt", "", cookieOptions);
  res.json({
    status: "success",
  });
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1.) Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  const message =
    "If valid, a message would have been sent to the provided email address for further instructions.";
  // return next(new AppError('There is no user with that email.', 404)); // don't send an error

  // 2.) Generate random token == use user model methods
  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });
  // 3.) Send it to user's email
  const resetURL = `http://localhost:3000/reset-password?token=${resetToken}`;
  // const resetURL = `${req.protocol}/api/v1/users/reset-password/${resetToken}`;
  const mail = `Click on this link ${resetURL} to change your password.\nIf you didn't forget your password, please ignore this email`;

  res.status(200).json({ message, mail, resetToken });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1.) Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.query.resetToken)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2.) If token has not expired and there is a user, reset password
  if (!user) return next(new AppError("Token is invalid or has expired", 400));
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3.)Update changedPasswordAt property for the user

  // 4.)Log the user in by send JWT
  createSendToken(user, 200, res);
});
