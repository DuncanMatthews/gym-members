/*
  Warnings:

  - A unique constraint covering the columns `[membershipPlanId]` on the table `PricingTier` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[membershipPlanId,duration]` on the table `PricingTier` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PricingTier_membershipPlanId_key" ON "PricingTier"("membershipPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "PricingTier_membershipPlanId_duration_key" ON "PricingTier"("membershipPlanId", "duration");
