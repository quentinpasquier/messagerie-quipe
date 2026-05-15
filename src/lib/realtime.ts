import type { Server as SocketIOServer } from "socket.io";

export function getIO(): SocketIOServer | null {
  const io = (globalThis as any).io as SocketIOServer | undefined;
  return io ?? null;
}

export function emitToChannel(channelId: string, event: string, payload: unknown) {
  getIO()?.to(`channel:${channelId}`).emit(event, payload);
}

export function broadcastUserStatus(userId: string, status: string) {
  getIO()?.emit("user:status", { userId, status });
}
