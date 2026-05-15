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

// Make all currently-connected sockets of these users join the given
// channel room. Used after creating/joining channels so unread events
// reach members without waiting for a reconnect.
export function attachUsersToChannel(userIds: string[], channelId: string) {
  const io = getIO();
  if (!io) return;
  for (const uid of userIds) {
    io.in(`user:${uid}`).socketsJoin(`channel:${channelId}`);
  }
}

export function emitLinkPreviews(
  channelId: string,
  messageId: string,
  linkPreviews: unknown[]
) {
  emitToChannel(channelId, "message:previews", {
    messageId,
    linkPreviews,
  });
}
