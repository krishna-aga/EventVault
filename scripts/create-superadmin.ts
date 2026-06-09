import { prisma } from "../packages/db/src/index.js";
import { pbkdf2Sync, randomBytes } from "node:crypto";
import dotenv from "dotenv";

dotenv.config();

const ITERATIONS = 120000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

const hashPassword = (password: string): string => {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `pbkdf2$${ITERATIONS}$${salt}$${hash}`;
};

async function main() {
  const email = process.argv[2] || "superadmin@eventvault.com";
  const password = process.argv[3] || "SuperSecurePass123!";
  const name = "Super Admin";

  console.log(`Creating superadmin: ${email} ...`);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Superadmin already exists. Updating profile...");
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash: hashPassword(password),
        role: "ADMIN"
      }
    });
    console.log("Superadmin password updated successfully.");
  } else {
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
        role: "ADMIN"
      }
    });
    console.log("Superadmin created successfully.");
  }
}

main()
  .catch((err) => {
    console.error("Error creating superadmin:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
