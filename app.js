const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser'); // eslint-disable-line

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARES
// Serving Static Files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'", 'data:', 'blob:', 'https:', 'ws:'],
//         baseUri: ["'self'"],
//         fontSrc: ["'self'", 'https:', 'data:'],
//         scriptSrc: [
//           "'self'",
//           'https:',
//           'http:',
//           'blob:',

//           'https://*.mapbox.com',
//           'https://js.stripe.com',
//           'https://m.stripe.network',
//           'https://*.cloudflare.com',
//         ],
//         frameSrc: ["'self'", 'https://js.stripe.com'],
//         objectSrc: ["'none'"],
//         styleSrc: [
//           'self',
//           'https:',
//           'unsafe-inline',
//           'https://api.mapbox.com/',
//           'https://api.tiles.mapbox.com/',
//           'https://fonts.googleapis.com/',
//         ],
//         workerSrc: [
//           "'self'",
//           'data:',
//           'blob:',
//           'https://*.tiles.mapbox.com',
//           'https://api.mapbox.com',
//           'https://events.mapbox.com',
//           'https://m.stripe.network',
//         ],
//         childSrc: ['self', 'blob:'],
//         imgSrc: ['self', 'data:', 'blob:'],
//         formAction: ['self'],
//         connectSrc: [
//           'self',
//           'unsafe-inline',
//           'data:',
//           'blob:',
//           'https://*.stripe.com',
//           'https://*.mapbox.com',
//           'https://*.cloudflare.com/',
//           'https://bundle.js:*',
//           'ws://127.0.0.1:*/',
//           'https://api.mapbox.com/',
//           'https://a.tiles.mapbox.com/',
//           'https://b.tiles.mapbox.com/',
//           'https://events.mapbox.com/',
//         ],
//         upgradeInsecureRequests: [],
//       },
//     },
//   })
// );

const scriptSrcUrls = [
  'https://api.tiles.mapbox.com/',
  'https://api.mapbox.com/',
  'https://cdnjs.cloudflare.com/',
  'https://*.stripe.com/',
  'https://js.stripe.com/',
  'https://js.stripe.com/*',
  'https://m.stripe.com/',
  'https://r.stripe.com/',
];
const styleSrcUrls = [
  'https://api.mapbox.com/',
  'https://api.tiles.mapbox.com/',
  'https://fonts.googleapis.com/',
];
const connectSrcUrls = [
  'https://api.mapbox.com/',
  'https://a.tiles.mapbox.com/',
  'https://b.tiles.mapbox.com/',
  'https://events.mapbox.com/',
  'https://bundle.js:*',
  'https://*.stripe.com/',
  'https://js.stripe.com/',
  'https://js.stripe.com/*',
  'https://m.stripe.com/',
  'https://r.stripe.com/',
  'ws://127.0.0.1:*/',
  'ws://localhost:*/',
];

const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];
// Set eecurity HTTP headers
// app.use(helmet());

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'blob:'],
      frameSrc: ["'self'", 'https://*.stripe.com'],
      objectSrc: [],
      imgSrc: ["'self'", 'blob:', 'data:'],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  })
);

// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'", 'data:', 'blob:', 'https:', 'ws:'],
//         baseUri: ["'self'"],
//         fontSrc: ["'self'", 'https:', 'data:'],
//         scriptSrc: [
//           "'self'",
//           'https:',
//           'http:',
//           'blob:',
//           'https://*.mapbox.com',
//           'https://js.stripe.com',
//           'https://*.cloudflare.com',
//         ],
//         frameSrc: ["'self'", 'https://js.stripe.com'],
//         objectSrc: ['none'],
//         styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
//         workerSrc: ["'self'", 'data:', 'blob:'],
//         childSrc: ["'self'", 'blob:'],
//         imgSrc: ["'self'", 'data:', 'blob:'],
//         connectSrc: [
//           "'self'",
//           'blob:',
//           'wss:',
//           'https://*.tiles.mapbox.com',
//           'https://api.mapbox.com',
//           'https://events.mapbox.com',
//         ],
//         upgradeInsecureRequests: [],
//       },
//     },
//   })
// );
// app.use(helmet({ contentSecurityPolicy: false }));

// Development Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit Requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP, please try again in an hour.',
});

app.use('/api', limiter); // Will limit number of requests to the API router

// Body Parser, reading data from the body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS (Cross-site scripting attacks)
app.use(xss());

// prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// 3) ROUTES
app.use('/', viewRouter);
// API Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Invalid URL ${req.originalUrl}!`, 404));
});

app.use(globalErrorHandler);

// 4) START SERVER
module.exports = app;
