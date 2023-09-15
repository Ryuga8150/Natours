const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

//to apply to all
//router.use(authController.isLoggedIn);

//For rendering views

//was a test
//router.get('/', viewsController.getTour);

router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewsController.getOverview
);

//Earlier: router.get('/tour', viewsController.getTour);
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);

// /login
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);
router.get('/me', authController.protect, viewsController.getAccount);
//now this should be protected but protect is similar to logged in
//thus we will put is logged in only on the routes which are not protected
//because on the protected route
router.get('/my-tours', authController.protect, viewsController.getMyTours);

//Implementing route for submit request on form and sending it to directly in backend
router.post('/submit-user-data', viewsController.updateUserData);

module.exports = router;
