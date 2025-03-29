"use server";

import { MembershipPlan, PrismaClient } from "@prisma/client";
import { z } from "zod";

// Initialize Prisma client once
const prisma = new PrismaClient();

const membershipSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0, "Price must be a positive number"),
  billingCycle: z.enum(["monthly", "quarterly", "annually"]),
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

    console.log("data1", validatedFields);

    const data = await prisma.membershipPlan.create({
      data: {
        name: validatedFields.data.name,
        description: validatedFields.data.description,
        price: validatedFields.data.price,
        billingCycle: validatedFields.data.billingCycle,
        features: validatedFields.data.features,
        isActive: validatedFields.data.isActive,
      },
    });

    console.log("data1", data);

    if (!data) {
      return {
        message: "Failed to create membership plan",
        errors: {},
      };
    }

    return {
      message: "Membership created successfully!",
    };
  } catch (error) {
    console.error("Error creating membership:", error);
    return {
      message: "An unexpected error occurred. Please try again.",
      errors: {},
    };
  }
}

export async function getMembershipPlans(): Promise<
  (Omit<MembershipPlan, "price" | "createdAt" | "updatedAt"> & {
    price: string;
    createdAt: string;
    updatedAt: string;
  })[]
> {
  try {
    const plans: MembershipPlan[] = await prisma.membershipPlan.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Serialize for client components
    return plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price.toString(),
      billingCycle: plan.billingCycle,
      features: plan.features,
      isActive: plan.isActive,
      attributes: plan.attributes,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.log("Error fetching membership plans:", error);
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
