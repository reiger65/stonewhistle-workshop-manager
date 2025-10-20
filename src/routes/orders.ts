import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma";

export const ordersRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => {
    return prisma.order.findMany({
      include: { customer: true, items: true },
      orderBy: { createdAt: "desc" },
    });
  });

  app.post("/", async (req, reply) => {
    const body = req.body as {
      customer?: { name: string; email?: string; address?: string };
      status?: string;
      items?: Array<{ type: string; serial: string; colorCode?: string; stage?: string; specs?: any }>;
      shopifyId?: string;
    };

    let customerId: string | undefined;
    if (body.customer?.email) {
      const c = await prisma.customer.upsert({
        where: { email: body.customer.email },
        update: { name: body.customer.name ?? "", address: body.customer.address ?? undefined },
        create: {
          name: body.customer.name ?? "Unknown",
          email: body.customer.email,
          address: body.customer.address ?? undefined,
        },
      });
      customerId = c.id;
    }

    const order = await prisma.order.create({
      data: {
        status: body.status ?? "Ordered",
        shopifyId: body.shopifyId,
        customerId,
        items: {
          create: (body.items ?? []).map(i => ({
            type: i.type,
            serial: i.serial,
            colorCode: i.colorCode,
            stage: i.stage ?? "Ordered",
            specs: i.specs ?? {},
          })),
        },
      },
      include: { customer: true, items: true },
    });

    return reply.code(201).send(order);
  });
};
export default ordersRoutes;