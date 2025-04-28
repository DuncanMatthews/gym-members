import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Payment, Invoice } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function hasDuePayments(payments: Payment[], invoices: Invoice[]): boolean {
  return payments.length > 0 || invoices.length > 0;
}

export function getNextDuePayment(payments: Payment[], invoices: Invoice[]): { amount: number, dueDate: Date } | null {
  const allDueItems = [
    ...payments.map(p => ({ amount: p.amount, dueDate: p.dueDate, type: 'payment' as const })),
    ...invoices.map(i => ({ amount: i.total, dueDate: i.dueDate, type: 'invoice' as const }))
  ];
  
  if (allDueItems.length === 0) return null;
  
  // Sort by due date (oldest first)
  allDueItems.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  
  return {
    amount: allDueItems[0].amount,
    dueDate: allDueItems[0].dueDate
  };
}

export function getTotalOutstandingAmount(payments: Payment[], invoices: Invoice[]): number {
 
  const invoiceTotal = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  
  return invoiceTotal;
}


