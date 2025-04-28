"use server";

import { z } from "zod";

// Initialize Prisma client once

const membershipSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  monthlyPrice: z.number().min(0, "Price must be a positive number"),
  threeMonthPrice: z.number().min(0, "Price must be a positive number"),
  sixMonthPrice: z.number().min(0, "Price must be a positive number"),
  annualPrice: z.number().min(0, "Price must be a positive number"),
  features: z.array(z.string()),
  isActive: z.boolean(),
});

interface ActionState {
  errors?: Record<string, string[]>;
  message?: string;
}

export default async function createMembership(
  prevState: ActionState,
  formData: FormData
) {
  console.log('formData', formData)
  try {
    // Fix: Update the validation to match the actual form data structure
    const validatedFields = membershipSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description"),
      monthlyPrice: Number(formData.get("monthlyPrice")),
      threeMonthPrice: Number(formData.get("threeMonthPrice")),
      sixMonthPrice: Number(formData.get("sixMonthPrice")),
      annualPrice: Number(formData.get("annualPrice")),
      features: formData.getAll("features"),
      isActive: formData.get("isActive") === "true" || true,
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    // Create the plan with pricing tier
    const data = await prisma.membershipPlan.create({
      data: {
        name: validatedFields.data.name,
        description: validatedFields.data.description,
        features: validatedFields.data.features,
        pricingTiers: {
          createMany: {
            data: [
              {
                duration: "MONTHLY",
                price: validatedFields.data.monthlyPrice,
                totalPrice: validatedFields.data.monthlyPrice,
              },
              {
                duration: "THREE_MONTH",
                price: validatedFields.data.threeMonthPrice,
                totalPrice: validatedFields.data.threeMonthPrice * 3,
              },
              {
                duration: "SIX_MONTH",
                price: validatedFields.data.sixMonthPrice,
                totalPrice: validatedFields.data.sixMonthPrice * 6,
              },
              {
                duration: "ANNUAL",
                price: validatedFields.data.annualPrice,
                totalPrice: validatedFields.data.annualPrice * 12,
              },
            ],
          },
        },
      },
    });

    if (!data) {
      console.log('data', data)
      return { message: "Failed to create membership plan", errors: {} };
    }

    console.log('data1', data)

    return { message: "Membership created successfully!" };
  } catch (error) {
    console.log('data', error)
    console.error("Error creating membership:", error);
    return {
      message: "An unexpected error occurred. Please try again.",
      errors: {},
    };
  }
}

// app/(dashboard)/memberships/actions.ts
export async function getMembershipPlans() {
  try {
    const plans = await prisma.membershipPlan.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        pricingTiers: true,
      },
    });

    // Serialize for client components
    return plans.map((plan) => ({
      ...plan,
      pricingTiers: plan.pricingTiers.map((tier) => ({
        ...tier,
        price: tier.price.toString(),
        totalPrice: tier.totalPrice.toString(),
        discountPercent: tier.discountPercent
          ? tier.discountPercent.toString()
          : null,
      })),
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching membership plans:", error);
    throw new Error("Failed to fetch membership plans");
  }
}

export async function getMembershipPlanById(id: string) {
  try {
    const plan = await prisma.membershipPlan.findUnique({
      where: { id },
      include: {
        pricingTiers: true,
      },
    });

    if (!plan) return null;

    return {
      ...plan,
      pricingTiers: plan.pricingTiers.map((tier) => ({
        ...tier,
        price: tier.price.toString(),
        totalPrice: tier.totalPrice.toString(),
        discountPercent: tier.discountPercent ? tier.discountPercent.toString() : null,
        createdAt: tier.createdAt.toISOString(),
        updatedAt: tier.updatedAt.toISOString(),
      })),
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    };
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'P2002' &&
      'meta' in error && typeof error.meta === 'object' && error.meta !== null &&
      'target' in error.meta && Array.isArray(error.meta.target) &&
      error.meta.target.includes('name')) {
      return {
        message: "A membership plan with this name already exists",
        errors: { name: ["This name is already taken"] }
      };
    }
    console.error("Error fetching membership plan:", error);
    throw new Error("Failed to fetch membership plan");
  }
}

