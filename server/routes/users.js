// server/routes/users.js - CORRECTED
const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs'); // Corrected line

// REGISTER A NEW USER
router.post('/register', async (req, res) => {
  try {
    // 1. Check if username already exists
    const userExists = await User.findOne({ username: req.body.username });
    if (userExists) {
      return res.status(400).json({ message: "Username is already taken." });
    }

    // 2. Generate a new, hashed password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // 3. Create a new user object
    const newUser = new User({
      username: req.body.username,
      password: hashedPassword,
    });

    // 4. Save the user to the database and send response
    const user = await newUser.save();
    res.status(201).json({_id: user._id, username: user.username}); // Send back user info (without password)

  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;