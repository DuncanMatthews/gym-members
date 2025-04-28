// app/(dashboard)/members/[id]/membership/actions.ts
"use server";

import { MembershipStatus } from "@prisma/client";
import { z } from "zod";
import { addMonths } from "date-fns";
import { prisma } from "@/lib/prisma";

// Initialize Prisma client once

// Schema for membership assignment validation
const membershipAssignmentSchema = z.object({
  userId: z.string(),
  membershipPlanId: z.string(),
  pricingTierId: z.string(),
  startDate: z.string().transform(val => new Date(val)),
  billingStartDate: z.string().transform(val => new Date(val)),
  autoRenew: z.string().transform(val => val === "true"),
  status: z.enum(["ACTIVE", "PENDING"]),
  customFields: z.string().optional().transform(val =>
    val ? JSON.parse(val) : undefined
  ),
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
      return { errors: validatedData.error.flatten().fieldErrors };
    }

    // Get pricing tier details for calculations
    const pricingTier = await prisma.pricingTier.findUnique({
      where: { id: validatedData.data.pricingTierId },
    });

    console.log("pricingTier", pricingTier)

    if (!pricingTier) {
      return { message: "Invalid pricing tier", errors: {} };
    }

    // Calculate key dates
    const startDate = new Date(validatedData.data.startDate);
    const billingStartDate = new Date(validatedData.data.billingStartDate);

    // Determine membership duration based on pricing tier
    // Determine membership duration based on pricing tier
    let endDate = new Date(startDate);
    switch (pricingTier.duration) {
      case "MONTHLY": 
        // Set to last day of current month
        endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0); 
        break;
      case "THREE_MONTH": 
        // First month is current month, so add 2 more months
        endDate = addMonths(endDate, 2); 
        // Set to last day of that month
        endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
        break;
      case "SIX_MONTH": 
        // First month is current month, so add 5 more months
        endDate = addMonths(endDate, 5); 
        endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
        break;
      case "ANNUAL": 
        // First month is current month, so add 11 more months
        endDate = addMonths(endDate, 11); 
        endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
        break;
    }
    
    // Remove this line since we're handling it in each case
    // endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
    // Set the end date to the last day of the month

    // Calculate next billing date (1st of next month)
    const nextBillingDate = new Date(billingStartDate.getFullYear(),
      billingStartDate.getMonth() + 1, 1);

    console.log('nextBillingDate', nextBillingDate)

    // Calculate prorated amount if starting mid-month
    const daysInMonth = new Date(startDate.getFullYear(),
      startDate.getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - startDate.getDate() + 1;
    const proratedAmount = remainingDays > 0 ?
      (pricingTier.price / daysInMonth) * remainingDays :
      pricingTier.price;

    // Execute everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the membership
      const membership = await tx.membership.create({
        data: {
          membershipPlanId: validatedData.data.membershipPlanId,
          pricingTierId: validatedData.data.pricingTierId,
          billingStartDate: billingStartDate,
          nextBillingDate: nextBillingDate,
          endDate: endDate,
          startDate: startDate,
          autoRenew: validatedData.data.autoRenew,
          status: validatedData.data.status as MembershipStatus,
          proratedAmount: proratedAmount,
          customFields: validatedData.data.customFields,
          users: {
            connect: { id: validatedData.data.userId }
          }
        },
      });

      // 2. Update the user record
      const userUpdate = await tx.user.update({
        where: { id: validatedData.data.userId },
        data: {
          membershipId: membership.id,
          membershipStart: startDate,
          membershipEnd: endDate,
          isActive: validatedData.data.status === "ACTIVE",
        },
      });

      console.log('userUpdate', userUpdate)

      // 3. Create initial invoice
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${membership.id.slice(0, 6)}`;
      await tx.invoice.create({
        data: {
          membershipId: membership.id,
          userId: validatedData.data.userId,
          invoiceNumber: invoiceNumber,
          subtotal: proratedAmount,
          total: proratedAmount,
          issueDate: new Date(),
          dueDate: new Date(startDate.getTime() + (24 * 60 * 60 * 1000)), // Due next day
          status: "ISSUED",
          notes: "Initial membership payment",
          payments: {
            create: {
              membershipId: membership.id,
              userId: validatedData.data.userId,
              amount: proratedAmount,
              status: "PENDING",
              periodStart: startDate,
              periodEnd: endDate,
              dueDate: new Date(startDate.getTime() + (24 * 60 * 60 * 1000)),
            }
          }
        }
      });

      return membership;
    });

    console.log('result1', result)

    return { message: "Membership assigned successfully!" };
  } catch (error) {
    console.error("Error:", error);
    return {
      message: "An unexpected error occurred. Please try again.",
      errors: {}
    };
  }
}



// Add this function to the existing file

export async function cancelMembership(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    // Extract and validate form data
    const membershipId = formData.get("membershipId") as string;
    const userId = formData.get("userId") as string;
    const cancellationReason = formData.get("cancellationReason") as string;
    const effectiveDate = formData.get("effectiveDate")
      ? new Date(formData.get("effectiveDate") as string)
      : new Date(); // Default to today if not provided

    if (!membershipId || !userId) {
      return {
        message: "Missing required information",
        errors: {
          membershipId: !membershipId ? ["Membership ID is required"] : [],
          userId: !userId ? ["User ID is required"] : []
        }
      };
    }



    // Execute everything in a transaction
    await prisma.$transaction(async (tx) => {
      // Get existing membership data first
      const existingMembership = await tx.membership.findUnique({
        where: { id: membershipId },
        select: { customFields: true }
      });

      // 1. Update the membership status
      await tx.membership.update({
        where: { id: membershipId },
        data: {
          status: "CANCELLED",
          customFields: {
            ...(typeof existingMembership?.customFields === 'object' ? existingMembership.customFields : {}),
            cancellationReason,
            cancellationDate: new Date().toISOString(),
            effectiveDate: effectiveDate.toISOString()
          }
        },
      });
      // 2. Update the user record
      await tx.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          // Keep the membershipId reference for historical purposes
        },
      });

      // 3. Cancel any pending invoices
      await tx.invoice.updateMany({
        where: {
          membershipId: membershipId,
          status: { in: ["DRAFT", "ISSUED", "PARTIALLY_PAID"] }
        },
        data: {
          status: "CANCELLED",
          notes: "Cancelled due to membership cancellation"
        }
      });

      // 4. Cancel any pending payments
      await tx.payment.updateMany({
        where: {
          membershipId: membershipId,
          status: "PENDING"
        },
        data: {
          status: "CANCELLED"
        }
      });
    });

    return { message: "Membership cancelled successfully" };
  } catch (error) {
    console.error("Error cancelling membership:", error);
    return {
      message: "An unexpected error occurred. Please try again.",
      errors: {}
    };
  }
}