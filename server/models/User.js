
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // No two users can have the same username
    min: 3,
    max: 20,
  },
  password: {
    type: String,
    required: true,
    min: 6, // Enforce a minimum password length
  },
}, { timestamps: true }); // Automatically adds 'createdAt' and 'updatedAt' fields

module.exports = mongoose.model('User', UserSchema);