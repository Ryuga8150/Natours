const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

//going to configure multer to our needs
// thus we will set up two things
// 1.multer storage and 2. multer filter
// const multerStorage = multer.diskStorage({
//   //can also store files in buffer
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // user-02454eaba-3322as.jpeg
//     //name consits of two parts userID+timestamp
//     //only one used if override same user uploads or somebody uploads at same time

//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

//For using sharp
//we use memory storage now
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  //this functions ensures that we only insert images
  //if we want other types also
  //can provide chks for them as well
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};
// earlier
// const upload = multer({ dest: 'public/img/users' });
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

//ABOUT SHARP
//easy to use image processing library for nodejs
//can do many stuff, shines mostly in image resizing

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  //when doing image processing like this
  //right after uploading a file
  //then it's always best to not even save the file
  //on the disk but instead save it to memory

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  //no need to specify ext now as below in sharp we have mentioned it
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`); //chan change the default square one

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   const users = await User.find();

//   res.status(200).json({
//     status: 'success',
//     length: users.length,
//     data: {
//       users,
//     },
//   });
// });

//We need to use getOne here cause its similar to this
//but it requires id in the params
//Thus we will add id in params with a middleware then we
//will use getOne
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

//This updateME can only update name email
//Generally we keep updatePassword and updateMe
//separate because that's how it is done in real life
exports.updateMe = catchAsync(async (req, res, next) => {
  //console.log(req.file);
  //console.log(req.body);
  //with req.body we observe that
  //we only get name meaning body parser is not able to handle files
  //thus the requirement for multer package
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword'
      ),
      400 // Bad request
    );

  // 2) Update user document

  //2) Filtered out unwanted fields that are not allowed to be updated

  const filteredBody = filterObj(req.body, 'name', 'email');

  //Here we want photo in filteredBody
  //If there is a new user we provide default image in userModel
  if (req.file) filteredBody.photo = req.file.filename;

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, //returns a new updated object
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead',
  });
};
exports.getUser = factory.getOne(User);

exports.getAllUsers = factory.getAll(User);

//Do not update password with this
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

//for update is not required as we have signup and that contains
//different things than the generic factory one
