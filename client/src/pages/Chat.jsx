// client/src/pages/Chat.jsx - WITH TYPING INDICATOR

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from "socket.io-client";
import {
  Box, Button, VStack, HStack, Heading, Container, Text, Avatar, Spinner, Flex, Divider, Input, keyframes
} from '@chakra-ui/react';

// TYPING: A simple animation for our typing indicator
const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
`;

const Chat = () => {
  // --- State ---
  const [users, setUsers] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  // TYPING: State to track if the other user is typing
  const [isTyping, setIsTyping] = useState(false);

  // --- Refs ---
  const socket = useRef();
  const scrollRef = useRef();
  // TYPING: A ref to manage the typing timeout
  const typingTimeoutRef = useRef(null);
  
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user'));

  // --- useEffect Hooks ---

  // Initial redirect and socket connection setup
  useEffect(() => {
    if (!currentUser) navigate('/login');
    socket.current = io("https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/");

    socket.current.on("getMessage", (data) => {
      // Make sure we only update messages for the currently active chat
      if (data.senderId === currentChat?._id) {
          setIsTyping(false); // They sent a message, so they stopped typing
          setMessages((prev) => [...prev, { senderId: data.senderId, text: data.text, createdAt: Date.now() }]);
      }
    });

    // TYPING: Listen for typing events from the server
    socket.current.on("typing_start_from_server", ({ senderId }) => {
      // Only show typing indicator if it's for the currently active chat
      if (senderId === currentChat?._id) {
        setIsTyping(true);
      }
    });
    socket.current.on("typing_stop_from_server", ({ senderId }) => {
      if (senderId === currentChat?._id) {
        setIsTyping(false);
      }
    });

    return () => socket.current.disconnect();
  }, [currentUser, navigate, currentChat]); // TYPING: Add currentChat to dependency array

  // ... (The other useEffects for online users, fetching users, fetching messages, and scrolling remain the same)
  // [No changes needed in the next 3 useEffect blocks]
    useEffect(() => {if (socket.current && currentUser) {socket.current.emit("addUser", currentUser._id); socket.current.on("getUsers", (users) => setOnlineUsers(users));}}, [currentUser, socket]);
    useEffect(() => {const getUsers = async () => {try {const res = await axios.get("https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/api/users"); setUsers(res.data.filter(u => u._id !== currentUser._id));} catch (err) {console.log(err);}};getUsers();}, [currentUser]);
    useEffect(() => {if (currentChat) {const newConversationId = currentUser._id > currentChat._id ? currentUser._id + currentChat._id : currentChat._id + currentUser._id; setConversationId(newConversationId); const getMessages = async () => {try {const res = await axios.get(`https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/api/messages/${newConversationId}`); setMessages(res.data);} catch (err) {console.log(err);}}; getMessages();} else {setIsTyping(false);}}, [currentChat, currentUser]);
    useEffect(() => {scrollRef.current?.scrollIntoView({ behavior: "smooth" });}, [messages]);


  // --- Handler Functions ---
  
  const handleLogout = () => { /* no change */ localStorage.clear(); navigate('/login'); };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // TYPING: Stop the typing indicator when we send a message
    socket.current.emit("typing_stop", { senderId: currentUser._id, receiverId: currentChat._id });

    const message = {senderId: currentUser._id, text: newMessage, conversationId: conversationId};
    socket.current.emit("sendMessage", {senderId: currentUser._id, receiverId: currentChat._id, text: newMessage});
    try {const res = await axios.post("https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/api/messages", message); setMessages([...messages, res.data]); setNewMessage("");} catch (err) {console.log(err);}
  };

  // TYPING: New handler for the input box's onChange event
  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    // If there's no typing timeout currently active, start one
    if (!typingTimeoutRef.current) {
      socket.current.emit("typing_start", { senderId: currentUser._id, receiverId: currentChat._id });
    }
    
    // Clear the previous timeout
    clearTimeout(typingTimeoutRef.current);
    
    // Set a new timeout. If the user doesn't type for 2 seconds, we'll send a 'typing_stop' event.
    typingTimeoutRef.current = setTimeout(() => {
      socket.current.emit("typing_stop", { senderId: currentUser._id, receiverId: currentChat._id });
      typingTimeoutRef.current = null; // Reset the timeout ref
    }, 2000);
  };


  // --- Render Logic ---
  return (
    <Container maxW="container.xl" p={0} height="100vh">
      <Flex h="100vh">
        {/* Left Side: Conversation List (no changes here) */}
        <Box w="30%" bg="gray.50" p={4} borderRightWidth={1}><HStack justifyContent="space-between" mb={4}><Heading size="md">Welcome, {currentUser?.username}</Heading><Button size="sm" colorScheme="red" onClick={handleLogout}>Logout</Button></HStack><VStack spacing={2} align="stretch">{users.map(user => (<HStack key={user._id} p={3} borderRadius="md" bg={currentChat?._id === user._id ? "teal.100" : "transparent"} _hover={{ bg: "gray.200", cursor: "pointer" }} onClick={() => setCurrentChat(user)}><Avatar name={user.username} /><Text fontWeight="bold">{user.username}</Text>{onlineUsers.some(ou => ou.userId === user._id) && <Box w={2} h={2} bg="green.400" borderRadius="full" />}</HStack>))}</VStack></Box>
        
        {/* Right Side: Chat Window */}
        <Box w="70%" display="flex" flexDirection="column">
          {currentChat ? (
            <>
              {/* Chat Header (no changes here) */}
              <Box p={4} bg="gray.100" borderBottomWidth={1}><Heading size="lg">{currentChat.username}</Heading></Box>
              
              {/* Messages Area */}
              <VStack flex="1" p={4} overflowY="auto" spacing={4} align="start">
                {messages.map((m, index) => ( <Box key={index} ref={scrollRef} alignSelf={m.senderId === currentUser._id ? 'flex-end' : 'flex-start'}><Box bg={m.senderId === currentUser._id ? "teal.400" : "gray.200"} color={m.senderId === currentUser._id ? "white" : "black"} px={4} py={2} borderRadius="lg" maxW="md"><Text>{m.text}</Text></Box></Box>))}
                
                {/* TYPING: The new typing indicator UI */}
                {isTyping && (
                  <HStack spacing={2} alignSelf="flex-start">
                    <Avatar size="xs" name={currentChat.username} />
                    <HStack spacing={1} bg="gray.200" px={3} py={2} borderRadius="lg">
                      <Box w="6px" h="6px" bg="gray.500" borderRadius="full" animation={`${bounce} 1s infinite`} />
                      <Box w="6px" h="6px" bg="gray.500" borderRadius="full" animation={`${bounce} 1s infinite 0.2s`} />
                      <Box w="6px" h="6px" bg="gray.500" borderRadius="full" animation={`${bounce} 1s infinite 0.4s`} />
                    </HStack>
                  </HStack>
                )}
              </VStack>

              {/* Message Input */}
              <Box p={4} borderTopWidth={1}>
                <form onSubmit={handleSubmit}>
                  <HStack>
                    <Input
                      placeholder="Type something..."
                      value={newMessage}
                      // TYPING: Use the new handleTyping handler
                      onChange={handleTyping}
                    />
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