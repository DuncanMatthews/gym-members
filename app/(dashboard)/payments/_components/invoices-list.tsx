"use client";

import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical, Eye, FileDown, CreditCard } from "lucide-react";
import { InvoiceStatus } from "@prisma/client";
import Link from "next/link";
import { useState } from "react";
import { PaymentProcessModal } from "./payment-process-modal";

// Define status badge variants
const statusVariants = {
  [InvoiceStatus.DRAFT]: "bg-gray-100 text-gray-800",
  [InvoiceStatus.ISSUED]: "bg-blue-100 text-blue-800",
  [InvoiceStatus.PAID]: "bg-green-100 text-green-800",
  [InvoiceStatus.PARTIALLY_PAID]: "bg-yellow-100 text-yellow-800",
  [InvoiceStatus.OVERDUE]: "bg-red-100 text-red-800",
  [InvoiceStatus.CANCELLED]: "bg-gray-100 text-gray-500",
};

// Map status to readable text
const statusText = {
  [InvoiceStatus.DRAFT]: "Draft",
  [InvoiceStatus.ISSUED]: "Issued",
  [InvoiceStatus.PAID]: "Paid",
  [InvoiceStatus.PARTIALLY_PAID]: "Partially Paid",
  [InvoiceStatus.OVERDUE]: "Overdue",
  [InvoiceStatus.CANCELLED]: "Cancelled",
};

type InvoiceWithRelations = {
  id: string;
  invoiceNumber: string;
  total: number;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  paidDate: Date | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
  membership: {
    membershipPlan: {
      name: string;
    };
  };
};

interface InvoicesListProps {
  invoices: InvoiceWithRelations[];
  onMarkPaid?: (id: string) => void;
  onMarkOverdue?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export function InvoicesList({
  invoices,
  onMarkPaid,
  onMarkOverdue,
  onCancel,
}: InvoicesListProps) {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<{
    id: string;
    invoiceNumber: string;
    amount: number;
  } | null>(null);
  // Helper to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handlePaymentSuccess = () => {
    // Refresh the page to update the invoice list
    window.location.reload();
  };

  if (!invoices.length) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No invoices found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Member</TableHead>
            <TableHead>Membership</TableHead>
            <TableHead>Issue Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">
                {invoice.invoiceNumber}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{invoice.user.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {invoice.user.email}
                  </span>
                </div>
              </TableCell>
              <TableCell>{invoice.membership.membershipPlan.name}</TableCell>
              <TableCell>
                {format(new Date(invoice.issueDate), "MMM d, yyyy")}
              </TableCell>
              <TableCell>
                {format(new Date(invoice.dueDate), "MMM d, yyyy")}
              </TableCell>
              <TableCell>{formatCurrency(invoice.total)}</TableCell>
              <TableCell>
                <Badge className={statusVariants[invoice.status]}>
                  {statusText[invoice.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <EllipsisVertical className="size-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/payments/invoices/${invoice.id}`}>
                        <Eye className="mr-2 size-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/payments/invoices/${invoice.id}/download`}>
                        <FileDown className="mr-2 size-4" />
                        Download PDF
                      </Link>
                    </DropdownMenuItem>

                    {invoice.status !== InvoiceStatus.PAID &&
                      invoice.status !== InvoiceStatus.CANCELLED &&
                      onMarkPaid && (
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedInvoice({
                              id: invoice.id,
                              invoiceNumber: invoice.invoiceNumber,
                              amount: invoice.total,
                            });
                            setPaymentModalOpen(true);
                          }}
                        >
                          <CreditCard className="mr-2 size-4" />
                          Process Payment
                        </DropdownMenuItem>
                      )}

                    {invoice.status === InvoiceStatus.ISSUED &&
                      new Date(invoice.dueDate) < new Date() &&
                      onMarkOverdue && (
                        <DropdownMenuItem
                          onClick={() => onMarkOverdue(invoice.id)}
                        >
                          Mark as Overdue
                        </DropdownMenuItem>
                      )}

                    {(invoice.status === InvoiceStatus.ISSUED ||
                      invoice.status === InvoiceStatus.DRAFT ||
                      invoice.status === InvoiceStatus.OVERDUE) &&
                      onCancel && (
                        <DropdownMenuItem onClick={() => onCancel(invoice.id)}>
                          Cancel Invoice
                        </DropdownMenuItem>
                      )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {selectedInvoice && (
        <PaymentProcessModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          invoiceId={selectedInvoice.id}
          invoiceNumber={selectedInvoice.invoiceNumber}
          amount={selectedInvoice.amount}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
