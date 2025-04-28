"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Invoice, InvoiceStatus } from "@prisma/client";
import {
  FileDown,
  Printer,
  CreditCard,
  AlertTriangle,
  Ban,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  cancelInvoice,
  markInvoiceOverdue,
  sendInvoiceReminder,
} from "../invoices/actions";
import { PaymentProcessModal } from "./payment-process-modal";

type InvoiceActionsProps = {
  invoice: Invoice;
};

export function InvoiceActions({ invoice }: InvoiceActionsProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const handlePaymentSuccess = () => {
    router.refresh(); // If using app router
    // Or fetch the invoice again if you have a function for that
  };

  const handleMarkOverdue = async () => {
    try {
      setIsSubmitting(true);
      const result = await markInvoiceOverdue(invoice.id);

      if (result.success) {
        toast.success("Invoice marked as overdue");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to mark invoice as overdue");
      }
    } catch (error) {
        console.log(error)
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
      
    }
  };

  const handleCancel = async () => {
    if (!cancellationReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await cancelInvoice(invoice.id, cancellationReason);

      if (result.success) {
        toast.success("Invoice cancelled successfully");
        setCancelDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.message || "Failed to cancel invoice");
      }
    } catch (error) {
        console.log(error)
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReminder = async () => {
    try {
      setIsSubmitting(true);
      const result = await sendInvoiceReminder(invoice.id);

      if (result.success) {
        toast.success("Payment reminder sent");
      } else {
        toast.error(result.message || "Failed to send reminder");
      }
    } catch (error) {
        console.log(error)
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button className="w-full" variant="outline">
        <FileDown className="mr-2 size-4" />
        Download PDF
      </Button>

      <Button className="w-full" variant="outline">
        <Printer className="mr-2 size-4" />
        Print Invoice
      </Button>

      {invoice.status !== InvoiceStatus.PAID &&
        invoice.status !== InvoiceStatus.CANCELLED && (
          <Button
            className="w-full"
            variant="default"
            onClick={() => setPaymentModalOpen(true)}
            disabled={isSubmitting}
          >
            <CreditCard className="mr-2 size-4" />
            Process Payment
          </Button>
        )}

      {invoice.status === InvoiceStatus.ISSUED &&
        new Date(invoice.dueDate) < new Date() && (
          <Button
            className="w-full"
            variant="outline"
            onClick={handleMarkOverdue}
            disabled={isSubmitting}
          >
            <AlertTriangle className="mr-2 size-4" />
            Mark as Overdue
          </Button>
        )}

      {(invoice.status === InvoiceStatus.ISSUED ||
        invoice.status === InvoiceStatus.DRAFT ||
        invoice.status === InvoiceStatus.OVERDUE) && (
        <Button
          className="w-full"
          variant="outline"
          onClick={() => setCancelDialogOpen(true)}
          disabled={isSubmitting}
        >
          <Ban className="mr-2 size-4" />
          Cancel Invoice
        </Button>
      )}

      {(invoice.status === InvoiceStatus.ISSUED ||
        invoice.status === InvoiceStatus.OVERDUE) && (
        <Button
          className="w-full"
          variant="outline"
          onClick={handleSendReminder}
          disabled={isSubmitting}
        >
          <Send className="mr-2 size-4" />
          Send Reminder
        </Button>
      )}

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Invoice</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this invoice. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            placeholder="Reason for cancellation..."
            className="min-h-[100px]"
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isSubmitting || !cancellationReason.trim()}
            >
              {isSubmitting ? "Processing..." : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {invoice && (
        <PaymentProcessModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          invoiceId={invoice.id}
          invoiceNumber={invoice.invoiceNumber}
          amount={invoice.total}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
