// app/(dashboard)/members/[id]/membership/new/page.tsx
import { redirect } from "next/navigation";
import { getMemberById } from "../../../actions";
import { getMembershipPlans } from "../../../../membership-plans/actions";
import { AddMembershipForm } from "../../../_components/add-membership-form";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AddMembershipPage({ params }: PageProps) {
  const { id } = await params;
  
  // Fetch the member data to display their information
  const member = await getMemberById(id);
  
  if (!member) {
    redirect("/members");
  }
  
  // Fetch all active membership plans to populate the dropdown
  const membershipPlans = await getMembershipPlans();

  console.log('membershipPlans',membershipPlans)
  

  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Assign Membership to {member.name}
        </h1>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-4">
          <AddMembershipForm 
            memberId={id}
            membershipPlans={membershipPlans}
          />
        </div>
      </div>
    </div>
  );
}