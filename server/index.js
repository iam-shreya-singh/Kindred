// server/index.js - NEW VERSION FOR PRIVATE CHAT

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const mongoose = require('mongoose');
const userRoutes = require('./routes/users');

// --- Basic Setup ---
const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3001;

// --- DB Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// --- API Routes ---
app.use('/api/users', userRoutes);

// --- Socket.IO and Server Setup ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// --- Managing Online Users ---
// We need a way to map a userId to their unique socketId.
let onlineUsers = [];

const addUser = (userId, socketId) => {
  // If the user isn't already in our list, add them.
  !onlineUsers.some(user => user.userId === userId) &&
    onlineUsers.push({ userId, socketId });
};

const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter(user => user.socketId !== socketId);
};

const getUser = (userId) => {
  return onlineUsers.find(user => user.userId === userId);
};

// --- Real-time Logic ---
io.on('connection', (socket) => {
  // A user connects...
  console.log(`A user connected: ${socket.id}`);

  // ** NEW: A user tells us who they are **
  // We expect the client to send an 'addUser' event with their userId.
  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    // Send the updated list of online users to all clients.
    io.emit("getUsers", onlineUsers);
    console.log("Online users:", onlineUsers);
  });

  // ** NEW: A user sends a private message **
  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    // Find the receiver in our online users list.
    const receiver = getUser(receiverId);
    
    // If the receiver is online, send the message directly to them.
    if (receiver) {
      io.to(receiver.socketId).emit("getMessage", {
        senderId,
        text,
      });
      console.log(`Sent message from ${senderId} to ${receiverId}`);
    } else {
      // (Future feature): If the user is offline, we could save this message
      // to the database as an "unread" message. For now, we do nothing.
      console.log(`User ${receiverId} is not online.`);
    }
  });

  // A user disconnects...
  socket.on('disconnect', () => {
    console.log(`A user disconnected: ${socket.id}`);
    removeUser(socket.id);
    // Send the updated list of online users to all clients.
    io.emit("getUsers", onlineUsers);
  });
});

// --- Start Server ---
server.listen(PORT, () => {
  console.log(`✅ Server is up and running on port ${PORT}`);
});