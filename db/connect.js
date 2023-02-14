const mongoose = require("mongoose");

const connectDB = (url) => {
  return mongoose
    .connect(url, { useNewUrlParser: true })
    .then((result) => console.log("connected to database"))
    .catch((err) => console.log(err));
};

module.exports = connectDB;
