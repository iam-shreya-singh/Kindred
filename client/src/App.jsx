import { useState, useEffect } from 'react';
import io from 'socket.io-client';

// Connect to your backend server

const socket = io("https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/");
function App() {
  
 const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (currentMessage !== "") {
      const messageData = {
        message: currentMessage,
        time: new Date(Date.now()).toLocaleTimeString(),
      };
      
      await socket.emit("send_message", messageData);
      setCurrentMessage(""); // Clear the input box
    }
  };

   useEffect(() => {
    // Function to handle receiving a message
    const receiveMessageHandler = (data) => {
      setMessageList((list) => [...list, data]);
    };

    // Set up the event listener
    socket.on("receive_message", receiveMessageHandler);

    // Clean up the listener when the component unmounts
    return () => {
      socket.off("receive_message", receiveMessageHandler);
    };
  }, []); // Run this effect only once

  return (
    <div className="App">
      <div className="chat-header">
        <h2>Kindred Global Chat</h2>
      </div>
      <div className="chat-body">
        {messageList.map((msg, index) => (
          <div key={index} className="message">
            <p className="message-content">{msg.message}</p>
            <p className="message-meta">{msg.time}</p>
          </div>
        ))}
      </div>
      <div className="chat-footer">
        <form onSubmit={sendMessage}>
          <input
            type="text"
            value={currentMessage}
            placeholder="What's on your mind?"
            onChange={(e) => setCurrentMessage(e.target.value)}
          />
          <button type="submit">➤</button>
        </form>
      </div>
    </div>
  );
}

export default App;