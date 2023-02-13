const express = require("express");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv").config();
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const User = require("./models/user");
const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Mongoose db
const dbUser = process.env.MONGODB_URI;
//Mongoose connect
mongoose
  .connect(dbUser, { useNewUrlParser: true })
  .then((result) => console.log("connected to database"))
  .catch((err) => console.log(err));

app.use(
  session({
    secret: "fairytale is safe",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(express.json());
// passport initialize middleware
app.use(passport.initialize());
//
// passport session middleware
app.use(passport.session());

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const userName = req.body.username;
  const password = req.body.password;

  // Check if username is taken
  const nameExist = await User.exists({ username: userName });

  if (!nameExist) {
    bcrypt.genSalt(10, function (err, salt) {
      if (err) return nameExist(err);

      bcrypt.hash(password, salt, function (err, hash) {
        if (err) return next(err);

        const newUser = new User({
          username: userName,
          password: hash,
        });

        newUser.save();

        res.redirect("/login");
      });
    });
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.listen(3000, function () {
  console.log("server start on port 3000");
});
