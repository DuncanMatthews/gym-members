import { Suspense } from "react";
import { Metadata } from "next";
import { getMembershipPlans } from "../../memberships/actions";
import { AddMemberForm } from "../_components/add-membership-form";

export const metadata: Metadata = {
  title: "Add New Member",
  description: "Add a new member to your gym",
};

export  default async function AddMemberPage() {
    const membershipPlans = await getMembershipPlans()
  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Add New Member</h1>
        <p className="text-muted-foreground">
          Create a new member account and assign a membership plan
        </p>
      </div>

      <Suspense>
      <AddMemberForm membershipPlans={membershipPlans || []} />
      </Suspense>
    </div>
  );
}
