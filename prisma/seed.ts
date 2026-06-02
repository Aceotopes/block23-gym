import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  // ADMIN ACCOUNT
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

  const gymSettings = await prisma.gymSettings.upsert({
    where: {
      id: "default-settings",
    },
    update: {},
    create: {
      id: "default-settings",
      defaultMonthlyFee: 1200,
      defaultWalkInFee: 100,
    },
  });

  console.log("Admin user created:");
  console.log(admin);

  console.log("Gym Settings created:");
  console.log(gymSettings);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
