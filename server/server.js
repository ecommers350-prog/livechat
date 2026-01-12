import express from "express";
import "dotenv/config";
import cors from 'cors';
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRouter.js";
import {Server} from "socket.io"

// Create Express app and HTTp Server
const app = express();
const server = http.createServer(app)

// Initialixe socket.io server
export const io = new Server(server, {
    cors: {origin: "*"}
})

// Store online users
export const userSockerMap = {} //{ userId, socketId}

// Socket.io connection handler
io.on("connection", (socket)=> {
    const userId = socket.handshake.query.userId;
    console.log("User, Connected", userId);

    if (userId) 
        userSockerMap[userId] = socket.id;

    // Emit online users to all connected users
    io.emit("getOnlineUsers", Object.keys(userSockerMap));

    socket.on("disconnect", ()=> {
        console.log("User Disconnected", userId);
        delete userSockerMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSockerMap));
    })
})

// Middleware setup
app.use(express.json({limit: '4mb'}));
app.use(cors());

app.use("/api/status", (req, res)=> res.send("Serever is Live ..."));
app.use('/api/auth', userRouter);
app.use('/api/messages', messageRouter)

// Connect to mongodb
await connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, ()=> console.log("Server is running on PORT: " + PORT))
