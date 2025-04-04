// app/(dashboard)/members/[id]/membership/actions.ts
"use server";

import { PrismaClient, MembershipStatus } from "@prisma/client";
import { z } from "zod";
import { addMonths } from "date-fns";

// Initialize Prisma client once
const prisma = new PrismaClient();

// Schema for membership assignment validation
const membershipAssignmentSchema = z.object({
  userId: z.string(),
  membershipPlanId: z.string(),
  pricingTierId: z.string(),
  startDate: z.string().transform(val => new Date(val)),
  billingStartDate: z.string().transform(val => new Date(val)),
  autoRenew: z.string().transform(val => val === "true"),
  status: z.enum(["ACTIVE", "PENDING"]),
  customFields: z.string().optional().transform(val => val ? JSON.parse(val) : undefined),
});

interface ActionState {
  errors?: Record<string, string[]>;
  message?: string;
}

export async function assignMembershipToUser(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    // Extract and validate form data
    const rawData = {
      userId: formData.get("userId"),
      membershipPlanId: formData.get("membershipPlanId"),
      pricingTierId: formData.get("pricingTierId"),
      startDate: formData.get("startDate"),
      billingStartDate: formData.get("billingStartDate"),
      autoRenew: formData.get("autoRenew"),
      status: formData.get("status"),
      customFields: formData.get("customFields")
    };

    const validatedData = membershipAssignmentSchema.safeParse(rawData);

    if (!validatedData.success) {
      return {
        errors: validatedData.error.flatten().fieldErrors,
      };
    }

    // Get the pricing tier to calculate duration and end date
    const pricingTier = await prisma.pricingTier.findUnique({
      where: { id: validatedData.data.pricingTierId },
    });

    if (!pricingTier) {
      return {
        message: "Invalid pricing tier selected",
        errors: {
          pricingTierId: ["Selected pricing tier does not exist"]
        }
      };
    }

    // Calculate end date based on membership duration
    let endDate = new Date(validatedData.data.startDate);
    const nextBillingDate = new Date(validatedData.data.billingStartDate);
    
    switch (pricingTier.duration) {
      case "MONTHLY":
        endDate = addMonths(endDate, 1);
        break;
      case "THREE_MONTH":
        endDate = addMonths(endDate, 3);
        break;
      case "SIX_MONTH":
        endDate = addMonths(endDate, 6);
        break;
      case "ANNUAL":
        endDate = addMonths(endDate, 12);
        break;
      default:
        endDate = addMonths(endDate, 1);
    }

    // Create the membership
    const membership = await prisma.membership.create({
      data: {
        membershipPlanId: validatedData.data.membershipPlanId,
        pricingTierId: validatedData.data.pricingTierId,
        billingStartDate: validatedData.data.billingStartDate,
        nextBillingDate,
        endDate,
        startDate: validatedData.data.startDate,
        autoRenew: validatedData.data.autoRenew,
        status: validatedData.data.status as MembershipStatus,
        customFields: validatedData.data.customFields,
        users: {
          connect: { 
            id: validatedData.data.userId 
          }
        }
      },
    });

    // Update the user with membership information
    await prisma.user.update({
      where: { id: validatedData.data.userId },
      data: {
        membershipId: membership.id,
        membershipStart: validatedData.data.startDate,
        membershipEnd: endDate,
        isActive: validatedData.data.status === "ACTIVE",
      },
    });

    return {
      message: "Membership assigned successfully!",
    };
  } catch (error) {
    console.error("Error assigning membership:", error);
    return {
      message: "An unexpected error occurred. Please try again.",
      errors: {},
    };
  }
}