"use client";

import { useState } from "react";

import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  cancelInvoice,
  markInvoiceOverdue,
  processInvoicePayment,
} from "../invoices/actions";
import { InvoicesList } from "./invoices-list";
import { Invoice, InvoiceStatus } from "@prisma/client";

type InvoiceActionsProps = {
  invoices: Invoice[];
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

export function InvoiceListActions({ invoices }: InvoiceActionsProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMarkPaid = async (id: string) => {
    try {
      setIsSubmitting(true);
      const result = await processInvoicePayment(id, "manual");

      if (result.success) {
        toast.success("Invoice marked as paid");
      } else {
        toast.error(result.message || "Failed to mark invoice as paid");
      }
    } catch (error) {
      toast.error("An error occurred");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkOverdue = async (id: string) => {
    try {
      setIsSubmitting(true);
      const result = await markInvoiceOverdue(id);

      if (result.success) {
        toast.success("Invoice marked as overdue");
      } else {
        toast.error(result.message || "Failed to mark invoice as overdue");
      }
    } catch (error) {
      toast.error("An error occurred");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCancelDialog = (id: string) => {
    setSelectedInvoiceId(id);
    setCancellationReason("");
    setCancelDialogOpen(true);
  };

  const handleCancel = async () => {
    if (!cancellationReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await cancelInvoice(selectedInvoiceId, cancellationReason);

      if (result.success) {
        toast.success("Invoice cancelled successfully");
        setCancelDialogOpen(false);
      } else {
        toast.error(result.message || "Failed to cancel invoice");
      }
    } catch (error) {
      toast.error("An error occurred");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <InvoicesList
        invoices={invoices as unknown as InvoiceWithRelations[]}
        onMarkPaid={handleMarkPaid}
        onMarkOverdue={handleMarkOverdue}
        onCancel={openCancelDialog}
      />

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
    </>
  );
}
