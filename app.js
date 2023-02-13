const express = require("express");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const User = require("./models/user");
const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: "fairytale is safe",
    resave: false,
    saveUninitialized: false,
  })
);

// passport initialize middleware
app.use(passport.initialize());
//
// passport session middleware
app.use(passport.session());

// Mongoose db
const dbUser = process.env.MONGO_URI;
//Mongoose connect
mongoose
  .connect(dbUser, { useNewUrlParser: true })
  .then((result) => console.log("connected to database"))
  .catch((err) => console.log(err));

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  console.log(req.body.username);
  console.log(req.body.password);
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.listen(3000, function () {
  console.log("server start on port 3000");
});
