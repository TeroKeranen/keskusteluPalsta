const express = require("express");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv").config();
const mongoose = require("mongoose");
const localStrategy = require("passport-local").Strategy;
const session = require("express-session");
const passport = require("passport");
const User = require("./models/user");
const Post = require("./models/post");
const { getDate } = require("./func.js");
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

passport.use(
  new localStrategy(function (username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, { message: "incorrect username" });
      }

      bcrypt.compare(password, user.password, function (err, res) {
        if (err) return done(err);

        if (res === false) {
          return done(null, false, { message: "incorrect password." });
        }

        return done(null, user);
      });
    });
  })
);

app.get("/", (req, res) => {
  // Check if user is logged in
  const isLogged = req.isAuthenticated();

  if (!isLogged) {
    res.render("index", { title: "Welcome page", logged: false });
  } else {
    res.render("index", { title: "Welcome page", logged: true });
  }
});

app.get("/home", (req, res) => {
  // check if user is logged in
  const isLogged = req.isAuthenticated();
  // if there is no user it goes to index page
  if (!isLogged) {
    res.redirect("/");
  } else {
    // find all post and post them to home page
    Post.find()
      .then((result) => {
        res.render("home", { title: "Home", logged: true, post: result });
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

// postdetail page
app.get("/home/:id", (req, res) => {
  const pageId = req.params.id;
  const userId = req.user.id;

  Post.findById(pageId)
    .then((result) => {
      let createrId = result.id; // get id at post db, this is same as user id

      res.render("postdetail", {
        title: "Post",
        logged: true,
        post: result,
        createrId,
        pageId,
        userId,
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

// delete your post
app.delete("/home/:id", (req, res) => {
  const id = req.params.id; //get post id

  Post.findByIdAndDelete(id)
    .then((result) => {
      res.json({ redirect: "/home" });
    })
    .catch((err) => console.log(err));
});

app.get("/register", (req, res) => {
  res.render("register", { title: "Register", logged: false });
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
  res.render("login", { title: "Login", logged: false });
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/login?error=true",
  })
);

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
  });
  res.redirect("/");
});

app.get("/createpost", (req, res) => {
  // check if user is logged in
  const isLogged = req.isAuthenticated();

  if (!isLogged) {
    res.redirect("/");
  } else {
    res.render("createpost", { title: "Create", logged: true });
  }
});

app.post("/createpost", (req, res) => {
  const postTitle = req.body.title; // get post title
  const postContent = req.body.body; // get post content

  // creae new Post and take information that it needs
  const newPost = new Post({
    id: req.user.id, // give post id same as user id
    username: req.user.username,
    title: postTitle,
    content: postContent,
    date: getDate(),
  });

  //save newpost to Posts databae
  newPost
    .save()
    .then((result) => {
      res.redirect("/home");
    })
    .catch((err) => console.log(err));
});

app.listen(3000, function () {
  console.log("server start on port 3000");
});
