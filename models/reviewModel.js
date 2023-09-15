const mongoose = require('mongoose');
const Tour = require('./tourModel');
//const User = require('./userModel');
//console.log(Tour);
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be Empty!'],
    },
    rating: {
      type: Number,
      //min: [1, 'Rating must be above 1.0'],
      //max: [5, 'Rating must be below 5.0'],
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      //default: Date.now(),
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },

    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//Now we want to avoid duplicate reviews from a single user
// as we want a user to review each tour once
//so should we set indexes to both review ?
// No,we should not becuase it would mean each tour can only have on review
// and each user can set only one review

//So the solution is that we set the index by taking both things into
// consideration as mentioned below
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name', //observe the outputf
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });

  //We don't want to leak all the info thus selecting

  //Above code comented because
  //To resolve chain poplation
  //which is not good for performance
  //since we don not require tour population again in tours
  //while calling for population on reviews
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

/***********************
  Using Static Methods
***********************/

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  //now we will use aggregate method
  //console.log(this);
  //this points to current Model
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }, //name of the field rating
      },
    },
  ]);
  console.log(stats);

  //console.log(Tour);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating, //substituting the values
      ratingsAverage: stats[0].avgRating,
    });
    //await Tour.findOneAndUpdate({ _id: tourId }, pass);
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

//reviewSchema.pre('save', function (next) {

//We should not use pre here
//as the current revieq is not  in the collection just yet
// so therefore when we then do this match here
// thus its better when all are saved
reviewSchema.post('save', function () {
  //this points to curent review
  //now we want to call this function calcAvgRatings
  //as this function is available on model

  //so we might do it like

  //Review.calcAverageRatings(this.tour);

  //but at this point in the code the Review model is not avaiable

  //Thus we might think that we should move this block of code after the
  //declaration of the Review Model
  //But that is not going to work :(

  //As the code runs in a sequence in express
  //If we do that then our reviewSchmea would not contain this middleware

  //---------SOLUTION-------
  this.constructor.calcAverageRatings(this.tour);
});

//For
// finByIdandUpdate and
//findByIdandUpdate

//we do not have document middleware  but query middleware

//So we will use a TRICK to overcome his limitation
reviewSchema.pre(/^findOneAnd/, async function (next) {
  //Remeber that the goal is to get access to the current review document
  //but here the this keyword is the current query

  //const r = await this.findOne();
  this.r = await this.findOne();
  //console.log(r);

  // Now if we use calcAverageRatings at this point of time
  //then we will get the statistics with the non updated data

  ///Now we might not chnage this middleeware from pre to post
  //as by doing that we no longer have access to the query
  next();
  //Now the solution is the next post middleware
});

reviewSchema.post(/^findOneAnd/, async function () {
  //await this.findOne(); does not work here, query has already executed

  //so this is the perfrect point of time
  //when we can call the function calcAverageRatings
  await this.r.constructor.calcAverageRatings(this.r.tour);
  //to get the id
  //we store the tour id on the this in the earlier pre middleware
  //so that it could be made available here

  //this.r is the review then tour on that
});

//this will work as findbyidandupdate and other one is just a shorthand
//for findOneandUpdate with an id

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
