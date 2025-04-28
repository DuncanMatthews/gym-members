// app/(dashboard)/members/_components/change-membership-plan.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MembershipDuration } from "@prisma/client";
import { cn } from "@/lib/utils";
import { changeMembershipPlan, getMembershipPlans } from "../../membership-plans/actions";

// Helper to format duration labels
function formatDuration(duration: MembershipDuration): string {
  switch (duration) {
    case "MONTHLY": return "Monthly";
    case "THREE_MONTH": return "3 Months";
    case "SIX_MONTH": return "6 Months";
    case "ANNUAL": return "Annual";
    default: return duration;
  }
}

interface MembershipPlanOption {
  id: string;
  name: string;
  description?: string | null;
  pricingTiers: Array<{
    id: string;
    duration: MembershipDuration;
    price: string;
    totalPrice: string;
  }>;
}

interface ChangeMembershipPlanDialogProps {
  userId: string;
  membershipId: string;
  currentPlanId: string;
  currentPlanName: string;
}

export function ChangeMembershipPlanDialog({
  userId,
  membershipId,
  currentPlanId,
  currentPlanName,
}: ChangeMembershipPlanDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [planPopoverOpen, setPlanPopoverOpen] = useState(false);
  const [tierPopoverOpen, setTierPopoverOpen] = useState(false);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlanOption[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [selectedTierId, setSelectedTierId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const fetchMembershipPlans = async () => {
        setIsLoading(true);
        try {
          const plans = await getMembershipPlans();
          setMembershipPlans(plans);
        } catch (error) {
          console.error("Failed to fetch membership plans:", error);
          setErrorMessage("Failed to load membership plans");
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchMembershipPlans();
    } else {
      // Reset selections when dialog is closed
      setSelectedPlanId("");
      setSelectedTierId("");
      setErrorMessage(null);
    }
  }, [open]);

  // Reset tier selection when plan changes
  useEffect(() => {
    setSelectedTierId("");
  }, [selectedPlanId]);

  const selectedPlan = membershipPlans.find(plan => plan.id === selectedPlanId);
  const selectedTier = selectedPlan?.pricingTiers.find(tier => tier.id === selectedTierId);

  const handleSubmit = async () => {
    if (!selectedPlanId || !selectedTierId) {
      setErrorMessage("Please select both a membership plan and a pricing tier");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      
      const result = await changeMembershipPlan(
        userId,
        membershipId,
        selectedPlanId,
        selectedTierId
      );

      if (result.success) {
        router.refresh();
        setOpen(false);
      } else {
        setErrorMessage(result.error || "Failed to change membership plan");
      }
    } catch (error) {
      console.error("Failed to change membership plan:", error);
      setErrorMessage("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Change Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Change Membership Plan</DialogTitle>
          <DialogDescription>
            Select a new membership plan and pricing tier. Current plan: {currentPlanName}
          </DialogDescription>
        </DialogHeader>
        
        {errorMessage && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
            {errorMessage}
          </div>
        )}
        
        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <span className="ml-2">Loading membership plans...</span>
            </div>
          ) : (
            <>
              {/* Membership Plan Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Membership Plan</label>
                <Popover open={planPopoverOpen} onOpenChange={setPlanPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={planPopoverOpen}
                      className="w-full justify-between"
                    >
                      {selectedPlan ? selectedPlan.name : "Select membership plan"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Search membership plans..." />
                      <CommandEmpty>No membership plan found.</CommandEmpty>
                      <CommandGroup>
                        {membershipPlans
                          .filter(plan => plan.id !== currentPlanId)
                          .map((plan) => (
                            <CommandItem
                              key={plan.id}
                              value={plan.id}
                              onSelect={() => {
                                setSelectedPlanId(plan.id);
                                setPlanPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedPlanId === plan.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {plan.name}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Pricing Tier Selection - only show if a plan is selected */}
              {selectedPlan && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pricing Tier</label>
                  <Popover open={tierPopoverOpen} onOpenChange={setTierPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={tierPopoverOpen}
                        className="w-full justify-between"
                        disabled={!selectedPlan}
                      >
                        {selectedTier ? (
                          <>
                            {formatDuration(selectedTier.duration)} - ${selectedTier.price}/month
                            (${selectedTier.totalPrice} total)
                          </>
                        ) : (
                          "Select pricing tier"
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Search pricing tiers..." />
                        <CommandEmpty>No pricing tier found.</CommandEmpty>
                        <CommandGroup>
                          {selectedPlan.pricingTiers.map((tier) => (
                            <CommandItem
                              key={tier.id}
                              value={tier.id}
                              onSelect={() => {
                                setSelectedTierId(tier.id);
                                setTierPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedTierId === tier.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {formatDuration(tier.duration)} - ${tier.price}/month
                              (${tier.totalPrice} total)
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || isLoading || !selectedPlanId || !selectedTierId}
          >
            {isSubmitting ? "Changing..." : "Change Plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}