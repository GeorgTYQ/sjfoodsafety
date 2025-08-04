import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const fridges = await prisma.fridge.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    return new Response(JSON.stringify(fridges), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("GET /api/fridges error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch fridges" }), {
      status: 500,
    });
  }
}
