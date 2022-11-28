const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const helmet = require("helmet");
const compression = require("compression");

// Errors Handler Import
const AppError = require("./utils/AppError");
const globalErrorHandler = require("./controllers/errorController.js");

// Import Route Middle wares
const userRoutes = require("./routes/userRoutes.js");
const postRoutes = require("./routes/postRoutes.js");
const projectRoutes = require("./routes/projectRoutes.js");

const app = express();

// Set security http headers
app.use(helmet());
// Use Cors
// const corsCredentials = {
//   credential: true,
//   origin:
//     process.env.NODE_ENV === 'production'
//       ? 'http://www.ayenimike.com'
//       : 'http://localhost:3000',
// };
app.use(cors());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Body parser - Reading data from the body into req.body
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
// app.use(express.json({ limit: '10kb' }));
//This limits the data transfer size to 10kb
// Cookie parser - Reading data from browser cookies
app.use(cookieParser());
// Data sanitization against noSQL query Injection
app.use(mongoSanitize());
app.use(compression());

// Data sanitization against XSS Attack
// I removed this because of html display
app.use(xss()); //?????????????????????????????????????????????????????????????

// Use My Imported Route Middle wares
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/projects", projectRoutes);
app.get("/", (req, res) => {
  res.send("App is live");
});

// Catch All Routes
app.all("*", (req, res, next) => {
  next(
    new AppError(
      `Cannot find the route ${req.originalUrl} on this server!`,
      404
    )
  );
});

app.use(globalErrorHandler);

module.exports = app;
