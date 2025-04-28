"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown } from "lucide-react";
import { MembershipDuration } from "@prisma/client";

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
import { cn } from "@/lib/utils";
import { updateMembershipPricingTier, getMembershipPlanDetails } from "../actions";

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

interface PricingTierOption {
  id: string;
  duration: MembershipDuration;
  price: string;
  totalPrice: string;
}

interface ChangePricingTierDialogProps {
  memberId: string;
  membershipId: string;
  membershipPlanId: string;
  currentTierId: string;
}

export function ChangePricingTierDialog({
  membershipId,
  membershipPlanId,
  currentTierId,
}: ChangePricingTierDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [pricingTiers, setPricingTiers] = useState<PricingTierOption[]>([]);
  const [selectedTierId, setSelectedTierId] = useState(currentTierId);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && membershipPlanId) {
      const fetchPricingTiers = async () => {
        setIsLoading(true);
        try {
          const planDetails = await getMembershipPlanDetails(membershipPlanId);
          if (planDetails?.pricingTiers) {
            setPricingTiers(planDetails.pricingTiers);
          }
        } catch (error) {
          console.error("Failed to fetch pricing tiers:", error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchPricingTiers();
    }
  }, [open, membershipPlanId]);

  const handleSubmit = async () => {
    if (selectedTierId === currentTierId) {
      setOpen(false);
      return;
    }

    try {
      setIsSubmitting(true);
      await updateMembershipPricingTier(membershipId, selectedTierId);
      router.refresh();
      setOpen(false);
    } catch (error) {
      console.error("Failed to update pricing tier:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTier = pricingTiers.find(tier => tier.id === selectedTierId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Change Pricing Tier
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Pricing Tier</DialogTitle>
          <DialogDescription>
            Select a new pricing tier for this membership. This will adjust billing amount and terms.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <span className="ml-2">Loading pricing tiers...</span>
            </div>
          ) : pricingTiers.length === 0 ? (
            <div className="text-center py-2 text-muted-foreground">
              No other pricing tiers available for this plan
            </div>
          ) : (
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={popoverOpen}
                  className="w-full justify-between"
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
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Search pricing tier..." />
                  <CommandEmpty>No pricing tier found.</CommandEmpty>
                  <CommandGroup>
                    {pricingTiers.map((tier) => (
                      <CommandItem
                        key={tier.id}
                        value={tier.id}
                        onSelect={() => {
                          setSelectedTierId(tier.id);
                          setPopoverOpen(false);
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
            disabled={isSubmitting || isLoading || selectedTierId === currentTierId}
          >
            {isSubmitting ? "Updating..." : "Change Pricing Tier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}