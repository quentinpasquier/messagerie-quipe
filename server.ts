import { createServer } from "node:http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { parse } from "node:url";
import { jwtVerify } from "jose";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { prisma } from "./src/lib/prisma";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = Number(process.env.PORT) || 3000;

const uploadDir = process.env.UPLOAD_DIR || path.resolve(process.cwd(), "uploads");
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

function parseCookies(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  raw.split(";").forEach((c) => {
    const eq = c.indexOf("=");
    if (eq === -1) return;
    const k = c.slice(0, eq).trim();
    const v = c.slice(eq + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

async function readUserIdFromSocket(socket: {
  handshake: { headers: { cookie?: string } };
}): Promise<string | null> {
  const raw = socket.handshake.headers.cookie || "";
  const cookies = parseCookies(raw);
  const token = cookies.mq_session;
  if (!token) return null;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return typeof payload.userId === "string" ? payload.userId : null;
  } catch {
    return null;
  }
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  await prisma.user
    .updateMany({ data: { status: "OFFLINE" } })
    .catch((e) => console.error("status reset error:", e));

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url || "/", true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" },
    path: "/api/socket.io",
    maxHttpBufferSize: 1e7,
  });

  (globalThis as any).io = io;

  const userSockets = new Map<string, Set<string>>();

  io.use(async (socket, next) => {
    const userId = await readUserIdFromSocket(socket);
    if (!userId) return next(new Error("Unauthorized"));
    (socket.data as { userId?: string }).userId = userId;
    next();
  });

  io.on("connection", async (socket) => {
    const userId = (socket.data as { userId: string }).userId;

    // Personal room (for adding to new channels mid-session).
    socket.join(`user:${userId}`);

    // Auto-join all member channels so message:new broadcasts reach
    // even non-currently-open channels (for unread badges).
    try {
      const memberships = await prisma.channelMember.findMany({
        where: { userId },
        select: { channelId: true },
      });
      for (const m of memberships) socket.join(`channel:${m.channelId}`);
    } catch (e) {
      console.error("auto-join error:", e);
    }

    let set = userSockets.get(userId);
    if (!set) {
      set = new Set();
      userSockets.set(userId, set);
    }
    const wasOffline = set.size === 0;
    set.add(socket.id);

    if (wasOffline) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { status: true },
        });
        if (user && user.status === "OFFLINE") {
          await prisma.user.update({
            where: { id: userId },
            data: { status: "ONLINE" },
          });
          io.emit("user:status", { userId, status: "ONLINE" });
        }
      } catch (e) {
        console.error("status set ONLINE error:", e);
      }
    }

    // "viewing:X" tracks who is currently looking at channel X — used
    // for the typing indicator so non-viewers don't see it.
    socket.on("viewing:join", (channelId: string) => {
      socket.join(`viewing:${channelId}`);
    });
    socket.on("viewing:leave", (channelId: string) => {
      socket.leave(`viewing:${channelId}`);
    });
    socket.on(
      "typing",
      (payload: { channelId: string; userId: string; name: string }) => {
        socket
          .to(`viewing:${payload.channelId}`)
          .emit("typing", { userId: payload.userId, name: payload.name });
      }
    );

    socket.on("disconnect", async () => {
      const userSet = userSockets.get(userId);
      if (!userSet) return;
      userSet.delete(socket.id);
      if (userSet.size === 0) {
        userSockets.delete(userId);
        try {
          await prisma.user.update({
            where: { id: userId },
            data: { status: "OFFLINE" },
          });
          io.emit("user:status", { userId, status: "OFFLINE" });
        } catch (e) {
          console.error("status set OFFLINE error:", e);
        }
      }
    });
  });

  httpServer.on("error", (err) => {
    console.error("HTTP server error:", err);
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
