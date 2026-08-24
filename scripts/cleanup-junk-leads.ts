import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Scanning for junk leads (whatsapp length > 14)...");

  // Fetch all leads to filter by length in memory (since Prisma doesn't support length() natively)
  const allLeads = await prisma.lead.findMany({
    select: { id: true, whatsapp: true, name: true }
  });

  // Filter strictly > 14
  const junkLeads = allLeads.filter(lead => lead.whatsapp && lead.whatsapp.length > 14);

  if (junkLeads.length === 0) {
    console.log("✅ No junk leads found. Database is clean.");
    return;
  }

  console.log(`⚠️ Found ${junkLeads.length} junk leads to delete:`);
  junkLeads.forEach(lead => {
    console.log(`- ${lead.whatsapp} (Name: ${lead.name})`);
  });

  const idsToDelete = junkLeads.map(lead => lead.id);

  console.log("\n🗑️ Deleting junk leads...");
  const result = await prisma.lead.deleteMany({
    where: {
      id: { in: idsToDelete }
    }
  });

  console.log(`✅ Successfully deleted ${result.count} junk leads.`);
}

main()
  .catch(e => {
    console.error("❌ Error during cleanup:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
