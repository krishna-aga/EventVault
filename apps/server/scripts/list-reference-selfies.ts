import { prisma } from "@repo/db";

async function main() {
  console.log("Listing users and reference selfies...");
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      referenceSelfie: true
    }
  });

  for (const u of users) {
    console.log(`User: ${u.name} | Email: ${u.email} | Selfie: ${u.referenceSelfie || "None"}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
