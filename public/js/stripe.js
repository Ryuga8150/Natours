//Now we require stripe here for the front end as well
//we can' use require one as it is for backend
//thus we will add a script in the html

//here we use public api key
import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe(
  `pk_test_51NEGEzSGuY6sT0jqf8w2AmVK7GyUUcFuNYIVjsdoWmOq5HuNZg4AGgsGq9r3Y8PS1DG30tC6gLdH9ADKxL0Hoztg00OUJGvTTJ`
);

export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from aPI

    //this time we only do a get request so we don't need much data as earlier in the call
    const session = await axios({
      method: 'GET',
      url: `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`,
    });

    console.log(session);

    // 2) Create checkout form + change credit card

    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
