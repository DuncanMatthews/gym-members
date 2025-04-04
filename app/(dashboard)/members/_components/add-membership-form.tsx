// app/(dashboard)/members/_components/add-membership-form.tsx
"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { MembershipPlan } from "@prisma/client";
import { Switch } from "@/components/ui/switch";
import { assignMembershipToUser } from "../[id]/actions";

// Form schema for the membership assignment
const formSchema = z.object({
  membershipPlanId: z.string({
    required_error: "Please select a membership plan",
  }),
  pricingTierId: z.string({
    required_error: "Please select a pricing tier",
  }),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  billingStartDate: z.date({
    required_error: "Billing start date is required",
  }),
  autoRenew: z.boolean().default(true),
  status: z
    .enum(["ACTIVE", "PENDING"], {
      required_error: "Status is required",
    })
    .default("ACTIVE"),
  customFields: z.any().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

interface MembershipPlanData
  extends Omit<MembershipPlan, "createdAt" | "updatedAt"> {
  pricingTiers: Array<{
    id: string;
    duration: string;
    price: string;
    totalPrice: string;
    discountPercent: string | null;
  }>;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface AddMembershipFormProps {
  memberId: string;
  membershipPlans: MembershipPlanData[];
}

export function AddMembershipForm({
  memberId,
  membershipPlans,
}: AddMembershipFormProps) {
  const router = useRouter();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: new Date(),
      billingStartDate: new Date(),
      autoRenew: true,
      status: "ACTIVE",
    },
  });

  const onSubmit = async (data: FormSchema) => {
    try {
      // Create a FormData object to submit
      const formData = new FormData();

      // Add the userId and all form fields
      formData.append("userId", memberId);
      formData.append("membershipPlanId", data.membershipPlanId);
      formData.append("pricingTierId", data.pricingTierId);
      formData.append("startDate", data.startDate.toISOString());
      formData.append("billingStartDate", data.billingStartDate.toISOString());
      formData.append("autoRenew", data.autoRenew.toString());
      formData.append("status", data.status);

      if (data.customFields) {
        formData.append("customFields", JSON.stringify(data.customFields));
      }

      const result = await assignMembershipToUser({}, formData);

      if (result.message && !result.errors) {
        toast.success(result.message);
        router.push(`/members/${memberId}`);
        router.refresh();
      } else {
        // Handle validation errors
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            form.setError(field as keyof FormSchema, {
              type: "manual",
              message: messages?.[0] as string | undefined,
            });
          });
        }
        toast.error(result.message || "Failed to assign membership");
      }
    } catch (error) {
      console.error("Error assigning membership:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="membershipPlanId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Membership Plan</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a membership plan" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {membershipPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the membership plan to assign to this member
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />


<FormField
  control={form.control}
  name="pricingTierId"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Pricing Tier</FormLabel>
      <Select
        onValueChange={field.onChange}
        defaultValue={field.value}
        disabled={!form.watch("membershipPlanId")}
      >
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select a pricing tier" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {form.watch("membershipPlanId") && 
            membershipPlans.find(plan => plan.id === form.watch("membershipPlanId"))?.pricingTiers?.length > 0 ? (
              membershipPlans
                .find(plan => plan.id === form.watch("membershipPlanId"))
                ?.pricingTiers.map((tier) => (
                  <SelectItem key={tier.id} value={tier.id}>
                    {tier.duration === "MONTHLY"
                      ? "Monthly"
                      : tier.duration === "THREE_MONTH"
                      ? "3 Months"
                      : tier.duration === "SIX_MONTH"
                      ? "6 Months"
                      : tier.duration === "ANNUAL"
                      ? "Annual"
                      : tier.duration}
                    {" - $"}
                    {tier.price}/month
                    {" ($"}
                    {tier.totalPrice} total)
                  </SelectItem>
                ))
            ) : (
              <SelectItem value="no-tiers" disabled>No pricing tiers available</SelectItem>
            )
          }
        </SelectContent>
      </Select>
      <FormDescription>
        Select the pricing tier for this membership
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="w-full pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>When the membership begins</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="billingStartDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Billing Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="w-full pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When to start billing (can be different from start date)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="autoRenew"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Auto-Renewal</FormLabel>
                  <FormDescription>
                    Automatically renew this membership when it expires
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Set to Pending if payment is not yet confirmed
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full md:w-auto">
          Assign Membership
        </Button>
      </form>
    </Form>
  );
}
