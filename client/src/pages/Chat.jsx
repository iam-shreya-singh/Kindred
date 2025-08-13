// client/src/pages/Chat.jsx - FINAL ROBUST VERSION
import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from "socket.io-client";
import { format } from 'timeago.js';
import {
  Box, Button, VStack, HStack, Heading, Container, Text, Avatar, Spinner, Flex, Divider, Input
} from '@chakra-ui/react';

const Chat = () => {
  // --- State ---
  const [users, setUsers] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // --- Refs ---
  const socket = useRef();
  const scrollRef = useRef();
  
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user'));

  // --- useEffect Hooks: The Correct Structure ---

  // 1. Establish Socket Connection & Handle Online Users (runs only ONCE)
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    // Connect to the socket server
    socket.current = io("https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/");

    // Tell the server who we are
    socket.current.emit("addUser", currentUser._id);
    
    // Listen for the list of online users
    socket.current.on("getUsers", (users) => {
      setOnlineUsers(users);
    });
    
    // Disconnect when the component unmounts for good
    return () => {
      socket.current.disconnect();
    };
  }, [currentUser, navigate]);


  // 2. Set up event listener for incoming messages (runs ONCE)
  useEffect(() => {
    if (!socket.current) return;

    const messageListener = (data) => {
      // Check if the message is for the currently open chat
      if (currentChat?._id === data.senderId) {
        setMessages((prev) => [...prev, { senderId: data.senderId, text: data.text, createdAt: Date.now() }]);
      } else {
        // If not, it's a notification for another chat
        setNotifications((prev) => {
          // Avoid duplicate notifications
          if (prev.includes(data.senderId)) return prev;
          return [...prev, data.senderId];
        });
      }
    };
    socket.current.on("getMessage", messageListener);

    // Clean up this specific listener when the component unmounts
    return () => {
      socket.current.off("getMessage", messageListener);
    };
  }, [currentChat]); // This now correctly re-evaluates ONLY when `currentChat` changes


  // 3. Fetch all potential users (runs only ONCE)
  useEffect(() => {
    const getUsers = async () => {
      try {
        const res = await axios.get("https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/api/users");
        setUsers(res.data.filter(u => u._id !== currentUser._id));
      } catch (err) {
        console.log(err);
      }
    };
    if (currentUser) getUsers();
  }, [currentUser]);


  // 4. Fetch message history when a chat is selected
  useEffect(() => {
    const getMessages = async () => {
      if (currentChat) {
        const newConversationId = currentUser._id > currentChat._id ? currentUser._id + currentChat._id : currentChat._id + currentUser._id;
        setConversationId(newConversationId);
        try {
          const res = await axios.get(`https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/api/messages/${newConversationId}`);
          setMessages(res.data);
        } catch (err) {
          console.log(err);
        }
      }
    };
    getMessages();
  }, [currentChat, currentUser]);


  // 5. Scroll to new message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Handler Functions (Identical to before) ---
  const handleLogout = () => { localStorage.clear(); navigate('/login'); };
  const handleSubmit = async (e) => { e.preventDefault(); if (!newMessage.trim() || !currentChat) return; const message = { senderId: currentUser._id, text: newMessage, conversationId: conversationId }; socket.current.emit("sendMessage", { senderId: currentUser._id, receiverId: currentChat._id, text: newMessage }); try { const res = await axios.post("https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/api/messages", message); setMessages([...messages, res.data]); setNewMessage(""); } catch (err) { console.log(err); } };
  const handleUserClick = (user) => { setCurrentChat(user); setNotifications(prev => prev.filter(id => id !== user._id)); };

  // --- Render Logic (Identical to before) ---
  return (
    <Container maxW="container.xl" p={0} height="100vh">
      <Flex h="100vh">
        <Box w="30%" bg="gray.50" p={4} borderRightWidth={1}>
          <HStack justifyContent="space-between" mb={4}><Heading size="md">Welcome, {currentUser?.username}</Heading><Button size="sm" colorScheme="red" onClick={handleLogout}>Logout</Button></HStack>
          <VStack spacing={2} align="stretch">
            {users.map(user => (<HStack key={user._id} p={3} borderRadius="md" bg={currentChat?._id === user._id ? "teal.100" : "transparent"} _hover={{ bg: "gray.200", cursor: "pointer" }} onClick={() => handleUserClick(user)} position="relative"><Avatar name={user.username} /><Text fontWeight="bold">{user.username}</Text>{notifications.includes(user._id) && (<Box position="absolute" top="8px" right="8px" w={3} h={3} bg="red.500" borderRadius="full" />)}</HStack>))}
          </VStack>
        </Box>
        <Box w="70%" display="flex" flexDirection="column">
          {currentChat ? (
            <>
              <Box p={4} bg="gray.100" borderBottomWidth={1}><Heading size="lg">{currentChat.username}</Heading></Box>
              <VStack flex="1" p={4} overflowY="auto" spacing={1} align="stretch">
                {messages.map((m, index) => (<Flex key={index} ref={scrollRef} direction="column" alignSelf={m.senderId === currentUser._id ? 'flex-end' : 'flex-start'}><Box bg={m.senderId === currentUser._id ? "teal.400" : "gray.200"} color={m.senderId === currentUser._id ? "white" : "black"} px={4} py={2} borderRadius="lg" maxW="md"><Text>{m.text}</Text></Box><Text fontSize="xs" color="gray.500" mt={1} alignSelf={m.senderId === currentUser._id ? 'flex-end' : 'flex-start'}>{format(m.createdAt)}</Text></Flex>))}
              </VStack>
              <Box p={4} borderTopWidth={1}>
                <form onSubmit={handleSubmit}>
                <HStack><Input placeholder="Type something..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} /><Button type="submit" colorScheme="teal">Send</Button></HStack></form>
              </Box>
            </>
          ) : (<Flex justifyContent="center" alignItems="center" h="full"><Text fontSize="xl" color="gray.400">Select a conversation to start chatting</Text></Flex>)}
        </Box>
      </Flex>
    </Container>
  );
};

export default Chat;