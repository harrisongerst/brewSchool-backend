// DEPENDENCIES

// get .env variables
require("dotenv").config();
const { PORT = 4000, MONGODB_URL } = process.env;
// import express
const express = require("express");
// create application object
const app = express();
// import mongoose
const mongoose = require("mongoose");
// import middlware
const cors = require("cors");
const morgan = require("morgan");
//models
const models = require("./models");
const Post = models.Post;
const User = models.User;

//db connection
mongoose.connect(MONGODB_URL, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

//connection events
mongoose.connection
  .on("open", () => console.log("Your are connected to mongoose"))
  .on("close", () => console.log("Your are disconnected from mongoose"))
  .on("error", (error) => console.log(error));
//middleware
app.use(cors()); // to prevent cors errors, open access to all origins
app.use(morgan("dev")); // logging
app.use(express.json()); // parse json bodies

//routes
//for testing
app.get("/", (req, res) => {
    res.send("hello world");
  });
//listener

app.get("/users/", async (req, res) => {
    try {
        res.json(await User.find({}));
    } catch (error) {
        res.status(400).json(error);
    }
});

app.get("/posts/", async (req, res) => {
    try {
        res.json(await Post.find({}));
    } catch{
        res.status(400).json(error);
    }
});

app.post("/users/", async (req, res) => {
    try {
      // send all people
        res.json(await User.create(req.body));
    } catch (error) {
      //send error
        res.status(400).json(error);
    }
});

app.post("/posts/", async (req, res) => {
    try {
      // send all people
        res.json(await Post.create(req.body));
    } catch (error) {
      //send error
        res.status(400).json(error);
    }
});

app.listen(PORT, () => console.log(`listening on PORT ${PORT}`));