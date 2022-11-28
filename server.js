const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");

process.on("uncaughtException", (err) => {
  console.log("===================================================");
  console.log("Uncaught Rejection, Shutting down");
  console.log(`${err.name}: ${err.message}`);
  process.exit(1);
});

const app = require("./app");

// Connection to Database and Starting server
console.log("Starting server ...");
console.log("Connecting to Database ...");

const DB_TO_CONNECT =
  process.env.NODE_ENV === "production"
    ? process.env.LIVE_DB
    : process.env.LOCAL_DB;

mongoose
  .connect(DB_TO_CONNECT, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log("Connected successfully to DB"))
  .catch((error) => {
    console.log("Error connecting to database: ", error);
  });

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

process.on("unhandledRejection", (err) => {
  console.log("===================================================");
  console.log("Unhandled Rejection, Shutting down");
  console.log(`${err.name}: ${err.message}`);
  app.close(() => {
    process.exit(1);
  });
});
