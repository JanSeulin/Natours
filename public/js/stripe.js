import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51MnrQmCY5C9vQu25ydNSfwVeFmlwBTkaQab1Gab3bJJ4Ocl3xFk7wOUbRpWN3oTSwVDgtJzmbSxNQe9BzWnBuY8q00TK5jQmaD'
);

export const bookTour = async (tourId) => {
  // 1) Get checkout session from the server
  try {
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
