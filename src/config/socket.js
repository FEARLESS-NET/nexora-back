import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

// ==========================================
// CORS CONFIG
// ==========================================

const DEFAULT_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
];

const getAllowedOrigins = () => {
  const envOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [
    ...new Set([
      ...DEFAULT_ORIGINS,
      ...envOrigins,
    ]),
  ];
};

// ==========================================
// INITIALIZE SOCKET.IO
// ==========================================

export const initSocket = (httpServer) => {
  const allowedOrigins = getAllowedOrigins();

  console.log("🌐 Socket CORS origins:", allowedOrigins);

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        console.log("❌ Socket CORS blocked:", origin);

        return callback(
          new Error(`CORS blocked for origin: ${origin}`)
        );
      },

      credentials: true,

      methods: [
        "GET",
        "POST",
      ],
    },

    transports: [
      "websocket",
      "polling",
    ],
  });

  // ========================================
  // AUTHENTICATION
  // ========================================

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token;

      if (!token) {
        return next(
          new Error("Authentication required")
        );
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      if (!decoded?.userId) {
        return next(
          new Error("Invalid authentication token")
        );
      }

      socket.userId =
        decoded.userId.toString();

      socket.role =
        decoded.role || null;

      next();
    } catch (error) {
      console.error(
        "❌ Socket authentication error:",
        error.message
      );

      next(
        new Error("Authentication failed")
      );
    }
  });

  // ========================================
  // CONNECTION
  // ========================================

  io.on("connection", (socket) => {
    console.log(
      `🟢 Socket connected: ${socket.userId}`
    );

    // ====================================
    // PERSONAL USER ROOM
    // ====================================

    socket.join(
      `user:${socket.userId}`
    );

    console.log(
      `👤 User joined room: user:${socket.userId}`
    );

    // ====================================
    // ONLINE STATUS
    // ====================================

    socket.broadcast.emit(
      "user_online",
      {
        userId: socket.userId,
      }
    );

    // ====================================
    // TYPING
    // ====================================

    socket.on(
      "typing",
      ({ receiverId } = {}) => {
        if (!receiverId) return;

        io.to(
          `user:${receiverId}`
        ).emit(
          "user_typing",
          {
            userId: socket.userId,
          }
        );
      }
    );

    // ====================================
    // STOP TYPING
    // ====================================

    socket.on(
      "stop_typing",
      ({ receiverId } = {}) => {
        if (!receiverId) return;

        io.to(
          `user:${receiverId}`
        ).emit(
          "user_stop_typing",
          {
            userId: socket.userId,
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
            userId: socket.userId,
          }
        );
      }
    );
  });

  console.log(
    "⚡ Socket.IO initialized successfully"
  );

  return io;
};

// ==========================================
// GET IO INSTANCE
// ==========================================

export const getIO = () => {
  if (!io) {
    throw new Error(
      "Socket.IO is not initialized"
    );
  }

  return io;
};