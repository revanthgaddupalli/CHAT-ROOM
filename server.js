const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static("client"));

io.on("connection", (socket) => {
  socket.on("set username", ({ username, roomId }) => {
    if (!username || !roomId) return;
    socket.username = username;
    socket.roomId = roomId;
    socket.join(roomId);
    socket.to(roomId).emit("system message", `${username} joined the chat`);
  });

  socket.on("chat message", (data) => {
    const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata"});
    io.to(data.roomId).emit("chat message", {
      user: data.user,
      text: data.text,
      time: time,
      roomId: data.roomId
    });
  });

  socket.on("typing", (data) => {
    socket.to(data.roomId).emit("typing", data);
  });

  socket.on("disconnect", () => {
    if (socket.username && socket.roomId) {
      socket.to(socket.roomId).emit("system message", `${socket.username} left the chat 👋`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});