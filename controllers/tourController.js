//const fs = require('fs');
const Tour = require('./../models/tourModel');
//const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');
//For imageCover and images of a new tour

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

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

//when there is single
// upload.single('image');

//if we did not have imageCover could have done like below
//when there is multiple
// upload.array('images', 5);

//when there is mix of them
//upload.fields
exports.resizeTourImages = catchAsync(async (req, res, next) => {
  //console.log(req.files);

  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover image
  //const imageCoverFilename = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  //req.body.imageCover = imageCoverFilename; //imageCover field in db field also

  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333) //3 : 2 ratio
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`); //chan change the default square one

  //Since for updation we use updateOne which requires req.body
  //thus will put pictures on it

  // 2) Images
  //we are not handling async await clearly here with just forEach and asyn-await inside
  req.body.images = [];
  //Solution:-
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333) //3 : 2 ratio
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`); //chan change the default square one

      req.body.images.push(filename);
    })
  );
  console.log(req.body);
  next();
});

exports.aliasTopTours = (req, res, next) => {
  //Here we are prefilling the query string
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// exports.getAllTours = catchAsync(async (req, res, next) => {
//   //EXECUTING QUERY
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();

//   const tours = await features.query;

//   //we are not using 404 error here if no matching data found
//   //as we just did not got a match result it was not a failure of db

//   //SEND RESPONSE
//   res.status(200).json({
//     status: 'success',
//     results: tours.length, //tours no longer defined
//     data: {
//       tours,
//     },
//   });
// });

exports.getAllTours = factory.getAll(Tour);

// exports.getTour = catchAsync(async (req, res, next) => {
//   // const tour = await Tour.findById(req.params.id).populate({
//   //   path: 'guides',
//   //   select: '-__v -passwordChangedAt', //to not want something in our populated fields
//   //   //notice the - in front ofg the fields
//   // });
//   // //the populate is done only in the query not in the DB

//   // // REMEMBER populate will also do a query
//   // //thus it can hamper our performance if it is used in more places
//   //const tour = await Tour.findById(req.params.id);
//   const tour = await Tour.findById(req.params.id).populate('reviews');

//   if (!tour) {
//     //if there a valid id but it does not exists
//     // console.log('Hit nulllllll');
//     return next(new AppError('No tour found with that ID', 404));
//   }
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour, //es6 feature for tours:tours
//     },
//   });
// });

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     //if there a valid id but it does not exists
//     return next(new AppError('No tour found with that ID', 404));
//   }
//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// });
//USING HANDLER FACTORY NOW

exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      //match is just like a filter objects
      //is also a preliminary stage for other stages
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 }, //1 is for ascending
    },
    // {
    //   //ne -> not equal
    //   $match: { _id: { $ne: 'EASY' } }, //for repeating stages
    // },
  ]);
  // console.log(stats);
  // stats = await stats._pipeline;
  res.status(200).json({
    status: 'success',
    stats,
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: {
          $month: '$startDates',
        },
        numTourStarts: { $sum: 1 }, //for counting something,
        tours: {
          $push: '$name',
        },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0, // will not show up id
      },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
    {
      $limit: 12,
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: { plan },
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  //radius should be in radians that is obtained by dividing it byb radius of earth
  // the divided value is based upon the unit

  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat, lng.'
      )
    );
  }

  //console.log(distance, lat, lng, unit);

  const tours = await Tour.find({
    //OBSERVE latitude is first in geoJSON
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  //We are searching for the startLocation
  //basically geoWithin finds documents within a certain geometry
  //We want to find them inside of a sphere that starts
  //centere sphere takes array of coordinates and radiys

  //Now in order to work with geoSpatial query
  // we first needto attribute an index to the field
  // wjhere the geospatial data is that
  //we are searching for is stored

  //which is our STARTLOCATION

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat, lng.'
      )
    );
  }

  //in order to do calculations we always use aggregation pipeline

  const distances = await Tour.aggregate([
    //for geospatial queries only one stage exists
    //i.e geoNear
    // and this should be the first one in the pipeline ALWAYS
    {
      //it also requires that one field is geoSpatial index

      $geoNear: {
        //things to be passed in geoNear
        //1. Near property and near is the point from which to calculate the distances
        //Thus all the distances will be calculated from this point
        near: {
          //have to specify like geoJSON
          type: 'Point',
          //OBSERVE latitude is first in geoJSON
          coordinates: [lng * 1, lat * 1], //to convert into Numbers
        },
        //this is the place where distances are stored
        distanceField: 'distance',
        distanceMultiplier: multiplier, //to get the distances in km or miles rather than in metres
      },
    },
    {
      //for only allowing name and sdistance in the output
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
