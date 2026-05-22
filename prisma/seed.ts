import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@block23gym.com",
    },

    update: {},

    create: {
      name: "Admin",
      email: "admin@block23gym.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("Admin user created:");
  console.log(admin);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
