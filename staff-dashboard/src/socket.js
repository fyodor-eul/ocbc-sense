// One Socket.IO connection for the whole dashboard.
import { io } from "socket.io-client";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const socket = io(API_URL);

// Tell the server "I'm a console" on every (re)connect, so help requests reach this screen.
socket.on("connect", () => socket.emit("join_console"));
