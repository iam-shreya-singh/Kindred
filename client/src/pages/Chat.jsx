// client/src/pages/Chat.jsx - WITH NOTIFICATIONS

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from "socket.io-client";
import { format } from 'timeago.js';
import {
  Box, Button, VStack, HStack, Heading, Container, Text, Avatar, Spinner, Flex, Divider, Input
} from '@chakra-ui/react';

// NOTE: We are temporarily removing the typing indicator code to focus on this new feature.
// We can add it back later.

const Chat = () => {
  // --- State ---
  const [users, setUsers] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  // NOTIFICATION: State to track notifications. Stores an array of senderIds.
  const [notifications, setNotifications] = useState([]);

  // --- Refs ---
  const socket = useRef();
  const scrollRef = useRef();
  
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user'));

  // --- useEffect Hooks ---

  // 1. Establish Socket Connection & Set up Listeners
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    socket.current = io("https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/");
    socket.current.emit("addUser", currentUser._id);
    socket.current.on("getUsers", (users) => setOnlineUsers(users));
    
    // NOTIFICATION: The main message listener logic
    const messageListener = (data) => {
      // If the incoming message is for the currently active chat, just update the messages
      if (currentChat?._id === data.senderId) {
        setMessages((prev) => [...prev, { senderId: data.senderId, text: data.text, createdAt: Date.now() }]);
      } else {
        // If it's for a different chat, add a notification
        if (!notifications.includes(data.senderId)) {
          setNotifications(prev => [...prev, data.senderId]);
        }
      }
    };
    socket.current.on("getMessage", messageListener);
    
    return () => {
      socket.current.off("getMessage", messageListener);
      socket.current.disconnect();
    };
  }, [currentUser, navigate, currentChat, notifications]); // NOTIFICATION: Add dependencies


  // 2. Fetch all potential users
  useEffect(() => { /* No changes here */ const getUsers = async () => {try {const res = await axios.get("https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/api/users"); setUsers(res.data.filter(u => u._id !== currentUser._id));} catch (err) {console.log(err);}}; if(currentUser) getUsers();}, [currentUser]);

  // 3. Fetch messages for the selected chat
  useEffect(() => { /* No changes here */ const getMessages = async () => {if (currentChat) {const newConversationId = currentUser._id > currentChat._id ? currentUser._id + currentChat._id : currentChat._id + currentUser._id; setConversationId(newConversationId); try {const res = await axios.get(`https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/api/messages/${newConversationId}`); setMessages(res.data);} catch (err) {console.log(err);}}}; getMessages();}, [currentChat, currentUser]);

  // 4. Scroll to new message
  useEffect(() => { /* No changes here */ scrollRef.current?.scrollIntoView({ behavior: "smooth" });}, [messages]);


  // --- Handler Functions ---
  const handleLogout = () => { /* no change */ localStorage.clear(); navigate('/login'); };
  
  const handleSubmit = async (e) => { /* no change */ e.preventDefault(); if (!newMessage.trim()) return; const message = {senderId: currentUser._id, text: newMessage, conversationId: conversationId}; socket.current.emit("sendMessage", {senderId: currentUser._id, receiverId: currentChat._id, text: newMessage}); try {const res = await axios.post("https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/api/messages", message); setMessages([...messages, res.data]); setNewMessage("");} catch (err) {console.log(err);} };

  // NOTIFICATION: New handler for when a user is clicked
  const handleUserClick = (user) => {
    setCurrentChat(user);
    // Remove this user from the notifications array because we are now viewing the chat
    setNotifications(notifications.filter(id => id !== user._id));
  };


  // --- Render Logic ---
  return (
    <Container maxW="container.xl" p={0} height="100vh">
      <Flex h="100vh">
        {/* Left Side: Conversation List */}
        <Box w="30%" bg="gray.50" p={4} borderRightWidth={1}>
          <HStack justifyContent="space-between" mb={4}><Heading size="md">Welcome, {currentUser?.username}</Heading><Button size="sm" colorScheme="red" onClick={handleLogout}>Logout</Button></HStack>
          <VStack spacing={2} align="stretch">
            {users.map(user => (
              <HStack
                key={user._id}
                p={3}
                borderRadius="md"
                bg={currentChat?._id === user._id ? "teal.100" : "transparent"}
                _hover={{ bg: "gray.200", cursor: "pointer" }}
                onClick={() => handleUserClick(user)} // NOTIFICATION: Use the new handler
                position="relative" // NOTIFICATION: Needed for positioning the dot
              >
                <Avatar name={user.username} />
                <Text fontWeight="bold">{user.username}</Text>
                {/* NOTIFICATION: The notification dot UI */}
                {notifications.includes(user._id) && (
                  <Box 
                    position="absolute" 
                    top="8px" 
                    right="8px" 
                    w={3} 
                    h={3} 
                    bg="red.500" 
                    borderRadius="full" 
                  />
                )}
              </HStack>
            ))}
          </VStack>
        </Box>
        
        {/* Right Side: Chat Window (We've only changed one line here) */}
        <Box w="70%" display="flex" flexDirection="column">
          {currentChat ? (
            <>
              <Box p={4} bg="gray.100" borderBottomWidth={1}><Heading size="lg">{currentChat.username}</Heading></Box>
              <VStack flex="1" p={4} overflowY="auto" spacing={1} align="stretch">
                {messages.map((m, index) => (
                  <Flex key={index} ref={scrollRef} direction="column" alignSelf={m.senderId === currentUser._id ? 'flex-end' : 'flex-start'}>
                    <Box bg={m.senderId === currentUser._id ? "teal.400" : "gray.200"} color={m.senderId === currentUser._id ? "white" : "black"} px={4} py={2} borderRadius="lg" maxW="md">
                      <Text>{m.text}</Text>
                    </Box>
                    <Text fontSize="xs" color="gray.500" mt={1} alignSelf={m.senderId === currentUser._id ? 'flex-end' : 'flex-start'}>
                      {format(m.createdAt)}
                    </Text>
                  </Flex>
                ))}
              </VStack>
              <Box p={4} borderTopWidth={1}>
                <form onSubmit={handleSubmit}>
                  <HStack><Input placeholder="Type something..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} /><Button type="submit" colorScheme="teal">Send</Button></HStack>
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