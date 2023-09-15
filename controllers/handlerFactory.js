//Will create Factory Functions
//meaning which return other functions
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      //if there a valid id but it does not exists
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, //for returning new updated tour not the earlier one
      runValidators: true, //for avoiding typecasting by mongoose
      //But it works without is also FIND!!!!
    });

    if (!doc) {
      //if there a valid id but it does not exists
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    }); //status 201 => means created
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    // const tour = await Tour.findById(req.params.id).populate({
    //   path: 'guides',
    //   select: '-__v -passwordChangedAt', //to not want something in our populated fields
    //   //notice the - in front ofg the fields
    // });
    // //the populate is done only in the query not in the DB

    // // REMEMBER populate will also do a query
    // //thus it can hamper our performance if it is used in more places
    //const tour = await Tour.findById(req.params.id);

    //Earlier
    //const doc = await Model.findById(req.params.id).populate('reviews');

    //Now to handle populate customizations

    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      //if there a valid id but it does not exists
      // console.log('Hit nulllllll');
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc, //es6 feature for tours:tours
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //To allow for nested GET revews on tour (hack)
    let filter = {};

    //handling the searched review
    if (req.params.tourId) filter = { tour: req.params.tourId };

    //EXECUTING QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    //To get statistics about the queries
    const doc = await features.query;
    //const doc = await features.query;

    //we are not using 404 error here if no matching data found
    //as we just did not got a match result it was not a failure of db

    //SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: doc.length, //tours no longer defined
      data: {
        data: doc,
      },
    });
  });
