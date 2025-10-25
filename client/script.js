const socket = io();
let typingTimeouts = {};
const currentlyTypingUsers = new Set();

let username = sessionStorage.getItem("username");
let roomId = sessionStorage.getItem("roomId");
const urlParams = new URLSearchParams(window.location.search);
const roomFromUrl = urlParams.get("room");

if (!username) {
  window.location.href = "login.html";
} else {
  if (roomFromUrl) {
    roomId = roomFromUrl;
    sessionStorage.setItem("roomId", roomId);
  }
  socket.emit("set username", { username, roomId });
}

document.getElementById("room-id").textContent = roomId;

document.getElementById("send-btn").addEventListener("click", sendMessage);
const messageInput = document.getElementById("message-input");
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
  else emitTyping();
});

function sendMessage() {
  const input = document.getElementById("message-input");
  const msg = input.value.trim();
  if (msg) {
    socket.emit("chat message", { user: username, text: msg, roomId });
    input.value = "";
  }
}

const typingIndicator = document.getElementById("typing-indicator");
function emitTyping() {
  socket.emit("typing", { user: username, roomId });
}

socket.on("typing", ({ user }) => {
  if (user === username) return;
  currentlyTypingUsers.add(user);
  updateTypingIndicator();
  clearTimeout(typingTimeouts[user]);
  typingTimeouts[user] = setTimeout(() => {
    currentlyTypingUsers.delete(user);
    updateTypingIndicator();
    delete typingTimeouts[user];
  }, 2000);
});

function updateTypingIndicator() {
  const users = Array.from(currentlyTypingUsers);
  if (users.length === 0) typingIndicator.textContent = "";
  else if (users.length === 1) typingIndicator.textContent = `${users[0]} is typing...`;
  else if (users.length === 2) typingIndicator.textContent = `${users[0]} and ${users[1]} are typing...`;
  else typingIndicator.textContent = `${users[0]}, ${users[1]} and ${users.length - 2} others are typing...`;
}

function getUserColor(username) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = `hsl(${hash % 360}, 70%, 60%)`;
  return color;
}

socket.on("chat message", (data) => {
  if (data.roomId !== roomId) return;
  const messages = document.getElementById("messages");
  const li = document.createElement("li");
  const bubble = document.createElement("div");
  bubble.classList.add("message-bubble");

  const initial = document.createElement("div");
  initial.classList.add("user-initial");
  initial.textContent = data.user.charAt(0).toUpperCase();
  initial.style.backgroundColor = getUserColor(data.user);

  const messageContent = document.createElement("div");
  messageContent.classList.add("message-content");

  const userMessage = document.createElement("div");
  userMessage.innerHTML = `<strong>${data.user}:</strong> ${data.text}`;

  const timeStamp = document.createElement("div");
  timeStamp.classList.add("timestamp");
  timeStamp.textContent = data.time;

  messageContent.appendChild(userMessage);
  messageContent.appendChild(timeStamp);
  bubble.appendChild(initial);
  bubble.appendChild(messageContent);
  li.appendChild(bubble);
  li.classList.add(data.user === username ? "sent" : "received");
  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
  typingIndicator.textContent = "";
});

socket.on("system message", (msg) => {
  const messages = document.getElementById("messages");
  const li = document.createElement("li");
  li.textContent = msg;
  li.classList.add("system-message");
  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
  typingIndicator.textContent = "";
});

document.getElementById("share-invite-btn").addEventListener("click", () => {
  const inviteLink = `${window.location.origin}/login.html?room=${roomId}`;
  navigator.clipboard.writeText(inviteLink)
    .then(() => alert("Invite link copied to clipboard!"))
    .catch(err => console.error("Failed to copy: ", err));
});

const leaveChatBtn = document.getElementById("leave-chat-btn");
const leaveModal = document.getElementById("leave-modal");
const confirmLeaveBtn = document.getElementById("confirm-leave-btn");
const cancelLeaveBtn = document.getElementById("cancel-leave-btn");

leaveChatBtn.addEventListener("click", () => {
  leaveModal.style.display = "flex";
});

confirmLeaveBtn.addEventListener("click", () => {
  leaveModal.style.display = "none";
  window.location.href = "login.html";
});

cancelLeaveBtn.addEventListener("click", () => {
  leaveModal.style.display = "none";
});