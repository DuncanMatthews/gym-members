"use server";

import { PrismaClient } from "@prisma/client";
import { z } from "zod";

// Initialize Prisma client once
const prisma = new PrismaClient();

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
  console.log('formData',formData)
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
      console.log('data',data)
      return { message: "Failed to create membership plan", errors: {} };
    }

    return { message: "Membership created successfully!" };
  } catch (error) {
    console.log('data',error)
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
    });
    return plan;
  } catch (error) {
    console.error("Error fetching membership plan:", error);
    throw new Error("Failed to fetch membership plan");
  }
}

export async function updateMembershipPlan(
  id: string,
  formData: FormData
): Promise<ActionState> {
  try {
    const validatedFields = membershipSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description"),
      price: Number(formData.get("price")),
      billingCycle: formData.get("billingCycle"),
      features: formData.getAll("features"),
      isActive: formData.get("isActive") === "true",
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    await prisma.membershipPlan.update({
      where: { id },
      data: validatedFields.data,
    });

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
