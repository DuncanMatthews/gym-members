// app/api/invoices/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import {
  InvoiceStatus,
  PaymentStatus,
  MembershipStatus,
  MembershipDuration,
  Invoice,
  Prisma
} from "@prisma/client";
import { addMonths, differenceInDays, getDaysInMonth, endOfMonth, format } from "date-fns";
import { revalidatePath } from "next/cache";


const PAYMENT_GRACE_PERIOD_DAYS = 5;


// Common response type for actions
// Common response type for actions
interface ActionResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  errors?: Record<string, string[]>;
}



// Generate an invoice number
function generateInvoiceNumber(userId: string): string {
  return `INV-${userId.slice(-5)}-${format(new Date(), 'yyyyMMdd')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
}

// Calculate prorated amount for partial month
export async function calculateProratedAmount(
  pricingTierId: string,
  startDate: Date
): Promise<number> {
  const pricingTier = await prisma.pricingTier.findUnique({
    where: { id: pricingTierId },
  });

  if (!pricingTier) {
    throw new Error("Pricing tier not found");
  }

  const monthEnd = endOfMonth(startDate);
  const daysInMonth = getDaysInMonth(startDate);
  const daysRemaining = differenceInDays(monthEnd, startDate) + 1;

  // Calculate prorated amount
  return parseFloat((pricingTier.price * daysRemaining / daysInMonth).toFixed(2));
}

// Create a prorated invoice for new membership
export async function createProratedInvoice(
  membershipId: string,
  userId: string,
  startDate: Date,
  pricingTierId: string
): Promise<ActionResponse> {
  try {
    // First check if the membership and user exist
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: { pricingTier: true }
    });

    if (!membership) {
      return {
        success: false,
        message: "Membership not found",
        errors: { membershipId: ["Invalid membership ID"] }
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return {
        success: false,
        message: "User not found",
        errors: { userId: ["Invalid user ID"] }
      };
    }

    // Calculate prorated amount
    const proratedAmount = await calculateProratedAmount(pricingTierId, startDate);

    // Only create invoice if there's an amount to charge
    if (proratedAmount <= 0) {
      return {
        success: true,
        message: "No prorated amount due for this period",
        data: { proratedAmount: 0 }
      };
    }

    // Create the invoice
    const invoiceNumber = generateInvoiceNumber(userId);
    const monthEnd = endOfMonth(startDate);

    const invoice = await prisma.invoice.create({
      data: {
        membershipId: membershipId,
        userId: userId,
        invoiceNumber: invoiceNumber,
        subtotal: proratedAmount,
        tax: 0, // Add tax calculation if needed
        discount: 0, // Add discount if needed
        total: proratedAmount,
        status: InvoiceStatus.ISSUED,
        issueDate: new Date(),
        dueDate: new Date(), // Due immediately
        notes: `Prorated membership fee for ${format(startDate, "MMM d")} to ${format(monthEnd, "MMM d, yyyy")}`,
        payments: {
          create: {
            membershipId: membershipId,
            userId: userId,
            amount: proratedAmount,
            status: PaymentStatus.PENDING,
            periodStart: startDate,
            periodEnd: monthEnd,
            dueDate: new Date(),
          }
        }
      },
      include: {
        payments: true,
      }
    });

    return {
      success: true,
      message: "Prorated invoice created successfully",
      data: invoice
    };

  } catch (error) {
    console.error("Error creating prorated invoice:", error);
    return {
      success: false,
      message: "Failed to create prorated invoice",
      errors: { general: ["An unexpected error occurred"] }
    };
  }
}

// Create a regular monthly/recurring invoice
export async function createRecurringInvoice(
  membership: {
    id: string;
    users: { id: string; isActive?: boolean }[];
    nextBillingDate: Date | string;
    pricingTier: { price: number; duration: MembershipDuration };
    membershipPlan: { name: string };
    autoRenew?: boolean;
    paidMonths: number;
    endDate: Date;
  }
): Promise<ActionResponse> {
  try {
    if (!membership.users || membership.users.length === 0) {
      return {
        success: false,
        message: "No users associated with this membership",
        errors: { membershipId: ["Membership has no users"] }
      };
    }

    const user = membership.users[0]; // Assuming one primary user per membership
    const periodStart = new Date(membership.nextBillingDate);
    const periodEnd = addMonths(periodStart, 1);

    // Create the invoice
    const invoiceNumber = generateInvoiceNumber(user.id);

    const invoice = await prisma.invoice.create({
      data: {
        membershipId: membership.id,
        userId: user.id,
        invoiceNumber: invoiceNumber,
        subtotal: membership.pricingTier.price,
        tax: 0, // Add tax calculation if needed
        discount: 0, // Add discount if needed
        total: membership.pricingTier.price,
        status: InvoiceStatus.ISSUED,
        issueDate: new Date(),
        dueDate: new Date(periodStart), // Due on the billing date
        notes: `Regular membership payment for ${membership.membershipPlan.name} - ${format(periodStart, "MMM d")} to ${format(periodEnd, "MMM d, yyyy")}`,
        payments: {
          create: {
            membershipId: membership.id,
            userId: user.id,
            amount: membership.pricingTier.price,
            status: PaymentStatus.PENDING,
            periodStart: periodStart,
            periodEnd: periodEnd,
            dueDate: new Date(periodStart),
          }
        }
      },
      include: {
        payments: true,
      }
    });

    // Update the membership's next billing date
    await prisma.membership.update({
      where: { id: membership.id },
      data: {
        nextBillingDate: periodEnd,
        paidMonths: { increment: 1 },
      }
    });

    return {
      success: true,
      message: "Recurring invoice created successfully",
      data: invoice
    };

  } catch (error) {
    console.error("Error creating recurring invoice:", error);
    return {
      success: false,
      message: "Failed to create recurring invoice",
      errors: { general: ["An unexpected error occurred"] }
    };
  }
}

// Process payment for an invoice
export async function processInvoicePayment(
  invoiceId: string,
  paymentMethod: string,
  transactionId?: string
): Promise<ActionResponse> {
  try {
    // Find the invoice and related payment
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: true,
        membership: {
          include: {
            users: true
          }
        }
      }
    });

    if (!invoice) {
      return {
        success: false,
        message: "Invoice not found",
        errors: { invoiceId: ["Invalid invoice ID"] }
      };
    }

    if (invoice.status === InvoiceStatus.PAID) {
      return {
        success: false,
        message: "Invoice is already paid",
        errors: { invoiceId: ["This invoice has already been paid"] }
      };
    }

    // Process the payment (in a real app, this would integrate with a payment processor)
    // For this example, we'll assume the payment was successful

    // Update the payment record
    const payment = invoice.payments[0]; // Assuming one payment per invoice for simplicity
    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          paidDate: new Date(),
          paymentMethod: paymentMethod,
          transactionId: transactionId
        }
      });
    }

    // Update the invoice
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.PAID,
        paidDate: new Date()
      }
    });

    // If this was for a PENDING membership, update it to ACTIVE only if no pending payments
    if (invoice.membership.status === MembershipStatus.PENDING) {
      // Check if the user has any pending payments
      const pendingPayments = await prisma.payment.findMany({
        where: {
          membershipId: invoice.membershipId,
          status: PaymentStatus.PENDING,
          id: { not: payment?.id } // Exclude the current payment we just processed
        }
      });

      // Only activate if no other pending payments
      if (pendingPayments.length === 0) {
        await prisma.membership.update({
          where: { id: invoice.membershipId },
          data: {
            status: MembershipStatus.ACTIVE
          }
        });

        // Also update user's active status if needed
        if (invoice.membership.users[0] && !invoice.membership.users[0].isActive) {
          await prisma.user.update({
            where: { id: invoice.membership.users[0].id },
            data: {
              isActive: true
            }
          });
        }
      }
    }

    // Revalidate related paths to update UI
    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath(`/members/${invoice.userId}`);

    return {
      success: true,
      message: "Payment processed successfully",
      data: { invoiceId, paymentId: payment?.id }
    };

  } catch (error) {
    console.error("Error processing payment:", error);
    return {
      success: false,
      message: "Failed to process payment",
      errors: { general: ["An unexpected error occurred"] }
    };
  }
}

// Mark an invoice as overdue
export async function markInvoiceOverdue(invoiceId: string): Promise<ActionResponse> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return {
        success: false,
        message: "Invoice not found",
        errors: { invoiceId: ["Invalid invoice ID"] }
      };
    }

    if (invoice.status === InvoiceStatus.PAID) {
      return {
        success: false,
        message: "Paid invoices cannot be marked as overdue",
        errors: { invoiceId: ["This invoice has already been paid"] }
      };
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.OVERDUE
      }
    });

    return {
      success: true,
      message: "Invoice marked as overdue",
      data: { invoiceId }
    };

  } catch (error) {
    console.error("Error marking invoice as overdue:", error);
    return {
      success: false,
      message: "Failed to update invoice status",
      errors: { general: ["An unexpected error occurred"] }
    };
  }
}

// Cancel an invoice
export async function cancelInvoice(
  invoiceId: string,
  reason: string
): Promise<ActionResponse> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: true
      }
    });

    if (!invoice) {
      return {
        success: false,
        message: "Invoice not found",
        errors: { invoiceId: ["Invalid invoice ID"] }
      };
    }

    if (invoice.status === InvoiceStatus.PAID) {
      return {
        success: false,
        message: "Paid invoices cannot be cancelled",
        errors: { invoiceId: ["This invoice has already been paid"] }
      };
    }

    // Update the invoice status
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.CANCELLED,
        notes: invoice.notes ? `${invoice.notes}\nCancellation reason: ${reason}` : `Cancellation reason: ${reason}`
      }
    });

    // Also cancel associated payments
    for (const payment of invoice.payments) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.CANCELLED
        }
      });
    }

    return {
      success: true,
      message: "Invoice cancelled successfully",
      data: { invoiceId }
    };

  } catch (error) {
    console.error("Error cancelling invoice:", error);
    return {
      success: false,
      message: "Failed to cancel invoice",
      errors: { general: ["An unexpected error occurred"] }
    };
  }
}

// Process recurring payments for all memberships
export async function processRecurringPayments(): Promise<ActionResponse> {
  try {
    // Get all active memberships due for billing (today or earlier)
    const today = new Date();
    const dueForBilling = await prisma.membership.findMany({
      where: {
        status: MembershipStatus.ACTIVE,
        nextBillingDate: {
          lte: today,
        },
      },
      include: {
        users: true,
        pricingTier: true,
        membershipPlan: true,
      }
    });

    const results = [];

    // Process each membership
    for (const membership of dueForBilling) {
      // Check if we should continue billing this membership
      const shouldContinueBilling = membership.autoRenew ||
        (membership.paidMonths < getRequiredPaymentsForDuration(membership.pricingTier.duration));

      if (!shouldContinueBilling) {
        // Membership has reached its commitment period and doesn't auto-renew
        await prisma.membership.update({
          where: { id: membership.id },
          data: {
            status: MembershipStatus.EXPIRED
          }
        });

        results.push({
          membershipId: membership.id,
          result: "Membership expired - no invoice created"
        });

        continue;
      }

      // Check if we're renewing after commitment period
      const isNewTerm = membership.paidMonths >= getRequiredPaymentsForDuration(membership.pricingTier.duration) &&
        membership.autoRenew;

      if (isNewTerm) {
        // Reset paid months and extend end date for a new term
        await prisma.membership.update({
          where: { id: membership.id },
          data: {
            paidMonths: 0,
            endDate: addMonths(membership.endDate, getMonthsForDuration(membership.pricingTier.duration))
          }
        });
      }

      // Create the invoice
      const invoiceResult = await createRecurringInvoice(membership);
      results.push({
        membershipId: membership.id,
        result: invoiceResult.success ? "Invoice created" : invoiceResult.message
      });
    }

    return {
      success: true,
      message: `Processed ${results.length} memberships for recurring billing`,
      data: { processed: results }
    };

  } catch (error) {
    console.error("Error processing recurring payments:", error);
    return {
      success: false,
      message: "Failed to process recurring payments",
      errors: {
        general: ["An unexpected error occurred while processing recurring payments"]
      }
    };
  }
}

// Helper function to determine required payments based on duration
function getRequiredPaymentsForDuration(duration: MembershipDuration): number {
  switch (duration) {
    case "MONTHLY": return 1;
    case "THREE_MONTH": return 3;
    case "SIX_MONTH": return 6;
    case "ANNUAL": return 12;
    default: return 1;
  }
}

// Helper function to get months for duration
function getMonthsForDuration(duration: MembershipDuration): number {
  switch (duration) {
    case "MONTHLY": return 1;
    case "THREE_MONTH": return 3;
    case "SIX_MONTH": return 6;
    case "ANNUAL": return 12;
    default: return 1;
  }
}

// Get all invoices with filtering options
export async function getInvoices(
  filters: {
    status?: InvoiceStatus;
    userId?: string;
    membershipId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    isOverdue?: boolean;
  } = {},
  page: number = 1,
  pageSize: number = 10
): Promise<{ 
  invoices: (Invoice & { 
    user: { id: string; name: string; email: string }; 
    membership: { membershipPlan: { name: string } } 
  })[]; 
  total: number; 
  pages: number 
}> {
  // Rest of the function remains the same
  try {
    const where: Prisma.InvoiceWhereInput = {};

    // Apply filters
    if (filters.status) where.status = filters.status;
    if (filters.userId) where.userId = filters.userId;
    if (filters.membershipId) where.membershipId = filters.membershipId;

    // Date range filters
    if (filters.dateFrom || filters.dateTo) {
      where.issueDate = {};
      if (filters.dateFrom) where.issueDate.gte = filters.dateFrom;
      if (filters.dateTo) where.issueDate.lte = filters.dateTo;
    }

    // Overdue invoices
    if (filters.isOverdue) {
      where.OR = [
        { status: InvoiceStatus.OVERDUE },
        {
          status: InvoiceStatus.ISSUED,
          dueDate: { lt: new Date() }
        }
      ];
    }

    // Get total count for pagination
    const total = await prisma.invoice.count({ where });
    const pages = Math.ceil(total / pageSize);

    // Get invoices with pagination
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        membership: {
          include: {
            membershipPlan: true
          }
        },
        payments: true
      },
      orderBy: {
        issueDate: 'desc'
      },
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    return {
      invoices,
      total,
      pages
    };
  } catch (error) {
    console.error("Error fetching invoices:", error);
    throw error;
  }
}

// Get invoice by ID with all details
export async function getInvoiceById(invoiceId: string): Promise<Invoice> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            state: true,
            postalCode: true,
            country: true
          }
        },
        membership: {
          include: {
            membershipPlan: true,
            pricingTier: true
          }
        },
        payments: true
      }
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    return invoice;
  } catch (error) {
    console.error("Error fetching invoice:", error);
    throw error;
  }
}

// Send invoice reminder email
export async function sendInvoiceReminder(invoiceId: string): Promise<ActionResponse> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        user: true
      }
    });

    if (!invoice) {
      return {
        success: false,
        message: "Invoice not found",
        errors: { invoiceId: ["Invalid invoice ID"] }
      };
    }

    if (invoice.status === InvoiceStatus.PAID) {
      return {
        success: false,
        message: "Cannot send reminder for paid invoice",
        errors: { invoiceId: ["This invoice has already been paid"] }
      };
    }

    // In a real implementation, you would send an email here
    // For this example, we'll just update a metadata field

    // const currentMetadata = invoice.metadata || {};
    // const reminders = currentMetadata.reminders || [];

    // const updatedMetadata = {
    //   ...currentMetadata,
    //   reminders: [
    //     ...reminders,
    //     {
    //       sentAt: new Date().toISOString(),
    //       type: "email"
    //     }
    //   ]
    // };

    // await prisma.invoice.update({
    //   where: { id: invoiceId },
    //   data: {
    //     metadata: updatedMetadata
    //   }
    // });

    return {
      success: true,
      message: "Payment reminder sent successfully",
      data: { invoiceId }
    };
  } catch (error) {
    console.error("Error sending invoice reminder:", error);
    return {
      success: false,
      message: "Failed to send payment reminder",
      errors: { general: ["An unexpected error occurred"] }
    };
  }
}

export async function checkOverduePaymentsAndFreezeMemberships(): Promise<ActionResponse> {
  try {
    const today = new Date();
    
    // Find all overdue invoices beyond grace period
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        OR: [
          {
            status: InvoiceStatus.ISSUED,
            dueDate: {
              lt: new Date(today.getTime() - (PAYMENT_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000))
            }
          },
          {
            status: InvoiceStatus.PARTIALLY_PAID,
            dueDate: {
              lt: new Date(today.getTime() - (PAYMENT_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000))
            }
          }
        ]
      },
      include: {
        membership: true,
        user: true
      }
    });
    
    // Group by membership to avoid duplicates
    const membershipIdsToFreeze = new Set<string>();
    const userIdsToUpdate = new Set<string>();
    
    // Update invoice status to OVERDUE
    for (const invoice of overdueInvoices) {
      // Mark invoice as overdue if not already
      if (invoice.status !== InvoiceStatus.OVERDUE) {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: InvoiceStatus.OVERDUE }
        });
      }
      
      // Only freeze ACTIVE memberships
      if (invoice.membership?.status === MembershipStatus.ACTIVE) {
        membershipIdsToFreeze.add(invoice.membership.id);
        userIdsToUpdate.add(invoice.user.id);
      }
    }
    
    // Freeze memberships in a single batch operation
    if (membershipIdsToFreeze.size > 0) {
      await prisma.membership.updateMany({
        where: { 
          id: { in: Array.from(membershipIdsToFreeze) },
          status: MembershipStatus.ACTIVE
        },
        data: { status: MembershipStatus.FROZEN }
      });
    }
    
    // Update user active status
    if (userIdsToUpdate.size > 0) {
      await prisma.user.updateMany({
        where: { id: { in: Array.from(userIdsToUpdate) } },
        data: { isActive: false }
      });
    }
    
    // Revalidate relevant paths
    revalidatePath("/members");
    revalidatePath("/payments/invoices");
    
    return {
      success: true,
      message: `Processed ${overdueInvoices.length} overdue invoices, froze ${membershipIdsToFreeze.size} memberships`,
      data: {
        processedInvoices: overdueInvoices.length,
        frozenMemberships: membershipIdsToFreeze.size,
        deactivatedUsers: userIdsToUpdate.size
      }
    };
    
  } catch (error) {
    console.error("Error checking overdue payments:", error);
    return {
      success: false,
      message: "Failed to process overdue payments",
      errors: { general: ["An unexpected error occurred"] }
    };
  }
}