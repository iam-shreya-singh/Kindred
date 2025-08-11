// client/src/pages/Chat.jsx - FINAL VERSION WITH PERSISTENT MESSAGES

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from "socket.io-client";
import {
  Box, Button, VStack, HStack, Heading, Container, Text, Avatar, Spinner, Flex, Divider, Input
} from '@chakra-ui/react';

const Chat = () => {
  // State
  const [users, setUsers] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  
  // Refs
  const socket = useRef();
  const scrollRef = useRef();
  
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user'));

  // --- useEffect Hooks ---

  // Initial redirect and socket connection setup
  useEffect(() => {
    if (!currentUser) navigate('/login');
    socket.current = io("https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/");
    socket.current.on("getMessage", (data) => {
      setMessages((prev) => [...prev, { senderId: data.senderId, text: data.text, createdAt: Date.now() }]);
    });
    return () => socket.current.disconnect();
  }, [currentUser, navigate]);

  // Handle online users
  useEffect(() => {
    if (socket.current && currentUser) {
      socket.current.emit("addUser", currentUser._id);
      socket.current.on("getUsers", (users) => setOnlineUsers(users));
    }
  }, [currentUser, socket]);

  // Fetch all users
  useEffect(() => {
    const getUsers = async () => {
      try {
        const res = await axios.get("https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/api/users");
        setUsers(res.data.filter(u => u._id !== currentUser._id));
      } catch (err) {
        console.log(err);
      }
    };
    getUsers();
  }, [currentUser]);

  // Fetch messages when a new chat is selected
  useEffect(() => {
    if (currentChat) {
      // Create a consistent conversation ID
      const newConversationId = currentUser._id > currentChat._id
        ? currentUser._id + currentChat._id
        : currentChat._id + currentUser._id;
      setConversationId(newConversationId);

      const getMessages = async () => {
        try {
          const res = await axios.get(`https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/api/messages/${newConversationId}`);
          setMessages(res.data);
        } catch (err) {
          console.log(err);
        }
      };
      getMessages();
    }
  }, [currentChat, currentUser]);

  // Scroll to new message
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
      text: newMessage,
      conversationId: conversationId, // Use the generated ID
    };

    // 1. Send message to Socket.IO for real-time delivery
    socket.current.emit("sendMessage", {
      senderId: currentUser._id,
      receiverId: currentChat._id,
      text: newMessage,
    });

    // 2. Save the message to the database via API
    try {
      const res = await axios.post("https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/api/messages", message);
      setMessages([...messages, res.data]);
      setNewMessage("");
    } catch (err) {
      console.log(err);
    }
  };

  // --- Render Logic (no changes needed here) ---
  return (
     <Container maxW="container.xl" p={0} height="100vh">
      <Flex h="100vh">
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
                onClick={() => setCurrentChat(user)}
              >
                <Avatar name={user.username} />
                <Text fontWeight="bold">{user.username}</Text>
                {onlineUsers.some(ou => ou.userId === user._id) && <Box w={2} h={2} bg="green.400" borderRadius="full" />}
              </HStack>
            ))}
          </VStack>
        </Box>
        <Box w="70%" display="flex" flexDirection="column">
          {currentChat ? (
            <>
              <Box p={4} bg="gray.100" borderBottomWidth={1}><Heading size="lg">{currentChat.username}</Heading></Box>
              <VStack flex="1" p={4} overflowY="auto" spacing={4} align="start">
                {messages.map((m, index) => (
                  <Box key={index} ref={scrollRef} alignSelf={m.senderId === currentUser._id ? 'flex-end' : 'flex-start'}>
                    <Box bg={m.senderId === currentUser._id ? "teal.400" : "gray.200"} color={m.senderId === currentUser._id ? "white" : "black"} px={4} py={2} borderRadius="lg" maxW="md">
                      <Text>{m.text}</Text>
                    </Box>
                  </Box>
                ))}
              </VStack>
              <Box p={4} borderTopWidth={1}>
                <form onSubmit={handleSubmit}>
                  <HStack>
                    <Input placeholder="Type something..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                    <Button type="submit" colorScheme="teal">Send</Button>
                  </HStack>
                </form>
              </Box>
            </>
          ) : (
            <Flex justifyContent="center" alignItems="center" h="full"><Text fontSize="xl" color="gray.400">Select a conversation to start chatting</Text></Flex>
          )}
        </Box>
      </Flex>
    </Container>
  );
};

export default Chat;