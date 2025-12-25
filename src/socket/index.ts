import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { socketAuthMiddleware } from "./middleware";
import { handleConnection } from "./handlers/connection";
import { 
  handleJoinChat, 
  handleLeaveChat, 
  handleSendMessage, 
  handleTypingStart, 
  handleTypingStop, 
  handleMarkAsRead 
} from "./handlers/chat";
import { 
  handleSendNotification, 
  handleGetNotifications, 
  handleMarkNotificationAsRead 
} from "./handlers/notf";
import { AuthenticatedSocket, SocketEvents } from "./types";
import { CorsOptions } from "cors";

export const createSocketServer = (httpServer: HTTPServer, corsOptions?: CorsOptions): SocketIOServer<SocketEvents> => {
  const defaultCors = {
    origin: corsOptions?.origin || [
      "http://localhost:5173",
      "http://localhost:4000",
      "http://127.0.0.1:5500",
      "https://proactive-fe.vercel.app",
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  };

  const io = new SocketIOServer<SocketEvents>(httpServer, {
    cors: defaultCors,
    transports: ['websocket', 'polling'],
  });


  io.use(socketAuthMiddleware);


  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`New socket connection: ${socket.id}`);
    

    handleConnection(socket);

    socket.on('join_chat', (data) => handleJoinChat(socket, data));
    socket.on('leave_chat', (data) => handleLeaveChat(socket, data));
    socket.on('send_message', (data) => handleSendMessage(socket, data));
    socket.on('typing_start', (data) => handleTypingStart(socket, data));
    socket.on('typing_stop', (data) => handleTypingStop(socket, data));
    socket.on('mark_as_read', (data) => handleMarkAsRead(socket, data));


    socket.on('send_notification', (data) => handleSendNotification(socket, data));
    socket.on('get_notifications', (data) => handleGetNotifications(socket, data));
    socket.on('mark_notification_as_read', (data) => handleMarkNotificationAsRead(socket, data));


    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user?.email}:`, error);
    });
  });

  return io;
};

export default createSocketServer;
