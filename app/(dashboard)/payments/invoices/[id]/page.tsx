import { notFound } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Invoice, Payment, User, Membership } from "@prisma/client";

import { getInvoiceById } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { InvoiceActions } from "../../_components/invoice-actiions";

// Status badge variants
const statusVariants = {
  DRAFT: "bg-gray-100 text-gray-800",
  ISSUED: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  PARTIALLY_PAID: "bg-yellow-100 text-yellow-800",
  OVERDUE: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-500",
};

// Format currency helper
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

type InvoiceWithRelations = Invoice & {
  user: User;
  membership: Membership & {
    membershipPlan: {
      name: string;
    };
  };
  payments: Payment[];
};

export default async function InvoiceDetailPage({
    params,
  }: {
    params: Promise<{ id: string }>;
  }) {
    const { id } = await params;

  try {
    // Fetch invoice data
    const invoice = (await getInvoiceById(
      id
    )) as unknown as InvoiceWithRelations;

    // If no invoice found, show 404
    if (!invoice) {
      notFound();
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Invoice {invoice.invoiceNumber}
            </h1>
            <p className="text-muted-foreground">
              Issued on {format(new Date(invoice.issueDate), "MMMM d, yyyy")}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/payments/invoices" passHref>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 size-4" />
                Back to Invoices
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main invoice details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Invoice Details</CardTitle>
                    <CardDescription>
                      Invoice #{invoice.invoiceNumber}
                    </CardDescription>
                  </div>
                  <Badge className={statusVariants[invoice.status]}>
                    {invoice.status}
                  </Badge>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Invoice billing details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                        BILLED TO
                      </h3>
                      <div className="space-y-1">
                        <p className="font-medium">{invoice.user.name}</p>
                        <p>{invoice.user.email}</p>
                        {invoice.user.phone && <p>{invoice.user.phone}</p>}
                        {invoice.user.addressLine1 && (
                          <>
                            <p>{invoice.user.addressLine1}</p>
                            {invoice.user.addressLine2 && (
                              <p>{invoice.user.addressLine2}</p>
                            )}
                            <p>
                              {invoice.user.city}, {invoice.user.state}{" "}
                              {invoice.user.postalCode}
                            </p>
                            {invoice.user.country && (
                              <p>{invoice.user.country}</p>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                        INVOICE DETAILS
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Invoice Number:
                          </span>
                          <span>{invoice.invoiceNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Issue Date:
                          </span>
                          <span>
                            {format(
                              new Date(invoice.issueDate),
                              "MMMM d, yyyy"
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Due Date:
                          </span>
                          <span>
                            {format(new Date(invoice.dueDate), "MMMM d, yyyy")}
                          </span>
                        </div>
                        {invoice.paidDate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Payment Date:
                            </span>
                            <span>
                              {format(
                                new Date(invoice.paidDate),
                                "MMMM d, yyyy"
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Invoice items */}
                  <div className="mt-6">
                    <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                      INVOICE ITEMS
                    </h3>
                    <div className="border rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-border">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                          <tr>
                            <td className="px-4 py-3 text-sm">
                              <div>
                                <p className="font-medium">
                                  {invoice.membership.membershipPlan.name}{" "}
                                  Membership
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  {invoice.notes}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {formatCurrency(invoice.subtotal)}
                            </td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr className="bg-muted/50">
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Subtotal
                            </th>
                            <th className="px-4 py-3 text-right text-sm">
                              {formatCurrency(invoice.subtotal)}
                            </th>
                          </tr>
                          {invoice.tax > 0 && (
                            <tr className="bg-muted/50">
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Tax
                              </th>
                              <th className="px-4 py-3 text-right text-sm">
                                {formatCurrency(invoice.tax)}
                              </th>
                            </tr>
                          )}
                          {invoice.discount > 0 && (
                            <tr className="bg-muted/50">
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Discount
                              </th>
                              <th className="px-4 py-3 text-right text-sm">
                                -{formatCurrency(invoice.discount)}
                              </th>
                            </tr>
                          )}
                          <tr className="bg-muted/50">
                            <th className="px-4 py-3 text-left text-sm font-semibold">
                              Total
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-semibold">
                              {formatCurrency(invoice.total)}
                            </th>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Payment history */}
                  {invoice.payments && invoice.payments.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                        PAYMENT HISTORY
                      </h3>
                      <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-border">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Method
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border bg-card">
                            {invoice.payments.map((payment) => (
                              <tr key={payment.id}>
                                <td className="px-4 py-3 text-sm">
                                  {payment.paidDate
                                    ? format(
                                        new Date(payment.paidDate),
                                        "MMM d, yyyy"
                                      )
                                    : format(
                                        new Date(payment.dueDate),
                                        "MMM d, yyyy"
                                      ) + " (Due)"}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {payment.paymentMethod || "N/A"}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <Badge
                                    variant={
                                      payment.status === "PAID"
                                        ? "success"
                                        : payment.status === "PENDING"
                                        ? "outline"
                                        : "secondary"
                                    }
                                  >
                                    {payment.status}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-sm text-right">
                                  {formatCurrency(payment.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions card */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>Manage this invoice</CardDescription>
              </CardHeader>
              <CardContent>
                <InvoiceActions invoice={invoice} />
              </CardContent>
            </Card>

            {/* Member info */}
            <Card>
              <CardHeader>
                <CardTitle>Member</CardTitle>
                <CardDescription>Member details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">{invoice.user.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {invoice.user.email}
                    </p>
                    {invoice.user.phone && (
                      <p className="text-sm text-muted-foreground">
                        {invoice.user.phone}
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Link href={`/members/${invoice.user.id}`} passHref>
                      <Button variant="outline" className="w-full">
                        View Member Profile
                      </Button>
                    </Link>

                    <Link
                      href={`/payments/invoices?userId=${invoice.user.id}`}
                      passHref
                    >
                      <Button variant="ghost" className="w-full">
                        View All Invoices
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching invoice:", error);
    notFound();
  }
}
