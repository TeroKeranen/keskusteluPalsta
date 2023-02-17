const express = require("express");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv").config();

// const mongoose = require("mongoose");
const connectDB = require("./db/connect");
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

// connect to database
connectDB(process.env.MONGODB_URI);

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

// render to index page
app.get("/", (req, res) => {
  // Check if user is logged in
  const isLogged = req.isAuthenticated();

  if (!isLogged) {
    res.render("index", { title: "Welcome page", logged: false });
  } else {
    res.render("index", { title: "Welcome page", logged: true });
  }
});

// render home page
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
        res.render("home", {
          title: "Home",
          logged: true,
          error: "",
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
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
// render to register page
app.get("/register", (req, res) => {
  res.render("register", { title: "Register", logged: false, error: "" });
});

// register your username
app.post("/register", async (req, res) => {
  const userName = req.body.username; // get username
  const password = req.body.password; // get password

  // Check if username is taken
  const nameExist = await User.exists({ username: userName });
  // if username is not taken and password is 5 or more character long it will register
  if (!nameExist && password.length >= 5) {
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
  } else {
    res.render("register", {
      title: "Register",
      logged: false,
      error: "Something went wrong",
    });
  }
});
// render to login page
app.get("/login", (req, res) => {
  res.render("login", { title: "Login", logged: false, error: "" });
});

app.get("/loginfail", (req, res) => {
  res.render("loginfail", { title: "loginfail", logged: false });
});
// login in
app.post("/login", (req, res) => {
  // Make a new user object when logging in
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  //
  // check if login informations is correct
  try {
    req.login(user, (err) => {
      if (err) {
        console.log(err);
      } else {
        // find user from database and if its founded and password is correct it will log in
        User.findOne({ username: user.username }, function (err, foundUser) {
          if (err) {
            console.log(err);
          }

          // if username is correct but password fail it wil render you to loginfail.ejs
          if (foundUser) {
            passport.authenticate("local", { failureRedirect: "/loginfail" })(
              req,
              res,
              function () {
                res.redirect("/home");
              }
            );
          } else {
            res.render("login", {
              title: "Login",
              logged: false,
              error: "Oops... Something went wrong",
            });
          }
        });
      }
    });
  } catch (error) {
    if (error) {
      res.render("login", {
        title: "Login",
        logged: false,
        error: "Oops... Something went wrong",
      });
    }
  }
});
// logout
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
  });
  res.redirect("/");
});
// create new post on createpost.ejs
app.get("/createpost", (req, res) => {
  // check if user is logged in
  const isLogged = req.isAuthenticated();

  if (!isLogged) {
    res.redirect("/");
  } else {
    res.render("createpost", { title: "Create", logged: true, error: "" });
  }
});
// post a secret message
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

// This render to update.ejs where you can update your message
app.get("/update/:id", (req, res) => {
  const pageId = req.params.id;
  const userId = req.user.id;

  Post.findById(pageId)
    .then((result) => {
      let createrId = result.id; // get id at post db, this is same as user id

      res.render("update", {
        title: "Update",
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
// post your updated secret message
app.post("/update", (req, res) => {
  const postId = req.body.postId; //get post id
  const update = { title: req.body.title, content: req.body.body }; // the new data to set

  // Find the document with the specified ID and update it
  Post.findOneAndUpdate(
    { _id: postId },
    update,
    { new: true },
    function (err, doc) {
      if (err) throw err;
      res.redirect("/home");
    }
  );
});

// search secret messages on home.ejs
app.post("/search", (req, res) => {
  const userSearch = req.body.search; // get input

  const userId = req.user.id; // get logged user id

  // Check if userSearch input title is exist on post database, if there is it will render you on searchPage.
  Post.find({ title: userSearch }, (err, foundTitle) => {
    if (err) {
      console.log(err);
      return;
    } else {
      if (foundTitle.length === 0) {
        res.render("home", {
          title: "Home",
          logged: true,
          error: "There is no such a group",
        });
      } else {
        res.render("searchPage", {
          title: "Post",
          logged: true,
          post: foundTitle,
          userId,
        });
      }
    }
  });
});

// This is on searchPage.ejs and it will open secret message on secret.ejs
app.get("/secret/:id", (req, res) => {
  const id = req.params.id; // get post id
  const userId = req.user.id; // get logged user id
  const user = req.user.username; // get logged user username

  Post.find({ _id: id }, (err, foundTitle) => {
    if (err) {
      console.log(err);
      return;
    } else {
      if (foundTitle.length === 0) {
        res.render("home", { title: "Home", logged: true, post: "" });
      } else {
        foundTitle.forEach((title) => {
          let createrId = title.id; // get id at post db, this is same as user id

          res.render(`secret`, {
            title: "Post",
            logged: true,
            post: title,
            createrId,
            userId,
            user,
          });
        });
      }
    }
  });
});

// Post a comment on secret.ejs
app.post("/comment/:id", (req, res) => {
  const user = req.user.username; // Get username
  const userComment = req.body.comment; // Get comment that user post
  const id = req.params.id;
  const commentDate = getDate(); // get date when comment posted
  const postId = req.params.id; // get ID of post from URL

  Post.updateOne(
    { _id: id },
    {
      $push: {
        comments: {
          comment: userComment,
          user: user,
          commentDate: commentDate,
        },
      },
    },
    (err) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/secret/" + id);
      }
    }
  );
});

// Delete comment on secret.ejs
app.post("/delComment", (req, res) => {
  let commentID = req.body.deleteComment; // get comment id
  let id = req.body.postId; // get secret message id

  // find secret message from database and update comments section (delete comment)
  Post.findOneAndUpdate(
    { _id: id },
    { $pull: { comments: { _id: commentID } } },
    (err, post) => {
      if (err) return res.status(400).send(err);

      res.redirect("/secret/" + id);
    }
  );
});

app.post("/updComment/:id", (req, res) => {
  const postId = req.body.postId; // get post id
  const commentId = req.body.updateCommentId; // get comment id
  const userId = req.user.id; // get logged user id

  Post.find({ _id: postId }, (err, foundTitle) => {
    if (err) {
      console.log(err);
      return;
    } else {
      if (foundTitle.length === 0) {
        res.render("home", { title: "Home", logged: true, post: "" });
      } else {
        foundTitle.forEach((title) => {
          res.render(`commentUpdate`, {
            title: "Post",
            logged: true,
            post: title.comments,
            commentId,
            userId,
            postId,
          });
        });
      }
    }
  });
});

app.post("/updateComment", (req, res) => {
  const postId = req.body.postId; //get post id
  const commentId = req.body.commentId; //get post id
  const newComment = req.body.body;
  const index = 2;
  const update = { title: req.body.title, content: req.body.body }; // the new data to set
  console.log(newComment);

  Post.updateOne(
    { _id: postId, "comments._id": commentId },
    { $set: { "comments.$.comment": newComment } },
    function (err, result) {
      if (err) {
        console.error(`hitto ${err}`);
      } else {
        res.redirect("/secret/" + postId);
      }
    }
  );
});
const port = process.env.PORT || 5000;
app.listen(port, function () {
  console.log(`Server started on port ${port}`);
});
