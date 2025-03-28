"use server";

import { PrismaClient } from "@prisma/client";
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
