import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

export const initSocket = (
  httpServer
) => {
  io = new Server(
    httpServer,
    {
      cors: {
        origin: (() => {
          const defaults = [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:3000",
          ];

          const envOrigins = (process.env.CORS_ORIGINS || "")
            .split(",")
            .map((origin) => origin.trim())
            .filter(Boolean);

          return [
            ...new Set([
              ...defaults,
              ...envOrigins,
            ]),
          ];
        })(),
        credentials: true,
      },

      transports: [
        "websocket",
        "polling",
      ],
    }
  );

  // ========================================
  // AUTHENTICATION
  // ========================================

  io.use(
    (socket, next) => {
      try {
        const token =
          socket.handshake.auth
            ?.token;

        if (!token) {
          return next(
            new Error(
              "Authentication required"
            )
          );
        }

        const decoded =
          jwt.verify(
            token,
            process.env.JWT_SECRET
          );

        if (!decoded?.userId) {
          return next(
            new Error(
              "Invalid authentication token"
            )
          );
        }

        socket.userId =
          decoded.userId.toString();

        socket.role =
          decoded.role;

        next();
      } catch (error) {
        console.error(
          "❌ Socket authentication error:",
          error.message
        );

        next(
          new Error(
            "Authentication failed"
          )
        );
      }
    }
  );

  // ========================================
  // CONNECTION
  // ========================================

  io.on(
    "connection",
    (socket) => {
      console.log(
        `🟢 Socket connected: ${socket.userId}`
      );

      // ====================================
      // PERSONAL ROOM
      // ====================================

      socket.join(
        `user:${socket.userId}`
      );

      // ====================================
      // ONLINE
      // ====================================

      socket.broadcast.emit(
        "user_online",
        {
          userId:
            socket.userId,
        }
      );

      // ====================================
      // TYPING
      // ====================================

      socket.on(
        "typing",
        ({
          receiverId,
        }) => {
          if (!receiverId) return;

          io.to(
            `user:${receiverId}`
          ).emit(
            "user_typing",
            {
              userId:
                socket.userId,
            }
          );
        }
      );

      // ====================================
      // STOP TYPING
      // ====================================

      socket.on(
        "stop_typing",
        ({
          receiverId,
        }) => {
          if (!receiverId) return;

          io.to(
            `user:${receiverId}`
          ).emit(
            "user_stop_typing",
            {
              userId:
                socket.userId,
            }
          );
        }
      );

      // ====================================
      // DISCONNECT
      // ====================================

      socket.on(
        "disconnect",
        (reason) => {
          console.log(
            `🔴 Socket disconnected: ${socket.userId}`,
            reason
          );

          socket.broadcast.emit(
            "user_offline",
            {
              userId:
                socket.userId,
            }
          );
        }
      );
    }
  );

  console.log(
    "⚡ Socket.IO initialized"
  );

  return io;
};

// ==========================================
// GET IO
// ==========================================

export const getIO = () => {
  if (!io) {
    throw new Error(
      "Socket.IO is not initialized"
    );
  }

  return io;
};