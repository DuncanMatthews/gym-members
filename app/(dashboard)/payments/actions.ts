// app/(dashboard)/payments/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import {
    Payment,
    PaymentStatus,
    Prisma
} from "@prisma/client";


export type PaymentWithRelations = Payment & {
    user: { id: string; name: string; email: string };
    invoice?: { id: string; invoiceNumber: string }; // Remove status and null possibility
    membership: { membershipPlan: { id: string; name: string } };
};


/**
 * Get filtered payments with pagination
 */
export async function getPayments(
    filters: {
        status?: PaymentStatus;
        userId?: string;
        membershipId?: string;
        dateFrom?: Date;
        dateTo?: Date;
        invoiceId?: string;
    } = {},
    page = 1,
    pageSize = 10
): Promise<{
    payments: PaymentWithRelations[];

    total: number;
    pages: number
}> {
    // Early return for invalid pagination parameters
    if (page < 1 || pageSize < 1) {
        return { payments: [], total: 0, pages: 0 };
    }

    try {
        // Build query filters
        const where: Prisma.PaymentWhereInput = {};

        if (filters.status) where.status = filters.status;
        if (filters.userId) where.userId = filters.userId;
        if (filters.membershipId) where.membershipId = filters.membershipId;
        if (filters.invoiceId) where.invoiceId = filters.invoiceId;

        // Date range filters
        if (filters.dateFrom || filters.dateTo) {
            where.dueDate = {};
            if (filters.dateFrom) where.dueDate.gte = filters.dateFrom;
            if (filters.dateTo) where.dueDate.lte = filters.dateTo;
        }

        // Get total count for pagination in parallel with payments query
        const [total, payments] = await Promise.all([
            prisma.payment.count({ where }),
            prisma.payment.findMany({
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
                    invoice: {
                        select: {
                            id: true,
                            invoiceNumber: true,
                            status: true
                        }
                    }
                },
                orderBy: [
                    { paidDate: 'desc' },
                    { dueDate: 'desc' }
                ],
                skip: (page - 1) * pageSize,
                take: pageSize
            })
        ]);

        const pages = Math.ceil(total / pageSize);

        // Fix the return statement
        return {
            payments: payments.map(payment => ({
                ...payment,
                invoice: payment.invoice ? {
                    id: payment.invoice.id,
                    invoiceNumber: payment.invoice.invoiceNumber
                } : undefined
            })) as PaymentWithRelations[],
            total,
            pages
        };
    } catch (error) {
        console.error("Error fetching payments:", error);
        throw new Error("Failed to fetch payments");
    }
}

// Add to app/(dashboard)/payments/actions.ts

/**
 * Get a single payment by ID with full relations
 */
export async function getPaymentById(
    paymentId: string
  ): Promise<PaymentWithRelations | null> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
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
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              status: true
            }
          }
        }
      });
  
      if (!payment) return null;
  
      return {
        ...payment,
        invoice: payment.invoice ? {
          id: payment.invoice.id,
          invoiceNumber: payment.invoice.invoiceNumber
        } : undefined
      } as PaymentWithRelations;
    } catch (error) {
      console.error("Error fetching payment:", error);
      throw new Error("Failed to fetch payment details");
    }
  }