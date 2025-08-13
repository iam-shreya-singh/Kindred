// client/src/pages/Profile.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Container, VStack, Heading, Text, Spinner, Avatar, Button
} from '@chakra-ui/react';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // The useParams hook gets the ':userId' from the URL
  const { userId } = useParams(); 
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/api/users/${userId}`);
        setUser(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch user profile", err);
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  if (loading) {
    return <Container centerContent p={8}><Spinner size="xl" /></Container>;
  }

  if (!user) {
    return <Container centerContent p={8}><Heading>User not found</Heading></Container>;
  }

  return (
    <Container centerContent p={8} bg="gray.50" minH="100vh">
      <VStack spacing={8} w="full" maxW="md">
        <Button onClick={() => navigate('/')} alignSelf="flex-start">
          &larr; Back to Chat
        </Button>
        <Box p={8} borderWidth={1} borderRadius="lg" boxShadow="lg" bg="white" w="full">
          <VStack spacing={4}>
            <Avatar size="2xl" name={user.username} />
            <Heading>{user.username}</Heading>
            <Text color="gray.500">
              Joined on: {new Date(user.createdAt).toLocaleDateString()}
            </Text>
            {/* We can add more profile details here in the future */}
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default Profile;