const express = require("express");

const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

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
