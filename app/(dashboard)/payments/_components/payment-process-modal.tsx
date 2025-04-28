// app/(dashboard)/payments/_components/payment-process-modal.tsx
"use client"

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { processInvoicePayment } from "../invoices/actions";

const paymentFormSchema = z.object({
  paymentMethod: z.string({
    required_error: "Please select a payment method",
  }),
  transactionId: z.string().optional(),
  cardLastFour: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentProcessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  onSuccess: () => void;
}

export function PaymentProcessModal({ 
  open, 
  onOpenChange, 
  invoiceId, 
  invoiceNumber, 
  amount,
  onSuccess 
}: PaymentProcessModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentMethod: "credit_card",
      transactionId: "",
      cardLastFour: "",
      notes: "",
    },
  });

  const selectedMethod = form.watch("paymentMethod");

  async function onSubmit(values: PaymentFormValues) {
    setIsSubmitting(true);
    try {
      // Generate a transaction ID if not provided (and if using digital payment)
      const transactionId = values.transactionId || 
        (["credit_card", "bank_transfer", "paypal"].includes(values.paymentMethod) 
          ? `txn_${Date.now()}` 
          : undefined);
      
      // Process the payment with the provided info
      const result = await processInvoicePayment(
        invoiceId,
        values.paymentMethod,
        transactionId
      );
      
      if (result.success) {
        onSuccess();
        onOpenChange(false);
      } else {
        console.error("Payment processing failed:", result.message);
        // You could set an error state here and show it in the form
      }
    } catch (error) {
      console.error("Error processing payment:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
          <DialogDescription>
            Record payment for invoice {invoiceNumber} (${amount.toFixed(2)})
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Show for digital payments */}
            {["credit_card", "bank_transfer", "paypal"].includes(selectedMethod) && (
              <FormField
                control={form.control}
                name="transactionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter transaction ID" {...field} />
                    </FormControl>
                    <FormDescription>
                      Leave blank to auto-generate
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Show for credit card */}
            {selectedMethod === "credit_card" && (
              <FormField
                control={form.control}
                name="cardLastFour"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last 4 digits</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="1234" 
                        maxLength={4} 
                        {...field} 
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Any additional information" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Process Payment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}