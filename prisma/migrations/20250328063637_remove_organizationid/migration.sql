/*
  Warnings:

  - You are about to drop the column `organizationId` on the `Membership` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Membership" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "organizationId";
