const AppError = require('./../utils/appError');
const Tour = require('../models/tourModel');
const Bookings = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
exports.getOverview = catchAsync(async (req, res, next) => {
  console.log('In getOverview');
  // 1) Get tour data from collection
  const tours = await Tour.find();

  // 2) Build template
  // 3) Render that template using tour data from 1)

  res.status(200).render('overview', {
    title: 'All Tours',
    //after getting the data
    //we pass it here as it will get passed as an object so that it will be available in overview

    tours,
  });
});
exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get the data, for the requested tour (including reviews and guides)
  console.log('Inside get tour');
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user', //what we want
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  }
  // 2) Build template
  // 3) Render template using data from 1)
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});

//in async we always require next
exports.getLoginForm = (req, res) => {
  console.log('In login Form');
  res.status(200).render('login', {
    title: `Log into your account `,
  });
};
exports.getAccount = (req, res) => {
  //do not need to import user cause it will get handled in protect middleware
  res.status(200).render('account', {
    title: `Your account`,
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  //1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id });
  //now this above contains all the booking documents for the current user
  //but really that only gives us the tourIds

  //and so now we want to find the tours with the returned IDs
  //thus now we need to create an array of all the ids
  //then query for tours that have one of these ids
  //
  //Now instead we could also do a virtual populate on the tours
  //just like we had done in user and reviews
  //But here in this function he wants to show us
  //how to do it manually
  //as a virtual populate should work same as what we are going to do there
  //2) Find tours with the returned IDs

  //array of ids
  const tourIDs = bookings.map((el) => el.tour);
  //can'ts use findByid here because here we require a new operator
  const tours = await Tour.find({ _id: { $in: tourIDs } });
  res.status(200).render('overview', {
    title: 'My Tours',
    tours, //here we passed only selected tours
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  console.log('UPDATING USER', req.body);
  //this itself does not work and loader spins continously
  //we also need to parse data coming from form
  //will do it in the form

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email, //name and email are the fields in the form element with name
    },
    {
      new: true, //to return updated result
      runValidators: true,
    }
  );

  //Remember we cannot update passwords like this ecause
  //   that's not going to run teh safe middleware

  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser, //passing here because otherwise it will use user coming from protect middleware
    //which is old one
  });

  //not ideal
  //as not handles error properly
  // thus api way better
});
