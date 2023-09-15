const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1)Get the currently ooked tour
  //console.log('Hit');
  const tour = await Tour.findById(req.params.tourId);
  console.log(tour);
  // 2)Create checkout session
  const session = await stripe.checkout.sessions.create({
    //Info about session
    mode: 'payment',
    payment_method_types: ['card'],
    //success_url: `${req.protocol}://${req.get('host')}/`,
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,

    //Info about product
    // line_items: [
    //   {
    //     name: `${tour.name} Tour`,
    //     description: tour.summary,
    //     images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
    //     //amount: tour.price * 100,
    //     price: tour.price * 100,
    //     currency: 'usd',
    //     quantity: 1,
    //   },
    // ],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
          unit_amount: tour.price * 100,
        },
        //amount: tour.price * 100,
        quantity: 1,
      },
    ],
  });

  // 3)Create session as response

  res.status(200).json({
    status: 'success',
    session,
  });
});

// Creating a new bookout document in our database
// whenever a user successfully purchases a tour

//Here, whenever a checkout is successfull the browser will automatically go to
//the success url which earier onlyb contained our home page

//Now it is also that point of time when we want to create a new booking
//thus, want to create a boooking whenever this url (success) is accessed

//Now we could now create a new route for this success but then we would have to create
// a whole new page and that's not really worth it in this case
// so we have done only a temporary solution to this now
//as its not really secure

//Now later when the website is actually deployed on a server we will get access
// to the session object once the purchase is completed
//using STRIPE WEBHOOKS
//these webhooks will be perfect for us to create a new booking

//So the workaround
// is to simply put the data that we need to create anew booking
//right into this url as a query string
//and we need to create a query string because Stripe
// will just make a get request to this url here and so we cannot
// really send a body or any data with it except for the query string

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  //this is only TEMPORARY,because it's UNSECURE: everyone can make bookings without paying
  const { tour, user, price } = req.query; //from query string

  if (!tour && !user && !price) return next();

  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split('?')[0]); //`${req.protocol}://${req.get('host')}
});

//Filling out the missing CRUD OPERATIONS
exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
