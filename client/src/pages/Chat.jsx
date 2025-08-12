// client/src/pages/Chat.jsx - CORRECTED VERSION WITH WORKING TYPING INDICATOR

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from "socket.io-client";
import {
  Box, Button, VStack, HStack, Heading, Container, Text, Avatar, Spinner, Flex, Divider, Input, keyframes
} from '@chakra-ui/react';

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
  const [isTyping, setIsTyping] = useState(false);

  // --- Refs ---
  const socket = useRef();
  const scrollRef = useRef();
  const typingTimeoutRef = useRef(null);
  
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user'));

  // --- useEffect Hooks ---

  // 1. Establish Socket Connection (runs only once)
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    socket.current = io("https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/");
    socket.current.emit("addUser", currentUser._id);
    socket.current.on("getUsers", (users) => setOnlineUsers(users));
    
    return () => {
      socket.current.disconnect();
    };
  }, [currentUser, navigate]);


  // 2. Fetch all potential users (runs only once)
  useEffect(() => {
    const getUsers = async () => {
      try {
        const res = await axios.get("https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/api/users");
        setUsers(res.data.filter(u => u._id !== currentUser._id));
      } catch (err) {
        console.log(err);
      }
    };
    if(currentUser) getUsers();
  }, [currentUser]);


  // 3. Fetch messages for the selected chat (runs when currentChat changes)
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
    setIsTyping(false); // Reset typing status when chat changes
  }, [currentChat, currentUser]);


  // 4. Set up socket event listeners (runs when currentChat changes)
  useEffect(() => {
    if (!socket.current) return;
    
    const messageListener = (data) => {
      if (currentChat && data.senderId === currentChat._id) {
        setIsTyping(false); // They sent a message, so they stopped typing
        setMessages((prev) => [...prev, { senderId: data.senderId, text: data.text, createdAt: Date.now() }]);
      }
    };

    const typingStartListener = ({ senderId }) => {
      if (currentChat && senderId === currentChat._id) {
        setIsTyping(true);
      }
    };

    const typingStopListener = ({ senderId }) => {
      if (currentChat && senderId === currentChat._id) {
        setIsTyping(false);
      }
    };

    socket.current.on("getMessage", messageListener);
    socket.current.on("typing_start_from_server", typingStartListener);
    socket.current.on("typing_stop_from_server", typingStopListener);

    // Cleanup function to remove listeners when the chat changes
    return () => {
      socket.current.off("getMessage", messageListener);
      socket.current.off("typing_start_from_server", typingStartListener);
      socket.current.off("typing_stop_from_server", typingStopListener);
    };
  }, [currentChat]); // This effect now correctly depends on `currentChat`


  // 5. Scroll to new message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  // --- Handler Functions (no changes to these) ---
  const handleLogout = () => { localStorage.clear(); navigate('/login'); };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentChat) return;
    socket.current.emit("typing_stop", { senderId: currentUser._id, receiverId: currentChat._id });
    const message = {senderId: currentUser._id, text: newMessage, conversationId: conversationId};
    socket.current.emit("sendMessage", {senderId: currentUser._id, receiverId: currentChat._id, text: newMessage});
    try {
      const res = await axios.post("https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/api/messages", message);
      setMessages([...messages, res.data]);
      setNewMessage("");
    } catch (err) { console.log(err); }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!currentChat) return;
    if (!typingTimeoutRef.current) {
      socket.current.emit("typing_start", { senderId: currentUser._id, receiverId: currentChat._id });
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.current.emit("typing_stop", { senderId: currentUser._id, receiverId: currentChat._id });
      typingTimeoutRef.current = null;
    }, 2000);
  };

  // --- Render Logic (Identical to before) ---
  return (
    <Container maxW="container.xl" p={0} height="100vh">
      <Flex h="100vh">
        <Box w="30%" bg="gray.50" p={4} borderRightWidth={1}><HStack justifyContent="space-between" mb={4}><Heading size="md">Welcome, {currentUser?.username}</Heading><Button size="sm" colorScheme="red" onClick={handleLogout}>Logout</Button></HStack><VStack spacing={2} align="stretch">{users.map(user => (<HStack key={user._id} p={3} borderRadius="md" bg={currentChat?._id === user._id ? "teal.100" : "transparent"} _hover={{ bg: "gray.200", cursor: "pointer" }} onClick={() => setCurrentChat(user)}><Avatar name={user.username} /><Text fontWeight="bold">{user.username}</Text>{onlineUsers.some(ou => ou.userId === user._id) && <Box w={2} h={2} bg="green.400" borderRadius="full" />}</HStack>))}</VStack></Box>
        <Box w="70%" display="flex" flexDirection="column">
          {currentChat ? (
            <>
              <Box p={4} bg="gray.100" borderBottomWidth={1}><Heading size="lg">{currentChat.username}</Heading></Box>
              <VStack flex="1" p={4} overflowY="auto" spacing={4} align="start">
                {messages.map((m, index) => ( <Box key={index} ref={scrollRef} alignSelf={m.senderId === currentUser._id ? 'flex-end' : 'flex-start'}><Box bg={m.senderId === currentUser._id ? "teal.400" : "gray.200"} color={m.senderId === currentUser._id ? "white" : "black"} px={4} py={2} borderRadius="lg" maxW="md"><Text>{m.text}</Text></Box></Box>))}
                {isTyping && (<HStack spacing={2} alignSelf="flex-start"><Avatar size="xs" name={currentChat.username} /><HStack spacing={1} bg="gray.200" px={3} py={2} borderRadius="lg"><Box w="6px" h="6px" bg="gray.500" borderRadius="full" animation={`${bounce} 1s infinite`} /><Box w="6px" h="6px" bg="gray.500" borderRadius="full" animation={`${bounce} 1s infinite 0.2s`} /><Box w="6px" h="6px" bg="gray.500" borderRadius="full" animation={`${bounce} 1s infinite 0.4s`} /></HStack></HStack>)}
              </VStack>
              <Box p={4} borderTopWidth={1}>
                <form onSubmit={handleSubmit}>
                  <HStack>
                    <Input placeholder="Type something..." value={newMessage} onChange={handleTyping} />
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