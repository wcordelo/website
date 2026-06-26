import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { getDb, closeDb } from "./db/schema.ts";
import { seedDemoData } from "./db/seed.ts";
import { authRoutes, authProtectedRoutes } from "./routes/auth.ts";
import { channelRoutes } from "./routes/channels.ts";
import { threadRoutes } from "./routes/threads.ts";
import { messageRoutes } from "./routes/messages.ts";
import { postRoutes, proposePostHandler } from "./routes/posts.ts";
import { searchRoutes } from "./routes/search.ts";
import { billingRoutes } from "./routes/billing.ts";
import { importRoutes } from "./routes/import.ts";
import { agentRoutes } from "./routes/agents.ts";
import { agentEvaluateHandler } from "./routes/agents-evaluate.ts";
import { webhookRoutes } from "./routes/webhooks.ts";
import { authMiddleware, agentAuthMiddleware } from "./routes/middleware.ts";
import { pubsub } from "./ws/pubsub.ts";

const PORT = Number(process.env.PORT ?? 3847);
const WEB_DIST = join(import.meta.dir, "../web/dist");

getDb();
seedDemoData();

const app = new Hono();

app.use("*", cors({ origin: "*" }));

app.get("/api/health", (c) => c.json({ ok: true, version: "0.1.0" }));

const api = new Hono();
api.route("/auth", authRoutes);
api.route("/webhooks", webhookRoutes);
api.post("/agents/evaluate", agentAuthMiddleware, agentEvaluateHandler);
api.post("/posts/propose", agentAuthMiddleware, proposePostHandler);

const protectedApi = new Hono();
protectedApi.use("*", authMiddleware);
protectedApi.route("/auth", authProtectedRoutes);
protectedApi.route("/channels", channelRoutes);
protectedApi.route("/threads", threadRoutes);
protectedApi.route("/messages", messageRoutes);
protectedApi.route("/posts", postRoutes);
protectedApi.route("/search", searchRoutes);
protectedApi.route("/billing", billingRoutes);
protectedApi.route("/import", importRoutes);
protectedApi.route("/agents", agentRoutes);
api.route("/", protectedApi);

app.route("/api", api);

if (existsSync(join(WEB_DIST, "index.html"))) {
  app.use("/assets/*", serveStatic({ root: WEB_DIST }));
  app.get("/", serveStatic({ path: join(WEB_DIST, "index.html") }));
  app.get("/*", serveStatic({ root: WEB_DIST }));
} else {
  app.get("/", (c) =>
    c.html(`<html><body style="font-family:sans-serif;padding:2rem;background:#0f1117;color:#e8eaef">
      <h1>Better Slack API</h1>
      <p>Run <code>bun run build:web</code> to serve the UI.</p>
      <p><a href="/api/health" style="color:#5b8def">/api/health</a></p>
    </body></html>`),
  );
}

const server = Bun.serve({
  port: PORT,
  async fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === "/ws") {
      const workspaceId = url.searchParams.get("workspace");
      if (!workspaceId) {
        return new Response("workspace query param required", { status: 400 });
      }

      const upgraded = server.upgrade(req, { data: { workspaceId } });
      if (!upgraded) {
        return new Response("WebSocket upgrade failed", { status: 400 });
      }
      return undefined;
    }

    return app.fetch(req, server);
  },
  websocket: {
    open(ws) {
      const workspaceId = (ws.data as { workspaceId: string }).workspaceId;
      const unsubscribe = pubsub.subscribe(workspaceId, (data) => ws.send(data));
      (ws.data as { unsubscribe?: () => void }).unsubscribe = unsubscribe;
      ws.send(JSON.stringify({ type: "connected", workspaceId }));
    },
    close(ws) {
      (ws.data as { unsubscribe?: () => void }).unsubscribe?.();
    },
    message() {},
  },
});

console.log(`Better Slack v0.1 running at http://localhost:${PORT}`);
console.log(`WebSocket: ws://localhost:${PORT}/ws?workspace=<id>`);
console.log(`API: http://localhost:${PORT}/api/health`);

process.on("SIGINT", () => {
  server.stop();
  closeDb();
  process.exit(0);
});

export { app, server };
