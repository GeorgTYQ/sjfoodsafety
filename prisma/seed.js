const { PrismaClient } = require("../src/generated/prisma");

const prisma = new PrismaClient();

async function main() {
  // 1. 创建用户
  const user = await prisma.user.create({
    data: { name: "George" },
  });

  // 2. 创建冰箱
  await prisma.fridge.createMany({
    data: [{ name: "Fridge A" }, { name: "Fridge B" }, { name: "Fridge C" }],
  });

  // 3. 取出所有冰箱
  const fridges = await prisma.fridge.findMany();

  // 4. 创建当天的记录
  const now = new Date();
  const record = await prisma.record.create({
    data: {
      userId: user.id,
      recordedAt: now,
    },
  });

  // 5. 给记录关联多个冰箱温度
  const temperatureCreates = fridges.map((fridge, idx) =>
    prisma.fridgeTemperature.create({
      data: {
        recordId: record.id,
        fridgeId: fridge.id,
        temperature: 4.0 + idx * 0.5, // 示例温度 4.0, 4.5, 5.0
      },
    })
  );

  const tempRecords = await Promise.all(temperatureCreates);

  console.log("✅ Seed finished");
  console.log({ user, fridges, record, tempRecords });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
