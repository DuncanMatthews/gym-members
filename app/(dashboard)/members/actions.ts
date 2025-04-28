/* eslint-disable @typescript-eslint/no-unused-vars */
'use server'
import { unstable_cache } from 'next/cache';

import { prisma } from "@/lib/prisma";
import { MembershipStatus, Prisma } from "@prisma/client";
import { z } from "zod";

// Initialize Prisma client once

// Updated schema for member creation with ID number and address fields
const memberSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable().transform(val => val || undefined),
  idNumber: z.string().min(1, "ID Number is required"),
  // Handle Date of Birth properly
  dateOfBirth: z.string().optional().transform(val => val ? new Date(val) : undefined),
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
      dateOfBirth: formData.get("dateOfBirth"),
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

// Update in app/(dashboard)/members/actions.ts
export async function getMemberById(id: string) {
  try {
    return await prisma.user.findUnique({
      where: { id },
      // No need to explicitly specify all fields - by default Prisma returns all fields of the main model
      include: {
        membership: {
          include: {
            membershipPlan: true,
            pricingTier: true,
          }
        },
        payments: {
          where: {
            userId: id,
            status: "PENDING",
          },
          orderBy: {
            dueDate: 'asc'
          }
        },
        invoices: {
          where: {
            userId: id,
            OR: [
              { status: "ISSUED" },
              { status: "PARTIALLY_PAID" },
              { status: "OVERDUE" }
            ],
          },
          orderBy: {
            dueDate: 'asc'
          }
        }
      },
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
      dateOfBirth: formData.get("dateOfBirth") || undefined,
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

    // Extract only the fields that are valid for the User model
    const {
      name,
      email,
      phone,
      idNumber,
      dateOfBirth,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
    } = validatedData.data;

    // Update with only valid fields for the User model
    await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        idNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
      },
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

// Add this function to the actions.ts file

export async function filterMembers(params: {
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const { search, status, sortBy = 'name', sortOrder = 'asc' } = params;
  console.log("Filtering with status:", status); // Debug log


  try {
    const whereClause: Prisma.UserWhereInput = { role: "MEMBER" };

    // Add search condition if provided
    if (search) {
      whereClause.OR = [
        { idNumber: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Handle membership status filtering properly
    if (status && status !== "ALL") {
      whereClause.membership = {
        status: status as MembershipStatus
      };
    }
    
    // Construct the orderBy object with proper type safety
    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [sortBy]: sortOrder
    };

    return await prisma.user.findMany({
      where: whereClause,
      include: { membership: true },
      orderBy
    });
  } catch (error) {
    console.error("Error filtering members:", error);
    throw new Error("Failed to filter members");
  }
}

// Add this separate function for efficiently getting counts in one query
export async function getMemberStatusCounts() {
  return unstable_cache(
    async () => {
      try {
        // Get all members with their membership status
        const members = await prisma.user.findMany({
          where: { role: "MEMBER" },
          select: {
            id: true,
            membership: {
              select: {
                status: true
              }
            }
          }
        });
        
        // Initialize counts object
        const counts = {
          ALL: 0,
          ACTIVE: 0,
          PENDING: 0,
          PAUSED: 0,
          CANCELLED: 0,
          EXPIRED: 0,
          FROZEN: 0
        };
        
        // Count members by status
        members.forEach(member => {
          counts.ALL++;
          if (member.membership?.status) {
            counts[member.membership.status]++;
          }
        });
        
        return counts;
      } catch (error) {
        console.error("Error getting member status counts:", error);
        throw new Error("Failed to get member status counts");
      }
    },
    ['member-status-counts'],
    {
      revalidate: 60, // Revalidate every 60 seconds
      tags: ['members'] // Add tags for manual revalidation
    }
  )();
}