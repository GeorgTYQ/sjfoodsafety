import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const records = await prisma.record.findMany({
      orderBy: { recordedAt: "desc" },
      include: {
        user: true,
        readings: {
          include: {
            fridge: true,
          },
        },
      },
    });

    return new Response(JSON.stringify(records), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Failed to fetch records" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, fridgeTemperatures, recordedAt } = body;

    // 校验
    if (
      !userId ||
      !Array.isArray(fridgeTemperatures) ||
      fridgeTemperatures.length === 0 ||
      !recordedAt
    ) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
      });
    }

    const date = new Date(recordedAt);
    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const endOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1
    );

    // 检查该日期是否已经记录
    const existingRecord = await prisma.record.findFirst({
      where: {
        userId,
        recordedAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    if (existingRecord) {
      return new Response(
        JSON.stringify({
          error: "You have already submitted a record on this date.",
          recordedAt: existingRecord.recordedAt,
        }),
        { status: 409 }
      );
    }

    // 创建新记录
    const newRecord = await prisma.record.create({
      data: {
        userId,
        recordedAt: date,
        readings: {
          create: fridgeTemperatures.map((temp) => ({
            fridgeId: temp.fridgeId,
            temperature: temp.temperature,
          })),
        },
      },
      include: {
        readings: true,
      },
    });

    return new Response(JSON.stringify({ newRecord }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("POST /api/records error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
export async function PUT(request) {
  try {
    const body = await request.json();
    const { recordId, userId, recordedAt, fridgeTemperatures } = body;

    if (
      !recordId ||
      !userId ||
      !recordedAt ||
      !Array.isArray(fridgeTemperatures) ||
      fridgeTemperatures.length === 0
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid input. Missing required fields." }),
        { status: 400 }
      );
    }

    // Update the record date and user (if needed)
    const updatedRecord = await prisma.record.update({
      where: { id: recordId },
      data: {
        userId,
        recordedAt: new Date(recordedAt),
        readings: {
          // Delete all old readings for this record
          deleteMany: {},
          // Create new readings from fridgeTemperatures array
          create: fridgeTemperatures.map((temp) => ({
            fridgeId: temp.fridgeId,
            temperature: temp.temperature,
          })),
        },
      },
      include: {
        readings: true,
      },
    });

    return new Response(JSON.stringify(updatedRecord), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("PUT /api/records error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update the record" }),
      { status: 500 }
    );
  }
}
