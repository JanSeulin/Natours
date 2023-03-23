const mongoose = require('mongoose'); // eslint-disable-line
const slugify = require('slugify'); // eslint-disable-line
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxLength: [40, 'A tour name must have a maximum of 40 characters'],
      minLength: [10, 'A tour name must have a minimum of 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain charactes'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty must be either: easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
      validate: {
        validator: function (val) {
          return !val.isNaN;
        },
        message: 'The price must be a number.',
      },
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on NEW document creation. It'll not run on UPDATES.
          return val < this.price; // if discount value is lower than normal value, will evoke validation error
        },
        message:
          'Discount price ({VALUE}) should be lower than the regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // select will permanently hide this value from any query results. Useful for outdated and sensitive data
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    // Above code says that everytime the data is outputted as JSON or Object the virtual properties will be part of the output
  }
);

// tourSchema.index({ price: 1 }); // --- Single Field Index -    1 = ascending -1 = descending
tourSchema.index({ price: 1, ratingsAverage: -1 }); // --- Compound Field Index -    1 = ascending -1 = descending
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' }); // we need to first attribute an index to the field we're searching for to be able to do geospatial query

tourSchema.virtual('durationWeeks').get(function () {
  // Virtual properties are not part of the database and cannot be used in queries
  return this.duration / 7;
});

// Virtual Populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  // localField is what it's called in the local model (tour in this case), foreignField is the "equivalent" in the foreignModel (review model, in this case).
  foreignField: 'tour',
  localField: '_id',
});

// DOCUMENT MIDDLEWARE: runs before or after .save() and .create() -- NOT valid on .insertMany() and other methods
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// QUERY MIDDLEWARE

// tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {
  // ^ will find everything that starts with the expression
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });

  next();
});

// tourSchema.post(/^find/, function (docs, next) {
//   console.log(`Query took ${Date.now() - this.start} milliseconds`);
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
