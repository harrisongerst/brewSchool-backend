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

app.post("/posts", verifyJWT, async (req, res) => {
    try {
      const newPost = req.body
      const currentUser = req.user;

      const equipArr = newPost.requiredEquipment.split(",");
      const instructionsArr = newPost.instructions.split(",");


      const dbPost = new Post({
        username: currentUser.username,
        title: newPost.title,
        description: newPost.description,
        brewType: newPost.brewType,
        coffeeAmount: newPost.coffeeAmount,
        iced: newPost.iced,
        brewTimeSeconds: newPost.brewTimeSeconds,
        requiredEquipment: equipArr,
        instructions: instructionsArr
      })

      dbPost.save();

      await User.updateOne(
        {username: currentUser.username},
        {$push: {posts: dbPost._id}}
      )

      res.status(201).json("New post created");
      
    } 
    catch (error) {
      //send error
        res.status(400).json(error);
    }
});

app.put("/posts/:id", verifyJWT,async (req, res) => {
  try {
    const currentUser = req.user.username;
    const currentPost = await Post.findById(req.params.id);
    const newPost = req.body;
    const equipArr = newPost.requiredEquipment.split(",");
    const instructionsArr = newPost.instructions.split(",");

    if(currentUser == currentPost.username){
        currentPost.title = newPost.title;
        currentPost.description = newPost.description;
        currentPost.brewType = newPost.brewType;
        currentPost.coffeeAmount = newPost.coffeeAmount;
        currentPost.iced = newPost.iced;
        currentPost.brewTimeSeconds = newPost.brewTimeSeconds;
        currentPost.requiredEquipment = equipArr;
        currentPost.instructions = instructionsArr

        currentPost.save(function(err) {
          if(err){
            res.send(err);
            return
          }
          res.json({
            success: true,
            message: "Post info updato"
          })
        })
    }
  }
  catch(error) {
    res.status(400).json(error);
  }
})

app.delete("/posts/:id", verifyJWT, async (req, res) => {
  try{
    const postToDelete = await Post.findById(req.params.id);
    if(req.user.username == postToDelete.username){
      Post.findByIdAndDelete(req.params.id);
      console.log(req.params.id)
      res.json({
        success: true,
        message: "Post deleted"
      })
    }
  }
  catch(error) {
    res.status(400).json(error);
  }
})

//registration route; checks for existing user if no user exists creates user, hashes password, saves to db
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

app.post("/login", async (req, res) => {
  const userLogIn = req.body;


 await User.findOne({username: userLogIn.username.toLowerCase()})
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