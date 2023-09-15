const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  //This should be at the top
  console.log('UNHANDLED EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  //It is better to crash immediately as the app is in unclean state
  process.exit(1);
});
//eslint prettier turned from error to off 12/4/23

dotenv.config({ path: './config.env' });
const app = require('./app'); //this should be after config

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

//This below returns a promise
mongoose
  //.connect(process.env.DATABASE_LOCAL,{  for local one
  .connect(DB, {
    //these are just some options to handle some deprecation warnings
    //not a big deal
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connection successful!'));
//.catch((err) => console.log('ERROR'));
//can use above mentioned catch to handle uncaught rejected promis
//but since we are using a global error handler we will use that and not this

//Each time there is an unhandled promise our process will emit an object called unhandled rejection
//Thus we will listen to that event

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

//this could act as a final safety net for us
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  //process.exit(1); //only using this shuts the server immediately if there are som rquests it will turn them off
  //Thus we need the server to shut gracefully such that the requests are addressed first then server is closed.
  server.close(() => {
    process.exit(1);
  });
});

//IDEALLY we should handle errors where they originate
//console.log(x);
