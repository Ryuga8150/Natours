const express = require('express');

const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

// About multer
// popular middleware
// to handle multi-part form data, which is a form in coding
// that's used to upload files from a form

//Remember that we used urlEncoded for form submission earlier
//and fro that we also included special middlewares

//now user will upload photo on updateme route

//configuring a multer upload
//if no options provided
// then image stored at memory and not saved anywhere in the disk

//Remember we are not actually storing the image in our db
// but we are storing in our system and we provide a link to that in our db
//const upload = multer({ dest: 'public/img/users' });
//consider above as for providing settings

const router = express.Router();

//This does not fit in REST philosophy
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);

router.get('/me', userController.getMe, userController.getUser);

//using upload to create a middleware
//that we can then add to this stack of the route
// that we want to use to upload the file

//.single because we have only one file
// name of the field that's going to hold the data
//this middleware will also put info on req.body
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto, //for resizing images before upload
  userController.updateMe
);

//here in deletion we don't actually delete the user's data
//but only mark it as inactive
router.delete('/deleteMe', userController.deleteMe);

//From here on only admin's are allowed
//wo will follow the same technique as above

router.use(authController.restrictTo('admin'));
//Now restrictTo and protect is also avaialable from on

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
