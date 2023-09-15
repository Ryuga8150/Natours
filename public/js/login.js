import axios from 'axios';
import { showAlert } from './alerts';
//const axios = require('axios');
//es6 module syntax for import export
export const login = async (email, password) => {
  //console.log(email, password);
  console.log('Login called');
  try {
    //whenever there is an error axios will throw that error
    //thus we can use try catch block here
    console.log('Entered');
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    console.log(res);

    if (res.data.status === 'success') {
      showAlert('success', 'Logged In Successfully!');
      //for automatic reloading to reataain login
      window.setTimeout(() => {
        location.assign('/');
        console.log('Assigning reload');
      }, 1500);
    }
    console.log(res);
  } catch (err) {
    //console.log(err.response.data);
    // console.log('error caught');
    //alert(err.response.data.message);
    //knew thhis by documentation
    //not this but
    //console.log(err);
    console.log('In error');
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout',
    });
    //for reloading
    if (res.data.status === 'success') location.reload(true);
  } catch (err) {
    showAlert('error', 'Error logging out! try again');
  }
};
