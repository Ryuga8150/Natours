const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
//eariler const sendEmail = require('./../utils/email');
const Email = require('./../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  //secret should be 32 characters long!!!
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    //secure: true, //for sending the cookie on secured connection like https
    //only want this secure option in production mode

    httpOnly: true,
    //this makes sures that the cookie cannot be
    //accessed or modified by the browser in any way

    //work done by this:
    //receive the cookie store it
    //and then send it automatically along with every request
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  //Remove password from output
  user.password = undefined;

  //201 is for creation
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  //we will specify which items must be there
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password, //creating time password will be displayed as its creating not selecting
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });
  const url = `${req.protocol}://${req.get('host')}/me`; //for making it work both in pro and develop
  console.log(url);
  await new Email(newUser, url).sendWelcome();
  //check the parameters

  // //secret should be 32 characters long!!!
  // const token = signToken(newUser._id);
  // //201 is for creation
  // res.status(200).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user: newUser,
  //   },
  // });
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  console.log('IN auth login');
  const { email, password } = req.body;
  //1)Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  //2)Checkuser exists && passowrd is correct

  //since find means selecting thus we will not get the password
  //thus we need to explicitly select that
  const user = await User.findOne({ email }).select('+password');
  //+ for selecting the field that is not allowed by default to selected
  //console.log(user);

  //now comparing the passwords
  //i.e ('pass1234') === '$asduihfbjhcjbf4545affa23f4a54fcsa',
  //the encrypted one could not be converted back coz that's the point of encryption

  //here user is the current document

  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError('Incorrect email or password', 401));

  //3)If everything ok,send token to client
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};
exports.protect = catchAsync(async (req, res, next) => {
  //1) Getting token and check if it's there
  //common practice to get tokens is to set them in the header
  //thus sending the token in postman header with the request

  //format of setting a header

  //key should be authorization
  //value should start with Bearer then after a space token
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    //console.log(token);
  }
  //we also want to read from cookie in browser
  else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    //401 means unauthorized access or not enough info to grant access
    return next(
      new AppError('You are not logged in! Please log in to get access', 401)
    );
  }

  //2) Verification token
  //since we are dealing with asynchronous thus we will promisify the given function
  //promise()function()calling after
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //console.log(decoded);
  //decoded is our payload

  //3) Check if user still exists
  //if user has been deleted but token exists
  //changed password after issuing token thus the old token should not be valid

  const currentUser = await User.findById(decoded.id);

  if (!currentUser)
    return next(
      new AppError('The user belonging to this token does no longer exist', 401)
    );

  //4) Check if user changed password after the JWT was issued
  //will create an INSTANCE METHOD

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in Again.', 401)
    );
  }

  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser; //VERY IMPORTANT THING TO LEARN
  res.locals.user = currentUser;

  next();
});

//only for rendered pages,no errors!
exports.isLoggedIn = async (req, res, next) => {
  console.log('Inside IsloggedIn');
  if (req.cookies.jwt) {
    try {
      //1) Verifying token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      //2) Check if user still exists

      const currentUser = await User.findById(decoded.id);

      if (!currentUser) return next();

      //3) Check if user changed password after the JWT was issued
      //will create an INSTANCE METHOD

      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      //There is a LOGGED in user
      //Thus we need to make the user acessible to the templates
      res.locals.user = currentUser;

      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

//IMPORTANT
//generally we don't pass arguments in the middleware function but here we want to

//Solution is to create a wraper fn which returns the middleware
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles is an array

    if (!roles.includes(req.user.role)) {
      //we previously applied role on the request object see in protect

      //403 means forbidden
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on POSTed email
  //we are using findOne here by email as the user does not know his id
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with that email address.', 404));
  }

  //2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  //have to use save because we just only modified it
  //But now we need to save it
  await user.save({ validateBeforeSave: false });
  //to disable the validators

  //3) Send it to user's email

  //No longer rquired after Email class implementation
  //const message = `forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetUrl}.\nIf you didn't forget your password, please ignore this email!`;
  //console.log('Reached till here');
  try {
    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    // await sendEmail({
    //   email: user.email, // can also use req.body.email
    //   subject: 'Your password reset token (valid for 10 min)',
    //   message,
    // });

    await new Email(user, resetUrl).sendPasswordReset();
    //console.log('Going to send Response');
    res.status(200).json({
      status: 'success',
      subject: 'Your password reset token (valid for 10 min)',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again Later!',
        500
      )
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  //now we need to encyrpt the original token so that it can be compared
  // with the encrypted one

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  //here taking into consideration the password expire condition
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  //Here we need validators
  //like for comparing password and passwordConfirm

  await user.save();
  //its's better to use thesav instead of findAndUpdate because
  //here we wan to run  valdiators and can also use middlewares on save

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT

  createSendToken(user, 200, res);
});

//this is when the user is already logged in
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();

  //User.findByIdAndUpdate not used because
  //in schema this  keyword is not available
  //as mongoose don't keep track of the current object
  //Moreover the middlewares cannot be used like the save one's

  // 4) Log user in, sen JWT
  createSendToken(user, 200, res);
});
