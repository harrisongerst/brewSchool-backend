// DEPENDENCIES

// get .env variables
require("dotenv").config();
const { PORT = 4000, MONGODB_URL } = process.env;
// import express
const express = require("express");
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
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

//middleware function for jwt verification
function verifyJWT(req, res, next){
  const token = req.headers["x-access-token"];
  console.log(token);
  if(token){
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.json({
        isLoggedIn: false,
        message: "Authenication Failed"
      })
      req.user = {};
      req.user.id = decoded.id;
      req.user.username = decoded.username;
      next();
    })
  }
  else{
    res.json({message: "Incorrect token given", isLoggedIn: false});
  }
}

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

app.get("/posts/:id", async (req, res) => {
  try {
      res.json(await Post.findOne({"_id": req.params.id}));
  } catch{
      res.status(400).json(error);
  }
});

app.get("/userLoggedIn", verifyJWT, (req, res) => {
  res.json({isLoggedIn: true, username: req.user.username});
})

app.post("/posts/", async (req, res) => {
    try {
      // send all people
        res.json(await Post.create(req.body));
    } catch (error) {
      //send error
        res.status(400).json(error);
    }
});

//registration route, checks for existing user if no user exists creates user, hashes password, saves to db
app.post("/register/", async (req, res) => {
  const user = req.body;
  const existingUser = await User.findOne({username: user.username});
  if(existingUser){
    res.json({message: "This username already exists"});
  }
  else{
    user.password = await bcrypt.hash(req.body.password, 10);
    const dbUser = new User({
      username: user.username.toLowerCase(),
      password: user.password
    });
    dbUser.save();
    res.json({message: "success"});
  }
});

app.post("/login", (req, res) => {
  const userLogIn = req.body;


  User.findOne({username: userLogIn.username.toLowerCase()})
  .then(dbUser => {
    if(!dbUser){
      return res.json({message: "Invalid Username or Password"})
    }
    bcrypt.compare(userLogIn.password, dbUser.password)
    .then(isCorrectPW => {
      if(isCorrectPW){
        const payload = {
          id: dbUser._id,
          username: dbUser.username
        }
        jwt.sign(
          payload,
          process.env.JWT_SECRET,
          {expiresIn: 3600},
          (err, token) => {
            if(err) return res.json({message: err})
            return res.json({
              message: "Successful Login",
              token: token
            })
          }
        )
      }
      else{
        return res.json({message: "Invalid Username or Password"})
      }
    })
  })
});

app.listen(PORT, () => console.log(`listening on PORT ${PORT}`));