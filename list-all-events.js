const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const events = await prisma.disasterEvent.findMany({
    orderBy: { occurredAt: 'desc' },
    include: { source: true },
  });
  console.log(`Total events in database: ${events.length}`);
  events.forEach(e => {
    console.log(`- [${e.category}] ${e.title} (${e.occurredAt.toISOString().slice(0, 10)})`);
  });
  await prisma.$disconnect();
}

run().catch(console.error);
