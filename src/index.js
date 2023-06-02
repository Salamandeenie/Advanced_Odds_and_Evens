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

const roomsData = new Map(); // Added initialization for roomsData

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

    if (!roomsData.has(room)) {
      roomsData.set(room, {
        secretNumber: 0,
        turnCounter: 0
      });
    }

    const roomData = roomsData.get(user.room);
    if(roomData.turnCounter < 1)
    {
      incrementTurn(room);
      incrementTurn(room);
    }
    else
    {
      roomData.turnCounter = 1;
    }

    user.roles = turnFinder(roomsData.get(room).turnCounter);

    socket.emit("message", generateMessage("System", `Hello ${user.username}! You are ${user.roles}! Good luck!`));

    socket.join(room);

    socket.emit("secretNumber", roomsData.get(room).secretNumber);

    socket.broadcast.to(room).emit("message", generateMessage("System", `${user.username} has joined!`));

    io.to(room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on("checkTurn", (action, message) => {
    const user = getUser(socket.id);
    const roomData = roomsData.get(user.room);
  
    // Check if it's the user's turn and turn count is not below zero
    if (
      user &&
      ((user.roles === "Odds" && roomData.turnCounter >= 0 && roomData.turnCounter % 2 === 0) ||
        (user.roles === "Evens" && roomData.turnCounter >= 0 && roomData.turnCounter % 2 === 1))
    ) {
      if (action === "add") {
        roomData.secretNumber += message;
      } else if (action === "subtract") {
        roomData.secretNumber -= message;
      } else if (action === "modulo") {
        roomData.secretNumber %= message;
      } else if (action === "absolute") {
        roomData.secretNumber = Math.abs(roomData.secretNumber);
      } else if (action === "rand") {
        roomData.secretNumber += randomInt(-10, 10);
      } else if (action === "peek") {
        // Emit the "peek" event to the client
        socket.emit("peek", user.username, roomData.secretNumber);
      }
  
      io.to(user.room).emit("message", generateMessage("System", `${user.username} has made a move!`));
      // Update the turn counter
      incrementTurn(user.room);
  
      // Emit the updated secret number to all clients
      io.to(user.room).emit("secretNumber", roomData.secretNumber);
  
      // Emit the "isTurn" event to the client
      socket.emit("isTurn");
    } else {
      // It's not the user's turn or the turn count is below zero
      socket.emit("turnError", "It's not your turn yet.");
    }
  });
  
  socket.on("peek", () => {
    const user = getUser(socket.id);
    const roomData = roomsData.get(user.room);
  
    // Check if it's the user's turn and turn count is not below zero
    if (
      user &&
      ((user.roles === "Odds" && roomData.turnCounter >= 0 && roomData.turnCounter % 2 === 0) ||
        (user.roles === "Evens" && roomData.turnCounter >= 0 && roomData.turnCounter % 2 === 1))
    ) {
      socket.emit("turnError", "Currently the secret number is: " + roomData.secretNumber);
      io.to(user.room).emit("message", generateMessage("System", `${user.username} has made a move!`));
      // Update the turn counter
      incrementTurn(user.room);
    } else {
      // It's not the user's turn or the turn count is below zero
      socket.emit("turnError", "It's not your turn yet.");
    }
  });

  function incrementTurn(room) {
    const roomData = roomsData.get(room);
    roomData.turnCounter++;
    console.log(roomData.turnCounter);

    io.to(room).emit("roomData", {
      room,
      users: getUsersInRoom(room),
      turnCounter: roomData.turnCounter,
      turnname: turnFinder(roomData.turnCounter)
    });

    if (roomData.turnCounter === 20) {
      const user = getUser(socket.id);
      const secretNumberInfo = getSecretNumberInfo(roomData.secretNumber);
      io.to(user.room).emit("turnAlert", secretNumberInfo);
      io.to(user.room).emit("cAlert", "Resetting Game turn count to zero");
      roomData.turnCounter = 1;
      roomData.secretNumber = 0;
    }
  }

  function getSecretNumberInfo(secretNumber) {
    let secretNumberInfo = "";

    if (secretNumber === null || secretNumber === undefined || isNaN(secretNumber)) {
      secretNumberInfo = "Invalid Secret Number - Both players lose!";
    } else if (secretNumber === 0) {
      secretNumberInfo = "Zero - Both players lose!";
    } else if (secretNumber % 2 === 0) {
      if (secretNumber > 0) {
        secretNumberInfo = "Positive Even";
      } else {
        secretNumberInfo = "Negative Even";
      }
      secretNumberInfo += " - Evens Win!";
    } else {
      if (secretNumber > 0) {
        secretNumberInfo = "Positive Odd";
      } else {
        secretNumberInfo = "Negative Odd";
      }
      secretNumberInfo += " - Odds Win!";
    }

    return secretNumberInfo;
  }
  socket.on("sendMessage", (message) => {
    const user = getUser(socket.id);
    const roomData = roomsData.get(user.room);
  
    // Check if it's the user's turn and turn count is not below zero
    if (
      user &&
      ((user.roles === "Odds" && roomData.turnCounter >= 0 && roomData.turnCounter % 2 === 0) ||
        (user.roles === "Evens" && roomData.turnCounter >= 0 && roomData.turnCounter % 2 === 1))
    ) {
      if (message === "peek") {
        io.to(user.room).emit("peek", user.username, roomData.secretNumber);
      } else {
        io.to(user.room).emit("message", generateMessage(user.username, message));
      }
  
      // Increment the turn counter on each message sent
      incrementTurn(user.room);
    } else {
      // It's not the user's turn or the turn count is below zero
      socket.emit("turnError", "It's not your turn yet.");
    }
  });
  

  function turnFinder(turncount) {
    if (turncount % 2 == 0) {
      return "Evens";
    } else {
      return "Odds";
    }
  }

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit("message", generateMessage("System", `${user.username} has left!`));
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });

      if (getUsersInRoom(user.room).length === 0) {
        roomsData.delete(user.room);
        console.log(`${user.room} has been reset`);
      }
    }
  });
});

server.listen(port, () => console.log(`App is listening on port ${port}.`));
