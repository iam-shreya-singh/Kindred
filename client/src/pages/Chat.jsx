// client/src/pages/Chat.jsx - FINAL STABLE VERSION

import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { format } from 'timeago.js';
import {
  Box, Button, VStack, HStack, Heading, Container, Text, Avatar, Spinner, Flex
} from '@chakra-ui/react';
import { initiateSocketConnection, getSocket, disconnectSocket } from '../socket';

const icebreakerPrompts = [
  "What's a small thing that brought you joy this week?",
  "Is there a book, movie, or song that has deeply influenced you recently?",
  "What's a skill you'd love to learn if you had the time?",
];

const Chat = ({ onLogout }) => {
  // --- State ---
  const [users, setUsers] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [prompt, setPrompt] = useState("");
  
  // --- Refs ---
  const scrollRef = useRef();
  // This ref is CRITICAL. It lets us access the current chat inside our socket listeners
  // without needing to add it as a dependency to the main useEffect.
  const currentChatRef = useRef(null);

  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user'));

  // --- useEffect Hooks ---

  // Main Effect for Socket, Listeners, and User Fetching.
  // This hook has an empty dependency array `[]`. It will run ONLY ONCE.
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return; // Stop execution if no user
    }

    const socket = initiateSocketConnection();

    // SETUP ALL LISTENERS HERE, ONCE AND FOR ALL
    socket.on("getUsers", (users) => {
      setOnlineUsers(users);
    });

    const messageListener = (data) => {
      // Use the ref to get the most up-to-date value of the current chat
      const activeChat = currentChatRef.current;
      
      if (activeChat?._id === data.senderId) {
        // If the message is for the chat we're looking at, add it to the messages
        setMessages((prev) => [...prev, { senderId: data.senderId, text: data.text, createdAt: Date.now() }]);
      } else {
        // Otherwise, it's a notification for another chat
        setNotifications(prev => prev.includes(data.senderId) ? prev : [...prev, data.senderId]);
      }
    };
    socket.on("getMessage", messageListener);
    
    // Announce our presence to the server
    socket.emit("addUser", currentUser._id);

    // Fetch all users
    const getUsers = async () => {
      try {
        const res = await axios.get("https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/api/users");
        setUsers(res.data.filter(u => u._id !== currentUser._id));
      } catch (err) { console.log(err); }
    };
    getUsers();

    // The cleanup function. This will run ONLY when you navigate away from the chat page for good.
    return () => {
      socket.off("getMessage", messageListener); // Remove the specific listener
      socket.off("getUsers");
      disconnectSocket();
    };
  }, []); // <-- The empty dependency array is the key to preventing loops.

  // This separate effect keeps our ref in sync with our state.
  useEffect(() => {
    currentChatRef.current = currentChat;
  }, [currentChat]);

  // This effect fetches message history ONLY when the user clicks on a new chat.
  useEffect(() => {
    const getMessages = async () => {
      if (currentChat) {
        setPrompt("");
        const newConversationId = currentUser._id > currentChat._id ? currentUser._id + currentChat._id : currentChat._id + currentUser._id;
        setConversationId(newConversationId);
        try {
          const res = await axios.get(`https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/api/messages/${newConversationId}`);
          setMessages(res.data);
          if (res.data.length === 0) {
            const randomPrompt = icebreakerPrompts[Math.floor(Math.random() * icebreakerPrompts.length)];
            setPrompt(randomPrompt);
          }
        } catch (err) { console.log(err); }
      }
    };
    getMessages();
  }, [currentChat, currentUser]);

  // This effect scrolls to the bottom when new messages arrive.
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Handler Functions ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentChat) return;
    const socket = getSocket();
    const message = { senderId: currentUser._id, text: newMessage, conversationId: conversationId };
    socket.emit("sendMessage", { senderId: currentUser._id, receiverId: currentChat._id, text: newMessage });
    try {
      const res = await axios.post("https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/api/messages", message);
      setMessages([...messages, res.data]);
      setNewMessage("");
    } catch (err) { console.log(err); }
  };
  
  const handleUserClick = (user) => {
    setCurrentChat(user);
    setNotifications(prev => prev.filter(id => id !== user._id));
  };

  // --- Render Logic (This is where the Input component was missing) ---
  return (
    <Container maxW="container.xl" p={0} height="100vh">
      <Flex h="100vh">
        <Box w="30%" bg="gray.50" p={4} borderRightWidth={1}>
          <HStack justifyContent="space-between" mb={4}><Heading size="md">Welcome, {currentUser?.username}</Heading><Button size="sm" colorScheme="red" onClick={onLogout}>Logout</Button></HStack>
          <VStack spacing={2} align="stretch">
            {users.map(user => (
              <HStack key={user._id} p={3} borderRadius="md" bg={currentChat?._id === user._id ? "teal.100" : "transparent"} _hover={{ bg: "gray.200", cursor: "pointer" }} onClick={() => handleUserClick(user)} position="relative" justifyContent="space-between">
                <HStack>
                  <Avatar name={user.username} />
                  <Text fontWeight="bold">{user.username}</Text>
                  {notifications.includes(user._id) && (<Box position="absolute" left="35px" top="8px" w={3} h={3} bg="red.500" borderRadius="full" />)}
                </HStack>
                <Link to={`/profile/${user._id}`} onClick={(e) => e.stopPropagation()}><Button size="xs">Profile</Button></Link>
              </HStack>
            ))}
          </VStack>
        </Box>
        <Box w="70%" display="flex" flexDirection="column">
          {currentChat ? (
            <>
              <Box p={4} bg="gray.100" borderBottomWidth={1}><Heading size="lg">{currentChat.username}</Heading></Box>
              <VStack flex="1" p={4} overflowY="auto" spacing={1} align="stretch">
                {prompt && (<Box p={4} bg="yellow.100" borderRadius="md" mb={4} textAlign="center"><Text fontSize="sm" color="gray.600" fontStyle="italic">New conversation? Try this icebreaker:</Text><Text fontWeight="bold" mt={1}>{prompt}</Text></Box>)}
                {messages.map((m, index) => (<Flex key={index} ref={scrollRef} direction="column" alignSelf={m.senderId === currentUser._id ? 'flex-end' : 'flex-start'}><Box bg={m.senderId === currentUser._id ? "teal.400" : "gray.200"} color={m.senderId === currentUser._id ? "white" : "black"} px={4} py={2} borderRadius="lg" maxW="md"><Text>{m.text}</Text></Box><Text fontSize="xs" color="gray.500" mt={1} alignSelf={m.senderId === currentUser._id ? 'flex-end' : 'flex-start'}>{format(m.createdAt)}</Text></Flex>))}
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
          ) : (<Flex justifyContent="center" alignItems="center" h="full"><Text fontSize="xl" color="gray.400">Select a conversation to start chatting</Text></Flex>)}
        </Box>
      </Flex>
    </Container>
  );
};

export default Chat;