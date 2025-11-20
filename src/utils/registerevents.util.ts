import { exampleHandler } from "@/events/example.event";
import {
  joinChatHandler,
  leaveChatHandler,
  sendMessageHandler,
} from "@/events/chat.event";
import { Socket } from "socket.io";
import { IO } from "@/types/socket";

export const registerEvents = (socket: Socket, io: IO) => {
  // Example events
  socket.on("example", (params) => exampleHandler({ socket, ...params }));

  // Chat events
  socket.on("chat:join", (data) => joinChatHandler({ socket, io, ...data }));
  socket.on("chat:leave", (data) => leaveChatHandler({ socket, io, ...data }));
  socket.on("message:send", (data) =>
    sendMessageHandler({ socket, io, ...data })
  );

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User ${socket.data.userId} disconnected`);
  });
};
