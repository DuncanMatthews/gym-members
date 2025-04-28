/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `MembershipPlan` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "PricingTier_membershipPlanId_key";

-- CreateIndex
CREATE UNIQUE INDEX "MembershipPlan_name_key" ON "MembershipPlan"("name");
