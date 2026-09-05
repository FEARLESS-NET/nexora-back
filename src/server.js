import dotenv from "dotenv";

dotenv.config();

import http from "http";

import app from "./app.js";

import connectDB from "./config/db.js";

import { initSocket } from "./config/socket.js";

const PORT =
  process.env.PORT || 3013;

const startServer = async () => {
  try {
    await connectDB();

    const httpServer =
      http.createServer(app);

    initSocket(httpServer);

    httpServer.listen(
      PORT,
      () => {
        console.log(
          `🚀 Server running on http://localhost:${PORT}`
        );

        console.log(
          `⚡ Socket.IO running on port ${PORT}`
        );
      }
    );
  } catch (error) {
    console.error(
      "❌ Server startup error:",
      error.message
    );

    process.exit(1);
  }
};

startServer();