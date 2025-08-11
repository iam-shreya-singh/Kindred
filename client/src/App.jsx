// client/src/App.jsx

import { Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login'; 
import Chat from './pages/Chat';


  function App() {
  return (
    <Routes>
      <Route path="/" element={token ? <Chat /> : <Navigate to="/login" />} />

      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} /> {/* 2. Use the Login component */}
      
      {/* 3. Let's change the default redirect to /login now */}
      <Route path="/" element={<Navigate to="/login" />} /> 
    </Routes>
  );
}
export default App;