import { AuthenticatedSocket } from "../types";

// Store online users
const onlineUsers = new Map<string, string>(); // userId -> socketId

export const handleConnection = (socket: AuthenticatedSocket) => {
  console.log(`User ${socket.user?.email} connected with socket ${socket.id}`);

  // Add user to online users
  if (socket.user?.id) {
    onlineUsers.set(socket.user.id, socket.id);
    
    // Notify other users that this user is online
    socket.broadcast.emit('user_online', { userId: socket.user.id });
  }

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User ${socket.user?.email} disconnected`);
    
    if (socket.user?.id) {
      onlineUsers.delete(socket.user.id);
      
      // Notify other users that this user is offline
      socket.broadcast.emit('user_offline', { userId: socket.user.id });
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket error for user ${socket.user?.email}:`, error);
  });
};

export const isUserOnline = (userId: string): boolean => {
  return onlineUsers.has(userId);
};

export const getUserSocketId = (userId: string): string | undefined => {
  return onlineUsers.get(userId);
};

export const getOnlineUsers = (): string[] => {
  return Array.from(onlineUsers.keys());
};
