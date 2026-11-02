const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  console.log('Seven days ago:', sevenDaysAgo.toISOString());

  const count = await prisma.disasterEvent.count({
    where: { occurredAt: { gte: sevenDaysAgo } }
  });
  console.log('Events within 7 days:', count);

  const total = await prisma.disasterEvent.count();
  console.log('Total events in DB:', total);

  const all = await prisma.disasterEvent.findMany({
    orderBy: { occurredAt: 'desc' }
  });
  all.forEach(e => {
    console.log(`- ${e.title} | occurredAt: ${e.occurredAt}`);
  });

  await prisma.$disconnect();
}

run().catch(console.error);
