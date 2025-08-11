// client/src/pages/Chat.jsx - FINAL VERSION WITH 1-ON-1 CHAT

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from "socket.io-client";
import {
  Box, Button, VStack, HStack, Heading, Container, Text, Avatar, Spinner, Flex, Divider, Input
} from '@chakra-ui/react';

const Chat = () => {
  // State for holding users, the current chat, and messages
  const [users, setUsers] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  
  // Ref for the socket connection and for scrolling the message view
  const socket = useRef();
  const scrollRef = useRef();
  
  const navigate = useNavigate();

  // Get the current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user'));

  // --- Core useEffect for Initial Setup ---
  useEffect(() => {
    // Redirect to login if user data isn't available
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // --- useEffect for Socket.IO Connection ---
  useEffect(() => {
    // Establish the socket connection
    socket.current = io("https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/");
    
    // Listen for incoming messages
    socket.current.on("getMessage", (data) => {
      // Create a message object that matches our state structure
      const incomingMessage = {
        sender: data.senderId,
        text: data.text,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, incomingMessage]);
    });

    // Cleanup on component unmount
    return () => {
      socket.current.disconnect();
    };
  }, []);

  // --- useEffect for Managing Users and Online Status ---
  useEffect(() => {
    // Tell the socket server who we are
    if (socket.current && currentUser) {
      socket.current.emit("addUser", currentUser._id);
    }
    
    // Listen for the updated list of online users
    socket.current.on("getUsers", (users) => {
      setOnlineUsers(users);
    });

    // Fetch the list of all potential users to chat with
    const getUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get("https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/api/users", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(res.data.filter(u => u._id !== currentUser._id));
      } catch (err) {
        console.log(err);
      }
    };
    getUsers();
  }, [currentUser, socket]);

  // --- useEffect to scroll to the latest message ---
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Handler Functions ---
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      senderId: currentUser._id,
      receiverId: currentChat._id,
      text: newMessage,
    };

    // Send the message via Socket.IO
    socket.current.emit("sendMessage", message);

    // Add the message to our own UI immediately
    setMessages([...messages, { sender: currentUser._id, text: newMessage, createdAt: Date.now() }]);
    setNewMessage("");
  };

  // --- Render Logic ---
  return (
    <Container maxW="container.xl" p={0} height="100vh">
      <Flex h="100vh">
        {/* Left Side: Conversation List */}
        <Box w="30%" bg="gray.50" p={4} borderRightWidth={1}>
          <HStack justifyContent="space-between" mb={4}>
            <Heading size="md">Welcome, {currentUser?.username}</Heading>
            <Button size="sm" colorScheme="red" onClick={handleLogout}>Logout</Button>
          </HStack>
          <VStack spacing={2} align="stretch">
            {users.map(user => (
              <HStack 
                key={user._id} 
                p={3} 
                borderRadius="md" 
                bg={currentChat?._id === user._id ? "teal.100" : "transparent"}
                _hover={{ bg: "gray.200", cursor: "pointer" }}
                onClick={() => {setCurrentChat(user); setMessages([]);}} // Select user and clear previous messages
              >
                <Avatar name={user.username} />
                <Text fontWeight="bold">{user.username}</Text>
                {/* Optional: Show online status */}
                {onlineUsers.some(ou => ou.userId === user._id) && <Box w={2} h={2} bg="green.400" borderRadius="full" />}
              </HStack>
            ))}
          </VStack>
        </Box>

        {/* Right Side: Chat Window */}
        <Box w="70%" display="flex" flexDirection="column">
          {currentChat ? (
            <>
              {/* Chat Header */}
              <Box p={4} bg="gray.100" borderBottomWidth={1}>
                <Heading size="lg">{currentChat.username}</Heading>
              </Box>
              
              {/* Messages Area */}
              <VStack flex="1" p={4} overflowY="auto" spacing={4} align="start">
                {messages.map((m, index) => (
                  <Box 
                    key={index} 
                    ref={scrollRef}
                    alignSelf={m.sender === currentUser._id ? 'flex-end' : 'flex-start'}
                  >
                    <Box
                      bg={m.sender === currentUser._id ? "teal.400" : "gray.200"}
                      color={m.sender === currentUser._id ? "white" : "black"}
                      px={4} py={2} borderRadius="lg" maxW="md"
                    >
                      <Text>{m.text}</Text>
                    </Box>
                  </Box>
                ))}
              </VStack>

              {/* Message Input */}
              <Box p={4} borderTopWidth={1}>
                <form onSubmit={handleSubmit}>
                  <HStack>
                    <Input
                      placeholder="Type something..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <Button type="submit" colorScheme="teal">Send</Button>
                  </HStack>
                </form>
              </Box>
            </>
          ) : (
            <Flex justifyContent="center" alignItems="center" h="full">
              <Text fontSize="xl" color="gray.400">Select a conversation to start chatting</Text>
            </Flex>
          )}
        </Box>
      </Flex>
    </Container>
  );
};

export default Chat;