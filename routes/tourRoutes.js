const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
//const reviewController = require('./../controllers/reviewController');
const reviewRouter = require('./../routes/reviewRoutes');
//tourController is an object can also deconstruct it before using

const router = express.Router();

// POST/tour/24545dsfd/reviews //This is a nested route
//where reviews is just a child of tours

// GET/tour/24545dsfd/reviews //This is a nested route
// GET/tour/24545dsfd/reviews/asda4fa5 //LAst one is the id of the review

//1) WAY
//Handling in the tour although it does not make that much sensse to call reviewRouter in tour

// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );

//2)way
router.use('/:tourId/reviews', reviewRouter);
//This is how we implement nested routes by enabling mergeParams to true in reviewRouter
//to use the tourId in reviewRouter

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
//This type of defining route we never did before
// We can make user enter these things using a query string like
// tours-distance?distance=233&center=-40,45&unit=miles
// but this way it looks way cleaner

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );
//above post shows chaining multiple middlewares

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
