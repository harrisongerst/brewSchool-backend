const mongoose = require('mongoose');


const postSchema = new mongoose.Schema({
    username: {type: String, required: true},
    password: {type: String, required: true},
    title: {type: String, required: true},
    description: {type: String, required: true, required: true},
    date: {type: Date, default: Date.now},
    brewType: {type: String, required: true, enum: ['Pourover', 'Aeropress', 'Other']},
    coffeeAmount: {type: Number, required: true, min: [6, 'Must enter 6 or more grams, got {VALUE}']},
    iced: {type: Boolean, required: true},
    brewTimeSeconds: {type: Number, required: true, min: [60, 'Brew time must exceed 60 seconds, got {VALUE}']},
    requiredEquipment: {type: [String], required: false}
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;