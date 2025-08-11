import { useState, useEffect } from 'react';
import io from 'socket.io-client';

// Connect to your backend server

const socket = io("https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/");
function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    // Listen for the 'connect' event
    socket.on('connect', () => {
      console.log("Connected to server!");
      setIsConnected(true);
    });

    // Listen for the 'disconnect' event
    socket.on('disconnect', () => {
      console.log("Disconnected from server!");
      setIsConnected(false);
    });

    // Clean up the event listeners when the component unmounts
    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  return (
    <div className="App">
      <h1>Welcome to Kindred</h1>
      <h2>Connection Status: {isConnected ? 'Connected ✅' : 'Disconnected ❌'}</h2>
    </div>
  );
}

export default App;