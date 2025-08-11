// client/src/pages/Chat.jsx

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, VStack, HStack, Heading, Container, Text, Avatar, Spinner
} from '@chakra-ui/react';

const Chat = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Get the current user's data from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    // If there's no user or token, they shouldn't be here. Redirect to login.
    const token = localStorage.getItem('token');
    if (!token || !currentUser) {
      navigate('/login');
      return;
    }

    const fetchUsers = async () => {
      try {
        const url = "https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/api/users";
        const { data } = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` } // We'll use this for security later
        });
        
        // Filter out the current user from the list
        setUsers(data.filter(user => user._id !== currentUser._id));
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch users", error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, [navigate, currentUser]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <Container centerContent p={8}>
        <Spinner size="xl" />
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8}>
        <HStack width="full" justifyContent="space-between">
          <Heading>Welcome, {currentUser?.username}!</Heading>
          <Button colorScheme="red" onClick={handleLogout}>Logout</Button>
        </HStack>

        <Box width="full" p={4} borderWidth={1} borderRadius="lg">
          <Heading size="md" mb={4}>Connect with others</Heading>
          <VStack spacing={4} align="stretch">
            {users.map((user) => (
              <HStack 
                key={user._id} 
                p={3} 
                borderWidth={1} 
                borderRadius="md" 
                _hover={{ bg: "gray.100", cursor: "pointer" }}
                onClick={() => alert(`Starting chat with ${user.username}`)} // Placeholder for starting a chat
              >
                <Avatar name={user.username} />
                <Text fontWeight="bold">{user.username}</Text>
              </HStack>
            ))}
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default Chat;