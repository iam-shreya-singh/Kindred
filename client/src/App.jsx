// client/src/App.jsx

import { Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login'; 
import Chat from './pages/Chat';
import Profile from './pages/Profile'; // Import the Profile component
function App() {
  // Simple check to see if we have a token
  const token = localStorage.getItem('token');

  return (
    <Routes>
      {/* If logged in, the root path '/' goes to Chat. Otherwise, it goes to Login. */}
      <Route path="/" element={token ? <Chat /> : <Navigate to="/login" />} />
      
      {/* If logged in, trying to go to /login or /register redirects to Chat. */}
      <Route path="/login" element={token ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={token ? <Navigate to="/" /> : <Register />} />
      
       {/* 2. Add the new profile route */}
      <Route path="/profile/:userId" element={token ? <Profile /> : <Navigate to="/login" />} />

    </Routes>
  );
}

  export default App;