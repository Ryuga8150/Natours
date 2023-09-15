import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';
console.log('Hello from Parcel');

//to remove error in mapbox we do this
//DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

//console.log(loginForm);
//VALUES

//DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  //console.log(locations);

  //To run map uncomment this
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    //we cannot provide below values earlier as they are not ready yet
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    console.log('Before Login');
    login(email, password);
    console.log('Worked');
  });
}

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (userDataForm) {
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();

    //EARLIER
    // const name = document.getElementById('name').value;
    // const email = document.getElementById('email').value;
    //updateSettings({ name, email }, 'data');

    //Now using multi Form data
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    console.log(form);

    updateSettings(form, 'data'); //will treat form as an object
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSavePassword = document.querySelector('.btn--save-password');
    btnSavePassword.textContent = 'Updating...';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    btnSavePassword.textContent = 'Save password';
    passwordCurrent.value = '';
    password.value = '';
    passwordConfirm.value = '';
  });
}

if (bookBtn)
  bookBtn.addEventListener('click', (e) => {
    console.log('button clicked');
    e.target.textContent = 'Processing...';
    //const tourId = e.target.dataset.tourId; other way
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });
