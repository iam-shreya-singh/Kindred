// client/src/App.jsx

import { Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
// We'll create these pages next
// import Login from './pages/Login'; 
// import Chat from './pages/Chat';

function App() {
  return (
    <Routes>
      {/* The /register route will show our new Register component */}
      <Route path="/register" element={<Register />} />
      
      {/* For now, the /login route will just show a simple message */}
      <Route path="/login" element={<h1>Login Page (Coming Soon!)</h1>} />
      
      {/* We'll make the root path redirect to register for now */}
      <Route path="/" element={<Navigate to="/register" />} />
    </Routes>
  );
}

export default App;