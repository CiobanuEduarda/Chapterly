/*
  Warnings:

  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MonitoredUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Log" DROP CONSTRAINT "Log_userId_fkey";

-- DropForeignKey
ALTER TABLE "MonitoredUser" DROP CONSTRAINT "MonitoredUser_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'USER';

-- DropTable
DROP TABLE "Log";

-- DropTable
DROP TABLE "MonitoredUser";

-- DropEnum
DROP TYPE "Role";
