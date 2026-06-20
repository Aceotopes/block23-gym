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
      gymName: "Block23 Gym",
      defaultMonthlyFee: 1200,
      defaultWalkInFee: 100,
      walkInActiveDays: 7,
    },
  });

  // DEFAULT MEMBERSHIP PLANS
  const plan1 = await prisma.membershipPlan.upsert({
    where: { id: "plan-1-month" },
    update: {},
    create: {
      id: "plan-1-month",
      name: "1 Month",
      durationInDays: 30,
      price: 1200,
      isActive: true,
      sortOrder: 1,
    },
  });

  const plan2 = await prisma.membershipPlan.upsert({
    where: { id: "plan-2-months" },
    update: {},
    create: {
      id: "plan-2-months",
      name: "2 Months",
      durationInDays: 60,
      price: 2400,
      isActive: true,
      sortOrder: 2,
    },
  });

  const plan3 = await prisma.membershipPlan.upsert({
    where: { id: "plan-3-months" },
    update: {},
    create: {
      id: "plan-3-months",
      name: "3 Months",
      durationInDays: 90,
      price: 3600,
      isActive: true,
      sortOrder: 3,
    },
  });

  console.log("Admin user created:");
  console.log(admin);

  console.log("Gym Settings created:");
  console.log(gymSettings);

  console.log("Membership Plans created:");
  console.log(plan1, plan2, plan3);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
