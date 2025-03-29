'use server'

import { PrismaClient } from "@prisma/client";
import { z } from "zod";

// Initialize Prisma client once
const prisma = new PrismaClient();

// Updated schema for member creation with ID number and address fields
const memberSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable().transform(val => val || undefined),
  idNumber: z.string().min(1, "ID Number is required"),
  // Address fields
  addressLine1: z.string().optional().nullable().transform(val => val || undefined),
  addressLine2: z.string().optional().nullable().transform(val => val || undefined),
  city: z.string().optional().nullable().transform(val => val || undefined),
  state: z.string().optional().nullable().transform(val => val || undefined),
  postalCode: z.string().optional().nullable().transform(val => val || undefined),
  country: z.string().optional().nullable().transform(val => val || undefined),
});

export type CreateMemberInput = z.infer<typeof memberSchema>;

interface ActionState {
  errors?: Record<string, string[]>;
  message?: string;
}

export async function createMember(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  console.log("Previous state:", prevState);

  try {
    // Updated to include new fields
    const rawData = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      idNumber: formData.get("idNumber"),
      addressLine1: formData.get("addressLine1"),
      addressLine2: formData.get("addressLine2"),
      city: formData.get("city"),
      state: formData.get("state"),
      postalCode: formData.get("postalCode"),
      country: formData.get("country"),
    };

    const validatedData = memberSchema.safeParse(rawData);

    if (!validatedData.success) {
      return {
        errors: validatedData.error.flatten().fieldErrors,
      };
    }

    // Create user with new fields
    const userdata = await prisma.user.create({
      data: {
        ...validatedData.data,
        role: "MEMBER",
        password: "temporary-password",
      },
    });

    console.log("userdata", userdata);

    return {
      message: "Member created successfully!",
    };
  } catch (error) {
    console.error("Error creating member:", error);
    
    // Check for unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      if (error.message.includes('idNumber')) {
        return {
          message: "ID Number is already in use.",
          errors: {
            idNumber: ["This ID Number is already registered in the system."]
          },
        };
      }
      if (error.message.includes('email')) {
        return {
          message: "Email is already in use.",
          errors: {
            email: ["This email is already registered in the system."]
          },
        };
      }
    }
    
    return {
      message: "An unexpected error occurred. Please try again.",
      errors: {},
    };
  }
}

export async function getMemberById(id: string) {
  try {
    return await prisma.user.findUnique({
      where: { id },
      include: { membership: true },
    });
  } catch (error) {
    console.error("Error fetching member:", error);
    throw new Error("Failed to fetch member");
  }
}

export async function updateMember(id: string, formData: FormData): Promise<ActionState> {
  try {
    // Updated to include new fields
    const rawData = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      idNumber: formData.get("idNumber"),
      addressLine1: formData.get("addressLine1"),
      addressLine2: formData.get("addressLine2"),
      city: formData.get("city"),
      state: formData.get("state"),
      postalCode: formData.get("postalCode"),
      country: formData.get("country"),
      membershipPlanId: formData.get("membershipPlanId"),
      startDate: new Date(formData.get("startDate") as string),
      endDate: formData.get("endDate")
        ? new Date(formData.get("endDate") as string)
        : undefined,
    };

    const validatedData = memberSchema.safeParse(rawData);

    if (!validatedData.success) {
      return {
        errors: validatedData.error.flatten().fieldErrors,
      };
    }

    // Check if ID number is being changed and verify it's not already used
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { idNumber: true },
    });

    if (currentUser && currentUser.idNumber !== validatedData.data.idNumber) {
      // ID number is being changed, check if it's already in use
      const existingUserWithIdNumber = await prisma.user.findUnique({
        where: { idNumber: validatedData.data.idNumber },
      });

      if (existingUserWithIdNumber) {
        return {
          errors: {
            idNumber: ["This ID Number is already registered in the system."],
          },
        };
      }
    }

    await prisma.user.update({
      where: { id },
      data: validatedData.data,
    });

    return {
      message: "Member updated successfully!",
    };
  } catch (error) {
    console.error("Error updating member:", error);
    
    // Check for unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      if (error.message.includes('idNumber')) {
        return {
          message: "ID Number is already in use.",
          errors: {
            idNumber: ["This ID Number is already registered in the system."]
          },
        };
      }
      if (error.message.includes('email')) {
        return {
          message: "Email is already in use.",
          errors: {
            email: ["This email is already registered in the system."]
          },
        };
      }
    }
    
    return {
      message: "An unexpected error occurred. Please try again.",
      errors: {},
    };
  }
}

export async function deleteMember(id: string): Promise<ActionState> {
  try {
    await prisma.user.delete({
      where: { id },
    });

    return {
      message: "Member deleted successfully!",
    };
  } catch (error) {
    console.error("Error deleting member:", error);
    return {
      message: "An unexpected error occurred. Please try again.",
      errors: {},
    };
  }
}

export async function listMembers() {
  try {
    return await prisma.user.findMany({
      where: { role: "MEMBER" },
      include: { membership: true },
    });
  } catch (error) {
    console.error("Error fetching members:", error);
    throw new Error("Failed to fetch members");
  }
}

export async function searchMembersByIdNumber(idNumber: string) {
  try {
    return await prisma.user.findMany({
      where: {
        role: "MEMBER",
        idNumber: {
          contains: idNumber,
          mode: 'insensitive' // Case-insensitive search
        }
      },
      include: { membership: true },
    });
  } catch (error) {
    console.error("Error searching members by ID number:", error);
    throw new Error("Failed to search members");
  }
}