export async function updateMembershipPlan(
  state: ActionState,
  payload: FormData
): Promise<ActionState> {
  try {
    // Get ID from the form data
    const id = payload.get("id") as string;

    const validatedFields = membershipSchema.safeParse({
      name: payload.get("name"),
      description: payload.get("description"),
      monthlyPrice: Number(payload.get("monthlyPrice")),
      threeMonthPrice: Number(payload.get("threeMonthPrice")),
      sixMonthPrice: Number(payload.get("sixMonthPrice")),
      annualPrice: Number(payload.get("annualPrice")),
      features: payload.getAll("features"),
      isActive: payload.get("isActive") === "true" || true,
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    // Update membership plan data
    await prisma.membershipPlan.update({
      where: { id },
      data: {
        name: validatedFields.data.name,
        description: validatedFields.data.description,
        features: validatedFields.data.features,
      }
    });

    await prisma.pricingTier.upsert({
      where: {
        membershipPlanId_duration: {
          membershipPlanId: id,
          duration: "MONTHLY"
        }
      },
      update: {
        price: validatedFields.data.monthlyPrice,
        totalPrice: validatedFields.data.monthlyPrice
      },
      create: {
        membershipPlanId: id,
        duration: "MONTHLY",
        price: validatedFields.data.monthlyPrice,
        totalPrice: validatedFields.data.monthlyPrice
      }
    });

    // Also need to update pricing tiers
    // This will require additional code to update or create pricing tiers

    return {
      message: "Membership plan updated successfully!",
    };
  } catch (error) {
    console.error("Error updating membership plan:", error);
    return {
      message: "An unexpected error occurred. Please try again.",
      errors: {},
    };
  }
}

export async function deleteMembershipPlan(id: string): Promise<ActionState> {
  try {
    await prisma.membershipPlan.delete({
      where: { id },
    });

    return {
      message: "Membership plan deleted successfully!",
    };
  } catch (error) {
    console.error("Error deleting membership plan:", error);
    return {
      message: "An unexpected error occurred. Please try again.",
      errors: {},
    };
  }
}


// Add these functions to your existing actions.ts file

import { addMonths } from "date-fns";
import { prisma } from "@/lib/prisma";

export async function updateMembershipPricingTier(
  membershipId: string,
  pricingTierId: string
) {
  try {
    // First get the pricing tier details to calculate new dates
    const pricingTier = await prisma.pricingTier.findUnique({
      where: { id: pricingTierId },
    });

    if (!pricingTier) {
      throw new Error("Invalid pricing tier");
    }

    // Get current membership to calculate new dates
    const currentMembership = await prisma.membership.findUnique({
      where: { id: membershipId },
    });

    if (!currentMembership) {
      throw new Error("Membership not found");
    }

    // Calculate new end date based on the pricing tier duration
    let newEndDate = new Date(currentMembership.startDate);
    switch (pricingTier.duration) {
      case "MONTHLY": newEndDate = addMonths(newEndDate, 1); break;
      case "THREE_MONTH": newEndDate = addMonths(newEndDate, 3); break;
      case "SIX_MONTH": newEndDate = addMonths(newEndDate, 6); break;
      case "ANNUAL": newEndDate = addMonths(newEndDate, 12); break;
    }

    // Update membership with new pricing tier and recalculated end date
    await prisma.membership.update({
      where: { id: membershipId },
      data: {
        pricingTierId,
        endDate: newEndDate,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating membership pricing tier:", error);
    throw new Error("Failed to update pricing tier");
  }
}

export async function getMembershipPlanDetails(membershipPlanId: string) {
  try {
    const plan = await prisma.membershipPlan.findUnique({
      where: { id: membershipPlanId },
      include: {
        pricingTiers: true,
      },
    });

    if (!plan) return null;

    // Serialize for client components
    return {
      ...plan,
      pricingTiers: plan.pricingTiers.map((tier) => ({
        ...tier,
        price: tier.price.toString(),
        totalPrice: tier.totalPrice.toString(),
        discountPercent: tier.discountPercent
          ? tier.discountPercent.toString()
          : null,
        createdAt: tier.createdAt.toISOString(),
        updatedAt: tier.updatedAt.toISOString(),
      })),
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error("Error fetching membership plan details:", error);
    throw new Error("Failed to fetch membership plan details");
  }
}



interface ChangeMembershipPlanResult {
  success: boolean;
  message: string;
  error?: string;
}

export async function changeMembershipPlan(
  userId: string,
  membershipId: string,
  newMembershipPlanId: string,
  newPricingTierId: string
): Promise<ChangeMembershipPlanResult> {
  try {
    // First get the pricing tier details to calculate new dates
    const pricingTier = await prisma.pricingTier.findUnique({
      where: { id: newPricingTierId },
    });

    if (!pricingTier) {
      return {
        success: false,
        message: "Invalid pricing tier",
        error: "The selected pricing tier was not found"
      };
    }

    // Get current membership to calculate new dates
    const currentMembership = await prisma.membership.findUnique({
      where: { id: membershipId },
    });

    if (!currentMembership) {
      return {
        success: false,
        message: "Membership not found",
        error: "The current membership was not found"
      };
    }

    // Calculate new end date based on the pricing tier duration
    let newEndDate = new Date(currentMembership.startDate);
    switch (pricingTier.duration) {
      case "MONTHLY": newEndDate = addMonths(newEndDate, 1); break;
      case "THREE_MONTH": newEndDate = addMonths(newEndDate, 3); break;
      case "SIX_MONTH": newEndDate = addMonths(newEndDate, 6); break;
      case "ANNUAL": newEndDate = addMonths(newEndDate, 12); break;
    }

    // Update membership with new plan, pricing tier, and recalculated end date
    await prisma.membership.update({
      where: { id: membershipId },
      data: {
        membershipPlanId: newMembershipPlanId,
        pricingTierId: newPricingTierId,
        endDate: newEndDate,
      },
    });

    // Update the user record with new end date
    await prisma.user.update({
      where: { id: userId },
      data: {
        membershipEnd: newEndDate,
      },
    });

    return { 
      success: true,
      message: "Membership plan changed successfully"
    };
  } catch (error) {
    console.error("Error changing membership plan:", error);
    return {
      success: false,
      message: "Failed to change membership plan",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}