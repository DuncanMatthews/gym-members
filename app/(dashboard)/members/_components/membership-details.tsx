/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { format } from "date-fns";
import Link from "next/link";
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  CreditCardIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Membership, MembershipPlan, PricingTier } from "@prisma/client";
import { ChangePricingTierDialog } from "../../membership-plans/_components/change-price-tier";
import { cancelMembership } from "../[id]/actions";
import { useFormState } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { ChangeMembershipPlanDialog } from "../../membership-plans/_components/change-membership-plan";

// Define a type for our component props with expanded Membership type
interface MembershipDetailsProps {
  member: {
    id: string;
    name: string;
    email: string;
    role?: string;
    phone?: string;
    membershipId?: string;
    membershipStart?: Date;
    membershipEnd?: Date;
    isActive?: boolean;
    membership?: Membership & {
      membershipPlan?: MembershipPlan;
      pricingTier?: PricingTier;
    };
  };
}

// Helper functions for badge styling
function getStatusBadgeVariant(status: string | null | undefined) {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "PENDING":
      return "warning";
    case "PAUSED":
      return "outline";
    case "CANCELLED":
      return "destructive";
    case "EXPIRED":
      return "destructive";
    case "FROZEN":
      return "secondary";
    default:
      return "secondary";
  }
}

function getStatusLabel(status: string | null | undefined) {
  if (!status) return "No Membership";

  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDuration(duration: string | undefined) {
  if (!duration) return "";

  return duration
    .toLowerCase()
    .replace("_", " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function MembershipDetails({ member }: MembershipDetailsProps) {
  const { membership } = member;
  const [state, formAction, pending] = useActionState(cancelMembership, {});
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state.message) {
      toast[state.errors ? "error" : "success"](state.message);

      // Close dialog if the action was successful
      if (!state.errors) {
        setOpen(false);
      }
    }
  }, [state]);

  if (!membership) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Membership Information</h2>
        <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
          <p>This member does not have an active membership.</p>
          <Button className="mt-4" asChild>
            <Link href={`/members/${member.id}/membership/new`}>
              Assign Membership
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Membership Information</h2>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/members/${member.id}`}>Back to Member</Link>
          </Button>
          <Button asChild>
            <Link href={`/members/${member.id}/membership/edit`}>
              Edit Membership
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {membership.membershipPlan?.name || "Membership Details"}
              </CardTitle>
              <CardDescription>
                {membership.membershipPlan?.description ||
                  "Current membership plan and status"}
              </CardDescription>
            </div>
            <Badge variant={getStatusBadgeVariant(membership.status)}>
              {getStatusLabel(membership.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Plan Information
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">Plan Name</span>
                    <span>
                      {membership.membershipPlan?.name ||
                        membership.membershipPlanId}
                    </span>
                  </div>
                  <ChangeMembershipPlanDialog
                    userId={member.id}
                    membershipId={membership.id}
                    currentPlanId={membership.membershipPlanId}
                    currentPlanName={
                      membership.membershipPlan?.name || "Unknown Plan"
                    }
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Pricing Tier</span>
                  <div className="flex items-center gap-2">
                    <span>
                      {formatDuration(membership.pricingTier?.duration)} - $
                      {membership.pricingTier?.price || 0}/month
                    </span>
                    <ChangePricingTierDialog
                      memberId={member.id}
                      membershipId={membership.id}
                      membershipPlanId={membership.membershipPlanId}
                      currentTierId={membership.pricingTierId}
                    />
                  </div>
                </div>
                {membership.pricingTier?.totalPrice && (
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Total Price</span>
                    <span>${membership.pricingTier.totalPrice}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Membership Dates
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Start Date</span>
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(membership.startDate), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">End Date</span>
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(membership.endDate), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Billing Information
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Billing Start</span>
                  <div className="flex items-center">
                    <CreditCardIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(
                        new Date(membership.billingStartDate),
                        "MMM d, yyyy"
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Next Billing</span>
                  <div className="flex items-center">
                    <CreditCardIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(
                        new Date(membership.nextBillingDate),
                        "MMM d, yyyy"
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Settings
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Auto-Renewal</span>
                  <div className="flex items-center">
                    {membership.autoRenew ? (
                      <>
                        <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                        <span>Enabled</span>
                      </>
                    ) : (
                      <>
                        <XIcon className="mr-2 h-4 w-4 text-red-500" />
                        <span>Disabled</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {membership.customFields && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Additional Information
                </h3>
                <div className="bg-muted p-3 rounded-md">
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(membership.customFields, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href={`/members/${member.id}/payments`}>
              View Payment History
            </Link>
          </Button>

          {membership.status === "ACTIVE" && (
            <div className="flex gap-2">
              <Button variant="outline" color="amber">
                Pause Membership
              </Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">Cancel Membership</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel Membership</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to cancel this membership? This
                      action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>

                  <form action={formAction} className="space-y-4 py-2">
                    <input type="hidden" name="userId" value={member.id} />
                    <input
                      type="hidden"
                      name="membershipId"
                      value={membership.id}
                    />

                    <div className="space-y-2">
                      <Label htmlFor="effectiveDate">Effective Date</Label>
                      <Input
                        id="effectiveDate"
                        name="effectiveDate"
                        type="date"
                        defaultValue={format(new Date(), "yyyy-MM-dd")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cancellationReason">
                        Reason for Cancellation
                      </Label>
                      <Textarea
                        id="cancellationReason"
                        name="cancellationReason"
                        placeholder="Please provide a reason for cancellation"
                      />
                    </div>

                    {state.errors && (
                      <div className="bg-destructive/15 p-3 rounded-md text-destructive text-sm">
                        {Object.entries(state.errors).map(([key, errors]) => (
                          <p key={key}>
                            {key}: {errors.join(", ")}
                          </p>
                        ))}
                      </div>
                    )}

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" variant="destructive">
                        Confirm Cancellation
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
