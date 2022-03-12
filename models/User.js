const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
        type: String, 
        required: true, 
        unique: true,
        min: 5,
        max: 15
    },
    password: {
        type: String,
        required: true, 
    },
    //Relationship to posts
    posts: [{
        type: mongoose.Types.ObjectId,
        ref: "Posts"
    }],
}, {timestamps: true});

const User = mongoose.model("User", userSchema);

module.exports = User;