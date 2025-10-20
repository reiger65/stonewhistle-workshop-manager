import fastifyFactory from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import path from "path";
import "dotenv/config";

import { ordersRoutes } from "./routes/orders";
import { boardRoutes } from "./routes/board";

console.log("Boot: index.ts geladen");

const app = fastifyFactory({ logger: true });

// CORS
app.register(fastifyCors, { origin: true });

// Static files (for frontend)
app.register(fastifyStatic, {
  root: path.join(__dirname, "../dist/public"),
  prefix: "/",
});

// Health route
app.get("/health", async () => ({
  ok: true,
  time: new Date().toISOString(),
}));

// Routes registreren
app.register(ordersRoutes, { prefix: "/api/orders" });
app.register(boardRoutes, { prefix: "/api/board" });

// Serve index.html for SPA routing
app.setNotFoundHandler(async (request, reply) => {
  if (request.url.startsWith("/api/")) {
    return reply.code(404).send({ error: "API endpoint not found" });
  }
  return reply.sendFile("index.html");
});

// Start server
async function start() {
  try {
    const port = Number(process.env.PORT || 3000);
    await app.listen({ port, host: "0.0.0.0" });
    app.log.info(`Server running on http://localhost:${port}`);
  } catch (err) {
    console.error("Start error:", err);
    process.exit(1);
  }
}

console.log("Boot: start() wordt aangeroepen");
start();