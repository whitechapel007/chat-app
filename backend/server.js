const express = require("express");
const http = require("http");

const connectDB = require("./connectDB");

const { Server } = require("socket.io");
const cors = require("cors");
const router = require("./routes/message");
const userrouter = require("./routes/userRoute");
require("dotenv").config();

const Message = require("./model/message");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB

connectDB();

app.use("/messages", router);
app.use("/auth", userrouter);

// Socket.IO Logic
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("sendMessage", async (data) => {
    const { content, senderId } = data;

    // Save the message to the database
    const message = await Message.create({ sender: senderId, content });

    // Broadcast the message to all connected clients
    io.emit("newMessage", {
      _id: message._id,
      sender: { _id: senderId, username: data.username },
      content: message.content,
      createdAt: message.createdAt,
    });
  });
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start Server
const PORT = process.env.PORT || 5005;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
