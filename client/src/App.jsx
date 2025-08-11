import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Box, Button, Input, VStack, HStack, Text, Heading, Container } from '@chakra-ui/react';


// Connect to your backend server

const socket = io("https://bug-free-space-parakeet-jqg754q94jrc576w-3001.app.github.dev/");
function App() {
  
  const [username, setUsername] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);

  const joinChat = () => {
    if (username !== "") {
      setShowChat(true);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (currentMessage !== "") {
      const messageData = {
        author: username,
        message: currentMessage,
        time: new Date(Date.now()).toLocaleTimeString ([], { hour: '2-digit', minute: '2-digit' }),
      };
      
      await socket.emit("send_message", messageData);
      setCurrentMessage(""); // Clear the input box
    }
  };

   useEffect(() => {
    // Function to handle receiving a message
    const receiveMessageHandler = (data) => {
      setMessageList((list) => [...list, data]);
    };

    // Set up the event listener
    socket.on("receive_message", receiveMessageHandler);

    // Clean up the listener when the component unmounts
    return () => {
      socket.off("receive_message", receiveMessageHandler);
    };
  }, []); // Run this effect only once

  return (
    <Container centerContent p={4} height="100vh" bg="gray.50">
      <VStack spacing={4} w="100%" maxW="lg">
        {!showChat ? (
          // Join Chat View
          <Box p={8} borderWidth={1} borderRadius="lg" boxShadow="lg" bg="white">
            <VStack spacing={4}>
              <Heading size="lg">Join Kindred Chat</Heading>
              <Input
                placeholder="Enter your name..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && joinChat()}
              />
              <Button onClick={joinChat} colorScheme="teal" width="full">
                Join Chat
              </Button>
            </VStack>
          </Box>
        ) : (
          // Chat View
          <Box w="100%" h="80vh" p={4} borderWidth={1} borderRadius="lg" boxShadow="lg" bg="white" display="flex" flexDirection="column">
            <Heading size="md" pb={4} borderBottomWidth={1}>
              Live Chat
            </Heading>
            <VStack spacing={4} overflowY="auto" flex="1" py={4} align="start">
              {messageList.map((msg, index) => (
                <Box key={index} alignSelf={username === msg.author ? "flex-end" : "flex-start"}>
                  <Box
                    bg={username === msg.author ? "teal.400" : "gray.200"}
                    color={username === msg.author ? "white" : "black"}
                    px={3}
                    py={2}
                    borderRadius="lg"
                  >
                    <Text>{msg.message}</Text>
                  </Box>
                  <HStack justify={username === msg.author ? "flex-end" : "flex-start"}>
                    <Text fontSize="xs" color="gray.500">{msg.author}</Text>
                    <Text fontSize="xs" color="gray.500">{msg.time}</Text>
                  </HStack>
                </Box>
              ))}
            </VStack>
            <form onSubmit={sendMessage} style={{ width: '100%' }}>
              <HStack>
                <Input
                  placeholder="Type a message..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                />
                <Button type="submit" colorScheme="teal">Send</Button>
              </HStack>
            </form>
          </Box>
        )}
      </VStack>
    </Container>
  );
}

export default App;