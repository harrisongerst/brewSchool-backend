const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
        type: String, 
        required: true, 
    },
    password: {
        type: String, 
    },
    //Relationship to posts
    posts: [{
        type: mongoose.Types.ObjectId,
        ref: "Posts"
    }],
});

const User = mongoose.model("User", userSchema);

module.exports = User;