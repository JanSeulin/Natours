const express = require('express');

const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');

// Merge Params will allow you to access params from nested routes, in the case you need it to access the TOUR ID (see tourRoutes to understand if in doubt)
const router = express.Router({ mergeParams: true });

router.use(authController.protect);

// Now both /tour/:tourId/reviews and /reviews will use below handler
router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;
