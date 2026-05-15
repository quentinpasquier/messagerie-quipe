import { createServer } from "node:http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { parse } from "node:url";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = Number(process.env.PORT) || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url || "/", true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" },
    path: "/api/socket.io",
  });

  // Expose for emitting from server actions / API routes.
  (globalThis as any).io = io;

  io.on("connection", (socket) => {
    socket.on("channel:join", (channelId: string) => {
      socket.join(`channel:${channelId}`);
    });
    socket.on("channel:leave", (channelId: string) => {
      socket.leave(`channel:${channelId}`);
    });
    socket.on(
      "typing",
      (payload: { channelId: string; userId: string; name: string }) => {
        socket
          .to(`channel:${payload.channelId}`)
          .emit("typing", { userId: payload.userId, name: payload.name });
      }
    );
  });

  httpServer.on("error", (err) => {
    console.error("HTTP server error:", err);
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
