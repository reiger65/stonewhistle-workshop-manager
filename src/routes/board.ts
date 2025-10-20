import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma";
import { WORK_STAGES, STAGE_ORDER, nextStage, type Stage } from "../services/stage";

function isStage(x: string): x is Stage {
  return (STAGE_ORDER as readonly string[]).includes(x);
}

export const boardRoutes: FastifyPluginAsync = async (app) => {
  app.get("/summary", async () => {
    const counts = await prisma.item.groupBy({
      by: ["stage"],
      _count: { _all: true },
    });
    return counts;
  });

  app.get("/next", async () => {
    for (const s of WORK_STAGES) {
      const item = await prisma.item.findFirst({
        where: { stage: s },
        orderBy: [{ updatedAt: "asc" }, { createdAt: "asc" }],
      });
      if (item) return { stage: s, item };
    }
    return { stage: null, item: null };
  });

  app.get("/stage/:stage", async (req, reply) => {
    const { stage } = req.params as { stage: string };
    if (!isStage(stage)) return reply.code(400).send({ error: "Unknown stage" });

    const { limit = "50", cursor } = req.query as Record<string, string | undefined>;
    const take = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 200);

    const items = await prisma.item.findMany({
      where: { stage },
      include: { order: { include: { customer: true } } },
      take,
      ...(cursor ? { skip: 1, cursor: { id: String(cursor) } } : {}),
      orderBy: [{ updatedAt: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    });

    const nextCursor = items.length === take ? items[items.length - 1].id : null;
    return { items, nextCursor };
  });

  app.patch("/items/:id/advance", async (req, reply) => {
    const { id } = req.params as { id: string };
    const it = await prisma.item.findUnique({ where: { id } });
    if (!it) return reply.code(404).send({ error: "Item not found" });

    const ns = nextStage(it.stage as Stage);
    if (!ns) return reply.code(400).send({ error: "Already at last stage" });

    const updated = await prisma.item.update({ where: { id }, data: { stage: ns } });
    return updated;
  });
};
export default boardRoutes;