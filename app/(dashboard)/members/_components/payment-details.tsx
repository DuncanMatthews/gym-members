// app/(dashboard)/payments/_components/payment-details.tsx
"use client";

import { format } from "date-fns";
import {
  CheckCircle2Icon,
  CircleAlertIcon,
  CircleDotIcon,
  CreditCardIcon,
  RefreshCcwIcon,
  XCircleIcon,
  UserIcon,
  CalendarIcon,
  ReceiptIcon,
  ArrowLeftIcon,
} from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PaymentWithRelations } from "@/app/(dashboard)/payments/actions";

// Payment status badge components
const PaymentStatusBadge = ({ status }: { status: string }) => {
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

interface PaymentDetailsProps {
  payment: PaymentWithRelations | null;
}

export function PaymentDetails({ payment }: PaymentDetailsProps) {
  if (!payment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>Payment not found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-8">
            <p>The requested payment could not be found.</p>
          </div>
          <Button variant="outline" asChild className="mt-4">
            <Link href="/payments">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Payments
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>
            Payment #{payment.id.substring(0, 8).toUpperCase()}
          </CardDescription>
        </div>
        <PaymentStatusBadge status={payment.status} />
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted rounded-md p-4">
              <div className="flex items-center text-muted-foreground text-sm mb-1">
                <CreditCardIcon className="h-4 w-4 mr-2" />
                <span>Amount</span>
              </div>
              <div className="text-2xl font-semibold">
                ${payment.amount.toFixed(2)} {payment.currency}
              </div>
            </div>
            
            <div className="bg-muted rounded-md p-4">
              <div className="flex items-center text-muted-foreground text-sm mb-1">
                <CalendarIcon className="h-4 w-4 mr-2" />
                <span>Due Date</span>
              </div>
              <div className="text-2xl font-semibold">
                {format(new Date(payment.dueDate), "MMM d, yyyy")}
              </div>
            </div>
            
            <div className="bg-muted rounded-md p-4">
              <div className="flex items-center text-muted-foreground text-sm mb-1">
                <UserIcon className="h-4 w-4 mr-2" />
                <span>Member</span>
              </div>
              <div className="text-2xl font-semibold">
                <Link href={`/members/${payment.userId}`} className="hover:underline">
                  {payment.user.name}
                </Link>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Payment Details */}
          <div>
            <h3 className="text-lg font-medium mb-4">Payment Information</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium mt-1">{payment.status}</dd>
              </div>
              
              <div>
                <dt className="text-muted-foreground">Payment Method</dt>
                <dd className="font-medium mt-1">{payment.paymentMethod || "Not specified"}</dd>
              </div>
              
              <div>
                <dt className="text-muted-foreground">Transaction ID</dt>
                <dd className="font-medium mt-1">{payment.transactionId || "N/A"}</dd>
              </div>
              
              <div>
                <dt className="text-muted-foreground">Paid Date</dt>
                <dd className="font-medium mt-1">
                  {payment.paidDate ? format(new Date(payment.paidDate), "MMM d, yyyy") : "Not paid yet"}
                </dd>
              </div>
              
              <div>
                <dt className="text-muted-foreground">Period Start</dt>
                <dd className="font-medium mt-1">{format(new Date(payment.periodStart), "MMM d, yyyy")}</dd>
              </div>
              
              <div>
                <dt className="text-muted-foreground">Period End</dt>
                <dd className="font-medium mt-1">{format(new Date(payment.periodEnd), "MMM d, yyyy")}</dd>
              </div>
              
              <div>
                <dt className="text-muted-foreground">Created At</dt>
                <dd className="font-medium mt-1">{format(new Date(payment.createdAt), "MMM d, yyyy")}</dd>
              </div>
              
              <div>
                <dt className="text-muted-foreground">Last Updated</dt>
                <dd className="font-medium mt-1">{format(new Date(payment.updatedAt), "MMM d, yyyy")}</dd>
              </div>
            </dl>
          </div>
          
          {/* Membership and Invoice Information */}
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Membership Details</h3>
              <dl className="grid gap-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Membership Plan</dt>
                  <dd className="font-medium mt-1">{payment.membership.membershipPlan.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Membership ID</dt>
                  <dd className="font-medium mt-1">
                    <Link href={`/memberships/${payment.membershipId}`} className="hover:underline">
                      {payment.membershipId}
                    </Link>
                  </dd>
                </div>
              </dl>
            </div>
            
            {payment.invoice && (
              <div>
                <h3 className="text-lg font-medium mb-4">Invoice Information</h3>
                <dl className="grid gap-y-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Invoice Number</dt>
                    <dd className="font-medium mt-1">{payment.invoice.invoiceNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Invoice</dt>
                    <dd className="font-medium mt-1">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/payments/invoices/${payment.invoice.id}`}>
                          <ReceiptIcon className="h-4 w-4 mr-2" />
                          View Invoice
                        </Link>
                      </Button>
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 flex justify-between">
          <Button variant="outline" asChild>
            <Link href={`/members/${payment.userId}/payments`}>
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Member Payments
            </Link>
          </Button>
          
          {payment.status === "PENDING" && (
            <Button>
              Process Payment
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}