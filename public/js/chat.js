const socket = io();

const $messageForm = document.querySelector("#message-form");
const $messageFormInput = document.querySelector("input");
const $messageFormButton = document.getElementById("send-chat");
const $messageAddButton = document.getElementById("send-add");
const $messageSubButton = document.getElementById("send-sub");
const $messageModButton = document.getElementById("send-mod");
const $messageABSButton = document.getElementById("send-abs");
const $messageRandButton = document.getElementById("send-rand");
const $messagePeekButton = document.getElementById("send-peek");
const $messages = document.querySelector("#messages");

// Keep track of the secret number
let secretNumber = 0;

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  const $newMessage = $messages.lastElementChild;

  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  const visibleHeight = $messages.offsetHeight;

  const containerHeight = $messages.scrollHeight;

  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on("message", (message) => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("HH:mm"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("turnAlert", (secretNumberInfo) => {
  alert(`Turn 20: The secret number is ${secretNumberInfo}`);
});

socket.on("roomData", ({ room, users, turnCounter }) => {
    const turnname = (turnCounter % 2 === 0) ? "Odds" : "Evens"; // Determine current turn player's name
    const html = Mustache.render(sidebarTemplate, {
      room,
      turnname, // Pass the turn name to the template
      turn: turnCounter, // Pass the turn counter to the template
      users,
    });
    document.querySelector("#sidebar").innerHTML = html;
  });
  
socket.on("secretNumber", (number) => {
  secretNumber = number; // Update the secret number when received from the server
});

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const message = e.target.elements.message.value;

  socket.emit("sendMessage", message, (error) => {
    $messageFormInput.value = "";
    $messageFormInput.focus();

    if (error) {
      return console.log(error);
    }
    console.log("Message delivered!");
  });
});

// Event listeners for different action buttons
$messageAddButton.addEventListener("click", () => {
    const action = "add";
    const message = parseInt($messageFormInput.value);
    if (!isNaN(message) && Number.isInteger(message) && message >= -10 && message <= 10) {
      socket.emit("checkTurn", action, message);
    } else {
      alert("Please enter a valid integer between -10 and 10.");
    }
  });
  
  $messageSubButton.addEventListener("click", () => {
    const action = "subtract";
    const message = parseInt($messageFormInput.value);
    if (!isNaN(message) && Number.isInteger(message) && message >= -10 && message <= 10) {
      socket.emit("checkTurn", action, message);
    } else {
      alert("Please enter a valid integer between -10 and 10.");
    }
  });
  
  $messageModButton.addEventListener("click", () => {
    const action = "modulo";
    const inputNumber = parseInt($messageFormInput.value);
    if (Number.isInteger(inputNumber) && inputNumber >= -10 && inputNumber <= 10 && inputNumber !== 0) {
      socket.emit("checkTurn", action, inputNumber);
    } else {
      alert("Invalid input. Please enter a non-zero integer between -10 and 10.");
    }
  });

  $messageRandButton.addEventListener("click", () => {
    const action = "rand";
    const inputNumber = NaN;
    socket.emit("checkTurn", action, inputNumber);
    }
  );
  
  $messageABSButton.addEventListener("click", () => {
    const action = "absolute";
    socket.emit("checkTurn", action);
  });

$messagePeekButton.addEventListener("click", () => {
    socket.emit("peek");
  });
  
  
/// /// /// /// /// /// /// /// // // // // / / /  /   /    /         /       /
socket.on("turnError", (errorMessage) => {
  alert(errorMessage);
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
