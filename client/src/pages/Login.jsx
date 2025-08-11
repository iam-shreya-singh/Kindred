// client/src/pages/Login.jsx

import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Input, VStack, Heading, Container, FormControl, FormLabel, Text, Alert, AlertIcon, Link
} from '@chakra-ui/react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const url = "https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/api/users/login";
      
      // Make the login request
      const res = await axios.post(url, { username, password });

      // ** IMPORTANT: Save the token **
      // We are saving the JWT we received from the server in the browser's localStorage.
      // This is how we'll stay logged in across page reloads.
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data)); // Store user details too

      // Navigate to the main chat page (which we'll create next)
      navigate('/');

    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        setError('Login failed. Please check your connection.');
      }
    }
  };

  return (
    <Container centerContent p={4} height="100vh" bg="gray.50">
      <Box p={8} maxW="md" borderWidth={1} borderRadius="lg" boxShadow="lg" bg="white">
        <VStack as="form" onSubmit={handleSubmit} spacing={4}>
          <Heading size="lg">Welcome Back</Heading>
          
          <FormControl isRequired>
            <FormLabel>Username</FormLabel>
            <Input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </FormControl>
          
          <FormControl isRequired>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormControl>

          {error && <Alert status="error"><AlertIcon />{error}</Alert>}
          
          <Button type="submit" colorScheme="teal" width="full">
            Login
          </Button>

          <Text>
            Don't have an account?{' '}
            <Link color="teal.500" onClick={() => navigate('/register')}>
              Register here
            </Link>
          </Text>
        </VStack>
      </Box>
    </Container>
  );
};

export default Login;