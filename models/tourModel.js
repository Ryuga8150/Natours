const mongoose = require('mongoose');
const slugify = require('slugify');
//const validator = require('validator');
// const User = require('./userModel');
// const Review = require('./reviewModel');
//1.specifying a schema and also doing some validation
//2. Valdation means data entered should be in correct format

//3.WE NEVER accept the data entered as it is ,we do santization and datavalidation
//to avoid corrupted data from being entering the database

const tourSchema = new mongoose.Schema(
  {
    //Shchema type options object
    name: {
      type: String,

      //neccesaity , error message
      required: [true, 'A tour must have a name'], //built-in validator

      //ensures that no two documents with same name
      //very benificial!!!
      unique: true, //not really a validator
      trim: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters'],

      //this will work for patch also as runValidators is set to true
      //validate: [validator.isAlpha, 'Tour name must only contain characters'], //just passing not calling
      //from validator library
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5 .0'],
      set: (val) => Math.round(val * 10) / 10, // 4.6666, 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      //A custom validator
      //basically a function which return either true or false
      type: Number,
      validate: {
        validator: function (val) {
          //val is the value of the priceDiscount

          //this only points to current document
          //IMPORTANT:- IT is not goind to work on UPDATE
          return val < this.price;
        },
        //(VALUE) gives us the current input value
        message: 'Dicount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true, //for trimming white spaces from start and end of a string
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(), //this is immediately converted to normal date by mongoose
      select: false, //for hiding from the user
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    // GeoSpatial Data
    // Data which describe places on earth using longitude and latitude coordinates
    // So we can describe simple points or either complex geometries
    //like polygons or lines or multi-polygons
    startLocation: {
      //GeoJSON
      //MongoDB uses special data format called GeoJSON
      //in order to specify geospatial data

      //Now here the first curlies are not for schema type options
      //but they(object) are for the schema type options

      //to be remarked as GeoJSON
      //object should have at least type and coordinate properties

      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number], //an array of numbers
      //Remember here LONGITUDE IS FIRST and LATITUDE IS SECOND

      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],

        address: String,
        description: String,
        day: Number,
      },
      //This array of documents will then create brand new documents
      //inside of the parent document which is in this case is tour
      //now in order to create some locations
      //we are going to import all our o riginal data
    ],
    //guides: Array,//for Embedding
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
      //the populate step will walways occur in a query
    ], //for refernicng
    //referncing will make sure that we get the proper queries in the correct format
    //but it does not get saved in the tour model
  },
  {
    toJSON: { virtuals: true }, // each time the data is outputed as JSON
    toObject: { virtuals: true }, // eac h time the data is outputed as Object
  }
);

/******************
    INDEXING
******************/
//helps in fast search time if used correctly
//by default id is the default indexing
//here we defined name also in our schema as unique thus
//it is also present in our indexing if looked in DB

//This is Single indexing
//tourSchema.index({ price: 1 });

//once created it remains in the DB

//For compund indexing
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

//For Geospatial query in Tourcontroller
//here the index is different not 1 or -1

//2dsphere if data describes real points on earth
//2dindex if data describes fictional points
tourSchema.index({ startLocation: '2dsphere' });

// Why don't we use indexing on all fields?

// we need to study the access patterns of the queries which are being searched frequently
//now if there is high write ratio then we might update the indexes frequently
//thus will cost us

//Virtutal properties
//properties which are present in schema but not in Database
//The virtual Properties are by default not shown in data we have to explicitly define thats why defined in options in Tour Schema`

//NOTE: we cannot use VIRTUAL properties in our queries because they
//are not part of our database.
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
  //here this -> current document
  //since we want this thus we use regular function
});

//VIRTUAL POPULATE
//Reason to use
//reviews know which tour it belongs to
// but tour does not know
//not implementing child referencing to solve that problem
//as not want to persist that data
//Thus using virtual populate

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// MONGOOSE  MIDDLEWARES

//1) Document MiddleWare:runs before save command and .create()
//Thus this middleWare is triggereed by the above two commands

//.insertMany() not affected by this
tourSchema.pre('save', function (next) {
  //this-> refers to the the document which is being saved
  //console.log(this);

  this.slug = slugify(this.name, { lower: true }); //for this to persist in the database the schema should also contain slug and this is in general
  next();
});

//Will not use Embedding instead will use REFERENCING

// tourSchema.pre('save', async function (next) {
//   //will use this middleware when
//   //an array of id's have been passed
//   //now we need to embed our user data in our tour model

//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   //now above this will return an array of promises

//   this.guides = await Promise.all(guidesPromises);

//   //Now we will not do for update
//   //this is because
//   //if lets say user changes from guide to tour guide then
//   //we would have to check if the tour has that user as a guide
//   //then update the tour as well
//   next();
// });

//2) QUERY MIDDLEWARE
//applies on query
//this -> query

//written 'find'  -> /^find/ to macth findOne findRemove etc.
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  //setting a property on query object
  this.start = Date.now();
  next();
});
tourSchema.pre(/^find/, function (next) {
  //will populate here to apply effects on multiple places
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});
tourSchema.post(/^find/, function (docs, next) {
  //console.log(docs);
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  next();
});

//3) AGGREGATION MIDDLEWARE
//removed for geospatial aggregation pipeline
// tourSchema.pre('aggregate', function (next) {
//   //to not show secret tour we need to filter out from the beginning
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline());
//   next();

//   //earlier the secretTour was counted but now not counted
// });

//4)MODAL MIDDLEWARE- not discussed not that much important

//capittal T shows a Modal
//in () first is the name of the model then is the schema
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
