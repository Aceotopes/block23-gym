/*
  Warnings:

  - Added the required column `visitType` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Made the column `lastName` on table `Client` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `amountPaid` to the `Membership` table without a default value. This is not possible if the table is not empty.
  - Added the required column `durationInDays` to the `Membership` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "VisitType" AS ENUM ('MEMBER', 'WALK_IN');

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "visitType" "VisitType" NOT NULL;

-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "lastName" SET NOT NULL;

-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "amountPaid" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "durationInDays" INTEGER NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "GymSettings" (
    "id" TEXT NOT NULL,
    "defaultMonthlyFee" DECIMAL(10,2) NOT NULL DEFAULT 1200,
    "defaultWalkInFee" DECIMAL(10,2) NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GymSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Attendance_clientId_idx" ON "Attendance"("clientId");

-- CreateIndex
CREATE INDEX "Attendance_timeIn_idx" ON "Attendance"("timeIn");

-- CreateIndex
CREATE INDEX "Client_firstName_idx" ON "Client"("firstName");

-- CreateIndex
CREATE INDEX "Client_lastName_idx" ON "Client"("lastName");

-- CreateIndex
CREATE INDEX "Client_phone_idx" ON "Client"("phone");

-- CreateIndex
CREATE INDEX "Membership_clientId_idx" ON "Membership"("clientId");

-- CreateIndex
CREATE INDEX "Membership_status_idx" ON "Membership"("status");
