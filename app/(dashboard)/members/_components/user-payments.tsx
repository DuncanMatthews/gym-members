// app/(dashboard)/members/_components/user-payments.tsx
"use client";

import { useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import {
  CheckCircle2Icon,
  CircleAlertIcon,
  CircleDotIcon,
  CreditCardIcon,
  XCircleIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { PaymentStatus } from "@prisma/client";
import { PaymentWithRelations } from "../../payments/actions";
import { PaymentProcessModal } from "../../payments/_components/payment-process-modal";

// Define types based on the data structure we received
interface UserPaymentsProps {
  userPayments: {
    payments: PaymentWithRelations[];
    total: number;
    pages: number;
  };
}

// Payment status badge components
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

export function UserPayments({ userPayments }: UserPaymentsProps) {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [page, setPage] = useState(1);
  const [payments] = useState<PaymentWithRelations[]>(userPayments.payments);
  const [totalPages] = useState(userPayments.pages);
  //   const [isLoading, setIsLoading] = useState(false);

  const refetchPayments = () => {
    console.log("yes");
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // In a real implementation, fetch data for newPage
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Payment History</CardTitle>
        <CardDescription>
          View all payment transactions for this member
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No payments found for this member
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
                      ${payment.amount.toFixed(2)} {payment.currency}
                    </TableCell>
                    <TableCell>
                      {format(new Date(payment.dueDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span>
                          {format(new Date(payment.periodStart), "MMM d, yyyy")}
                        </span>
                        <span className="text-muted-foreground">
                          to {format(new Date(payment.dueDate), "MMM d, yyyy")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={payment.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          asChild
                        >
                          <Link href={`/payments/${payment.id}`}>
                            View Details
                          </Link>
                        </Button>
                        {payment.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8"
                              onClick={() => setIsProcessingPayment(true)}
                            >
                              Process
                            </Button>

                            <PaymentProcessModal
                              open={isProcessingPayment}
                              onOpenChange={setIsProcessingPayment}
                              invoiceId={payment.invoice?.id || ""}
                              invoiceNumber={
                                payment.invoice?.invoiceNumber || ""
                              }
                              amount={payment.amount}
                              onSuccess={() => {
                                // Refresh payments data after successful processing
                                refetchPayments();
                              }}
                            />
                          </>
                        )}
                      </div>
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
                    className={
                      page <= 1 ? "pointer-events-none opacity-50" : ""
                    }
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
                    onClick={() =>
                      handlePageChange(Math.min(page + 1, totalPages))
                    }
                    className={
                      page >= totalPages ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}

          {/* Payment Summary */}
          <div className="mt-6 bg-muted rounded-md p-4">
            <div className="flex items-center mb-2">
              <CreditCardIcon className="h-5 w-5 mr-2 text-muted-foreground" />
              <h3 className="font-medium">Payment Summary</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-background rounded p-3">
                <div className="text-muted-foreground mb-1">Total Paid</div>
                <div className="text-xl font-semibold">
                  $
                  {payments
                    .filter((p) => p.status === "PAID")
                    .reduce((sum, p) => sum + p.amount, 0)
                    .toFixed(2)}
                </div>
              </div>
              <div className="bg-background rounded p-3">
                <div className="text-muted-foreground mb-1">Pending</div>
                <div className="text-xl font-semibold">
                  $
                  {payments
                    .filter((p) => p.status === "PENDING")
                    .reduce((sum, p) => sum + p.amount, 0)
                    .toFixed(2)}
                </div>
              </div>
              <div className="bg-background rounded p-3">
                <div className="text-muted-foreground mb-1">Latest Payment</div>
                <div className="text-xl font-semibold">
                  {payments.find((p) => p.status === "PAID" && p.paidDate)
                    ? format(
                        new Date(
                          payments.find(
                            (p) => p.status === "PAID" && p.paidDate
                          )!.paidDate!
                        ),
                        "MMM d, yyyy"
                      )
                    : "No payments"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
