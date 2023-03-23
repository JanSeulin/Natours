const mongoose = require('mongoose');
const Tour = require('./tourModel');

// Review model - review, rating, createdAt, ref to tour, ref to user
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, `You can't send an empty review`],
      minLength: [20, 'A review must have at least 40 characters'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Please give the tour rating of 1 to 5'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to an user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    // id: false,
  }
);

// This is to make sure a user can only have one review per tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  console.log(stats);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  // this points to current review
  this.constructor.calcAverageRatings(this.tour); // ALSO points to the model, work around as Review below is not yet defined here
  // Review.calcAverageRatings(this.tour);
  // next();
});

// Post middleware will get the doc as the first argument. This post middleware wil lget the udpated
// Review as an argument, so you can do this, instead of the code in the commented out block below
reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) await doc.constructor.calcAverageRatings(doc.tour);
});

// reviewSchema.pre(/^findOneAnd/, async function (next) {
//   // The goal here is to get access to the current review document, but "this" here is the current query
//   // this.findOne() will get the document that is being processed (the review, in this case)
//   const r = await this.findOne();
//   console.log(r);
//   next();
// });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

// POST /tour/:id/reviews
// GET /tour/:id/reviews/:reviewId
