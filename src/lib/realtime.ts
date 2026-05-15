import type { Server as SocketIOServer } from "socket.io";

export function getIO(): SocketIOServer | null {
  const io = (globalThis as any).io as SocketIOServer | undefined;
  return io ?? null;
}

export function emitToChannel(channelId: string, event: string, payload: unknown) {
  const io = getIO();
  if (!io) return;
  io.to(`channel:${channelId}`).emit(event, payload);
}
