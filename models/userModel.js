const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg', //to provide default image
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'], //these admin's are according to your application,
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a Password!!!'],
    minlength: 8,
    select: false, //for security reasons so thatssword does not gets displayed
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      //this works only for save and create
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAt: Date, //this property will only be there if someone tries to changePasswords
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  //Only run this fn if password was actually modified
  if (!this.isModified('password')) return next();

  //encrypting our password with bcryptjs npm package
  //second parameteer is cpu processing time
  //the higher it is the better is the encryption
  //bcrypt has two modes async.. and syncronoues

  //we will here use async
  //HASH THE PASSWORD WITH COST OF 12
  this.password = await bcrypt.hash(this.password, 12);

  //deleting the confirmed password
  this.passwordConfirm = undefined;
  //why this works since we had set validator??
  //ans because it was required as an input not to be persisted throught the DB
  next();
});

userSchema.pre('save', function (next) {
  //need to walk out if modified or newly created
  if (!this.isModified('password') || this.isNew) return next();

  //HACK:- To ensure that the token is always created after the password has been changed
  this.passwordChangedAt = Date.now() - 1000; //setting 1sec past

  next();
});

//to not show deleted users int the all users for eg
userSchema.pre(/^find/, function (next) {
  //this points to current query
  //this.find({ active: true });//this does not work
  this.find({ active: { $ne: false } }); //this does not work
  next();
});

//craeting an INSTANCE method
//a method which is available on all documents of a certain collection
//created as below
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  //here the this keyword belongs to the current document
  //since we cannot select password thus this.password is not avaialable
  //thus passing the user password in the function also

  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    //console.log(this.passwordChangedAt, JWTTimestamp);
    //need to convert first one into timestamp also for comparison

    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    //console.log(changedTimeStamp, JWTTimestamp);
    return JWTTimestamp < changedTimeStamp; //100<200
  }
  //FALSE MEANS NOT CHANAGED
  return false; //user has not changed password after
};

userSchema.methods.createPasswordResetToken = function () {
  //Now the password reset toen should basically be a random string
  // but at the same time it doesn't need
  //to be cryptographically strong as the password hash that we created before
  //So, here we can use the simple, random bytes function
  //from the built-in crypto module

  //32 refers to the length of the string to be generated
  const resetToken = crypto.randomBytes(32).toString('hex');
  //this token will be sent to the user and will behave like the
  //reset password that the user can use to create a real password

  //We should never save plain reset token in our DB thus we need to encrypt it
  //here we are using crypt's hash method to do that
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};
//convention models should begin with caps
const User = mongoose.model('User', userSchema);
module.exports = User;
