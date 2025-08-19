// client/src/App.jsx - to manage authentication login state

import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login'; 
import Chat from './pages/Chat';
import Profile from './pages/Profile';

function App() {
  // We now manage the token in React state, initialized from localStorage.
  const [token, setToken] = useState(localStorage.getItem('token'));


  // This function will be passed to the Login component.
  // When called, it updates both the state and localStorage.
  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };
  // ** 1. ADD THE NEW LOGOUT FUNCTION **
  const handleLogout = () => {
    // Clear everything from state and storage
    localStorage.removeItem('token');
    localStorage.removeItem('user'); // Also clear the user object
    setToken(null);
    // The redirect will happen automatically because the token state is now null
  };

  // When the component loads, check localStorage once.
  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, []);

  return (
    <Routes>
      <Route path="/" element={token ? <Chat onLogout={handleLogout} /> : <Navigate to="/login" />} />
      <Route path="/" element={token ? <Chat /> : <Navigate to="/login" />} />
      
      {/* Pass the handleLogin function as a prop to the Login component */}
      <Route path="/login" element={token ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />

      <Route path="/register" element={token ? <Navigate to="/" /> : <Register />} />
      <Route path="/profile/:userId" element={token ? <Profile /> : <Navigate to="/login" />} />
    </Routes>
  );
}

export default App;