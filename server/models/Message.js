// server/models/Message.js

const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    // A conversation is always between two people. We can identify it
    // by combining the two user IDs.
    conversationId: {
      type: String,
    },
    senderId: {
      type: String,
    },
    text: {
      type: String,
    },
  },
  { timestamps: true } // This automatically adds createdAt and updatedAt
);

module.exports = mongoose.model("Message", MessageSchema);