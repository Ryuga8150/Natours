const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

//const router = express.Router();  //Before nested routes
const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  //the above get request will be hit if we want only one single review
  //becuase of the specified route in tourRoutes
  //thus will handle that in getAll reviews
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    //Added this above middleware to take care of the different portions
    //than the general createOne
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;
