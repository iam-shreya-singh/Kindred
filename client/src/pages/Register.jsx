// client/src/pages/Register.jsx

import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Input, VStack, Heading, Container, FormControl, FormLabel, Text, Alert, AlertIcon
} from '@chakra-ui/react';

const Register = () => {
  // State to hold the form data
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // State for handling success or error messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // A hook from react-router-dom to programmatically navigate
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent the form from reloading the page
    setError(''); // Clear previous errors
    setSuccess('');

    try {
      // The URL for our backend registration endpoint
      const url = "https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/api/users/register";
      
      // Make the POST request using axios
      const res = await axios.post(url, { username, password });

      // If we get here, the request was successful
      setSuccess('Registration successful! Redirecting to login...');
      
      // After a short delay, redirect the user to the login page
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      // If the server responded with an error (like "Username already taken")
      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        // For other errors (like network issues)
        setError('Registration failed. Please try again.');
      }
    }
  };

  return (
    <Container centerContent p={4} height="100vh" bg="gray.50">
      <Box p={8} maxW="md" borderWidth={1} borderRadius="lg" boxShadow="lg" bg="white">
        <VStack as="form" onSubmit={handleSubmit} spacing={4}>
          <Heading size="lg">Create Your Account</Heading>
          
          <FormControl isRequired>
            <FormLabel>Username</FormLabel>
            <Input
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </FormControl>
          
          <FormControl isRequired>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              placeholder="Enter a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormControl>

          {/* Show error or success messages */}
          {error && <Alert status="error"><AlertIcon />{error}</Alert>}
          {success && <Alert status="success"><AlertIcon />{success}</Alert>}
          
          <Button type="submit" colorScheme="teal" width="full">
            Register
          </Button>
        </VStack>
      </Box>
    </Container>
  );
};

export default Register;