const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const { generateMessage } = require("./utils/messages");
const { addUser, removeUser, getUser, getUsersInRoom } = require("./utils/users");


const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

let secretNumber = 0; // Initialize the secret number
let turnCounter = -2; // Turn counter

io.on("connection", (socket) => {
  console.log("New connection");

  socket.on("join", (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });
  
    if (error) {
      return callback(error);
    }
  
    const room = user.room;
    const usersInRoom = getUsersInRoom(room);
  
    if (usersInRoom.length >= 3) {
      return callback("Room is full. Please try another room.");
    }
    if(turnCounter < 0)
    {
        incrementTurn();
    }
    else
    {
        turnCounter = 0;
    }

    // Determine player role (Odds or Evens) based on the turn count
    user.roles = (turnCounter % 2 === 0) ? "Evens" : "Odds";
  
    // Emit a welcome message to the current player with their role
    socket.emit("message", generateMessage("System", `Hello ${user.username}! You are ${user.roles}! Good luck!`));
  
    socket.join(room);
  
    socket.emit("secretNumber", secretNumber); // Emit the current secret number to the newly joined player
  
    socket.broadcast.to(room).emit("message", generateMessage("System", `${user.username} has joined!`));
  
    io.to(room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
  
    callback();
  });
  socket.on("checkTurn", (action, message) => {
    const user = getUser(socket.id);

    // Check if it's the user's turn and turn count is not below zero
    if (user && ((user.roles === "Odds" && turnCounter >= 0 && turnCounter % 2 === 0) || (user.roles === "Evens" && turnCounter >= 0 && turnCounter % 2 === 1))) {
      if (action === "add") {
        secretNumber += message;
      } else if (action === "subtract") {
        secretNumber -= message;
      } else if (action === "modulo") {
        secretNumber %= message;
      } else if (action === "absolute") {
        secretNumber = Math.abs(secretNumber);
      } else if (action === "rand") {
        secretNumber += randomInt(-10, 10);
      }
      io.to(user.room).emit("message", generateMessage("System", `${user.username} has made a move!`));
      // Update the turn counter
      incrementTurn();

      // Emit the updated secret number to all clients
      io.emit("secretNumber", secretNumber);

      // Emit the "isTurn" event to the client
      socket.emit("isTurn");
    } else {
      // It's not the user's turn or the turn count is below zero
      socket.emit("turnError", "It's not your turn yet.");
    }
  });

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }


  socket.on("updateSecretNumber", (newSecretNumber) => {
    secretNumber = newSecretNumber; // Update the secret number when received from the client
    io.emit("secretNumber", secretNumber); // Emit the updated secret number to all connected players
  });

  socket.on("sendMessage", (message) => {
    const user = getUser(socket.id);
  
    // Check if it's the user's turn and turn count is not below zero
    if (user && ((user.roles === "Odds" && turnCounter >= 0 && turnCounter % 2 === 0) || (user.roles === "Evens" && turnCounter >= 0 && turnCounter % 2 === 1))) {
      if (message === "peek") {
        io.to(user.room).emit("peek", user.username, secretNumber);
      } else {
        io.to(user.room).emit("message", generateMessage(user.username, message));
      }
  
      // Increment the turn counter on each message sent
      incrementTurn();
    } else {
      // It's not the user's turn or the turn count is below zero
      console.log(user.roles);
      socket.emit("turnError", "It's not your turn yet.");
    }
  });
  
  socket.on("peek", () => {
    const user = getUser(socket.id);
  
    // Check if it's the user's turn and turn count is not below zero
    if (
      user &&
      ((user.roles === "Odds" && turnCounter >= 0 && turnCounter % 2 === 0) ||
        (user.roles === "Evens" && turnCounter >= 0 && turnCounter % 2 === 1))
    ) {
        socket.emit("turnError", "Currently the secret number is: " + secretNumber);
        io.to(user.room).emit("message", generateMessage("System", `${user.username} has made a move!`));
      // Increment the turn counter on each message sent
      incrementTurn();
    } else {
      // It's not the user's turn or the turn count is below zero
      socket.emit("turnError", "It's not your turn yet.");
    }
  });
  
  
  
  
  

  function incrementTurn() {
    turnCounter++;
    console.log(turnCounter);
    const user = getUser(socket.id);
    // Emit the updated turn counter to the room
    io.emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
      turnCounter: turnCounter
    });
  
    // Check if it's turn 20
    if (turnCounter === 20) {
      const user = getUser(socket.id);
      const secretNumberInfo = getSecretNumberInfo(secretNumber);
      io.to(user.room).emit("turnAlert", secretNumberInfo);
      io.to(user.room).emit("cAlert", "Resetting Game turn count to zero");
      turnCounter = 0;
      secretNumber = 0;
    }
  }
  
  

  function getSecretNumberInfo(secretNumber) {
    let secretNumberInfo = "";
  
    if (secretNumber === null || secretNumber === undefined || isNaN(secretNumber)) {
      secretNumberInfo = "Invalid Secret Number - Both players lose!";
    } else if (secretNumber === 0) {
      secretNumberInfo = "Zero - Both players lose!";
    } else if (secretNumber % 2 === 0) {
      // Even number
      if (secretNumber > 0) {
        secretNumberInfo = "Positive Even";
      } else {
        secretNumberInfo = "Negative Even";
      }
      secretNumberInfo += " - Evens Win!";
    } else {
      // Odd number
      if (secretNumber > 0) {
        secretNumberInfo = "Positive Odd";
      } else {
        secretNumberInfo = "Negative Odd";
      }
      secretNumberInfo += " - Odds Win!";
    }
  
    return secretNumberInfo;
  }
  
  
  
  

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
  
    if (user) {
      io.to(user.room).emit("message", generateMessage("System", `${user.username} has left!`));
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
  
      // Reset secret number and turn counter if only one user remains in the room
      if (getUsersInRoom(user.room).length === 0) {
        secretNumber = 0;
        turnCounter = -2;
        console.log(`${user.room} has been reset`); 
      }
    }
  });
})  

server.listen(port, () => console.log(`App is listening on port ${port}.`));
