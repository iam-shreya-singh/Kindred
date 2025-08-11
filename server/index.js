// First things first, let's pull in our secrets (like the database password)
// from the .env file so we don't have to hard-code them.
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
// Our new tool for talking to MongoDB.
const mongoose = require('mongoose');

// We'll bring in the new routes we created for user-related stuff.
const userRoutes = require('./routes/users');

// Standard server setup.
const app = express();
app.use(cors());
// This is an important new piece. It's like a translator that lets our server
// understand the JSON data (username, password) we'll be sending from the frontend forms.
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Alright, let's try to connect to our MongoDB database.
// If it works, we'll see a happy message in the console. If not, we'll see an error.
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Looks like we're connected to MongoDB!"))
  .catch(err => console.error("❌ Uh oh, MongoDB connection error:", err));


// Here's where we tell Express how to handle certain requests.
// If a request comes in for "/api/users/register", for example,
// Express will pass it off to our 'userRoutes' file to deal with it. This keeps our main file clean.
app.use('/api/users', userRoutes);


// All the real-time chat stuff still lives here.
// We'll keep it as-is for now and come back to it when we build private messaging.
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`A new friend connected: ${socket.id}`);

  socket.on('send_message', (data) => {
    console.log('Got a message, sending it to everyone:', data);
    io.emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log(`A friend disconnected: ${socket.id}`);
  });
});

// And finally, we start our server and listen for incoming requests.
server.listen(PORT, () => {
  console.log(`✅ Server is up and running on port ${PORT}`);
});