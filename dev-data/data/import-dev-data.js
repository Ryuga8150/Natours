const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

const { isArgumentsObject } = require('util/types');

//eslint prettier turned from error to off 12/4/23

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

//This below returns a promise
mongoose
  //.connect(process.env.DATABASE_LOCAL,{  for local one
  .connect(DB, {
    //these are just some options to hadnle some deprecation warnings
    //not a big deal
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connection successful!'));

//READ JSON FILE

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

const importData = async () => {
  try {
    await Tour.create(tours);
    //await User.create(users);
    //gives error because we are creating user without confirming password
    //so below is the solution
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);

    console.log('Data Successfully LOADED!!!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

//Delete ALL DATA from  DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data Successfully DELETED!!!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

//console.log(process.argv);
//gives us command line arguments like
//node command import
//then these will be an array of strings

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
