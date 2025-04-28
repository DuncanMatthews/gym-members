// app/(dashboard)/payments/_components/payments-table.tsx
"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  CheckCircle2Icon,
  CircleAlertIcon,
  CircleDotIcon,
  RefreshCcwIcon,
  XCircleIcon,
} from "lucide-react";

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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useRouter } from "next/navigation";
import { getPayments } from "../actions";
import { Payment, PaymentStatus } from "@prisma/client";
import { PaymentProcessModal } from "./payment-process-modal";

export type PaymentWithRelations = Payment & {
  invoice?: { id: string; invoiceNumber: string };
  user: { id: string; name: string; email: string };
};

// Status badge components
const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => {
  switch (status) {
    case "PAID":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex gap-1 items-center">
          <CheckCircle2Icon className="size-3.5" />
          <span>Paid</span>
        </Badge>
      );
    case "PENDING":
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 flex gap-1 items-center">
          <CircleDotIcon className="size-3.5" />
          <span>Pending</span>
        </Badge>
      );
    case "FAILED":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 flex gap-1 items-center">
          <XCircleIcon className="size-3.5" />
          <span>Failed</span>
        </Badge>
      );
    case "REFUNDED":
    case "PARTIALLY_REFUNDED":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 flex gap-1 items-center">
          <RefreshCcwIcon className="size-3.5" />
          <span>Refunded</span>
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 flex gap-1 items-center">
          <CircleAlertIcon className="size-3.5" />
          <span>Cancelled</span>
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 flex gap-1 items-center">
          <CircleAlertIcon className="size-3.5" />
          <span>{status}</span>
        </Badge>
      );
  }
};

export function PaymentsTable({
  initialPayments,
  totalPages,
}: {
  initialPayments: PaymentWithRelations[];
  totalPages: number;
}) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [payments, setPayments] =
    useState<PaymentWithRelations[]>(initialPayments);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<{
    id: string;
    invoiceNumber: string;
    amount: number;
  } | null>(null);
  const fetchPayments = useCallback(async (pageNum: number) => {
    setIsLoading(true);
    try {
      const result = await getPayments({}, pageNum);
      setPayments(result.payments as PaymentWithRelations[]);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch payments", error);
      setIsLoading(false);
    }
  }, []);

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      fetchPayments(newPage);
    },
    [fetchPayments]
  );

  const handleProcessPayment = useCallback(
    (invoice: { id: string; invoiceNumber: string; amount: number }) => {
      setSelectedInvoice(invoice);
      setPaymentModalOpen(true);
    },
    []
  );

  const handlePaymentSuccess = useCallback(() => {
    // Refresh the payments list
    fetchPayments(page);
  }, [fetchPayments, page]);

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Member</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center py-8 text-muted-foreground"
              >
                No payments found
              </TableCell>
            </TableRow>
          ) : (
            payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">
                  {payment.invoice ? (
                    <Link
                      href={`/payments/invoices/${payment.invoice.id}`}
                      className="text-primary hover:underline"
                    >
                      {payment.invoice.invoiceNumber}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/members/${payment.userId}`}
                    className="hover:underline"
                  >
                    {payment.user.name}
                  </Link>
                </TableCell>
                <TableCell>${payment.amount.toFixed(2)}</TableCell>
                <TableCell>
                  {format(new Date(payment.dueDate), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge status={payment.status} />
                </TableCell>
                <TableCell>{payment.paymentMethod || "—"}</TableCell>
                <TableCell>
                  {payment.status === "PENDING" && payment.invoice ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() =>
                        handleProcessPayment({
                          id: payment.invoice!.id,
                          invoiceNumber: payment.invoice!.invoiceNumber,
                          amount: payment.amount,
                        })
                      }
                      disabled={isLoading}
                    >
                      Process
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8"
                      onClick={() => router.push(`/payments/${payment.id}`)}
                    >
                      View
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={() => handlePageChange(Math.max(page - 1, 1))}
                className={page <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <PaginationItem key={i}>
                  <PaginationLink
                    href="#"
                    isActive={pageNum === page}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={() => handlePageChange(Math.min(page + 1, totalPages))}
                className={
                  page >= totalPages ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
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
