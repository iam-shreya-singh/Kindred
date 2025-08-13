// server/routes/users.js - CORRECTED
const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs'); // Corrected line
const jwt = require('jsonwebtoken');

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
// LOGIN
router.post('/login', async (req, res) => {
  try {
    // 1. Find the user by their username
    const user = await User.findOne({ username: req.body.username });
    if (!user) {
      // We use a generic message to avoid telling attackers which usernames exist
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 2. Compare the submitted password with the one in the database
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 3. If credentials are correct, create a JSON Web Token (JWT)
    const token = jwt.sign(
      { id: user._id, username: user.username }, // This is the data we're encoding in the token
      process.env.JWT_SECRET,                      // The secret key from our .env file
      { expiresIn: '1d' }                          // The token will expire in 1 day
    );

    // 4. Send the user info and the token back to the client
    // We remove the password from the user object before sending it
    const { password, ...otherDetails } = user._doc; 
    res.status(200).json({ ...otherDetails, token });

  } catch (err) {
    res.status(500).json(err);
  }
});

  // GET ALL USERS
router.get("/", async (req, res) => {
  try {
    // For now, we'll get all users. In the future, we can add pagination.
    const users = await User.find({}).select("-password"); // .select("-password") prevents passwords from being sent
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET A SINGLE USER BY ID

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});


module.exports = router;