import { io } from "socket.io-client";

// https://drawing-tool-server.onrender.com
const URL = process.env.NODE_ENV === 'production' ? "https://drawing-tool-server.onrender.com" : "http://localhost:5000";

export const socket = io(URL);