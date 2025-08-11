//main server file
// server/index.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors()); // Enables CORS for all routes

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // In production change this to your frontend URL
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// A route to check if the server is running
app.get('/', (req, res) => {
  res.send('Kindred server is running!');
});

// Socket.IO connection logic
io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log('User Disconnected', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});