import { EditMembershipPlanForm } from "../_components/edit-membership-plan";
import { getMembershipPlanById } from "../actions";
import { notFound } from "next/navigation";

interface MembershipPlansEditPageProps {
  params: Promise<{ id: string }>; // Explicitly typed as Promise
}

export default async function MembershipPlansEditPage({
    params,
  }: MembershipPlansEditPageProps) {
    const resolvedParams = await params;
    const result = await getMembershipPlanById(resolvedParams.id);
    console.log('result2',result)
  
    if (!result) {
      return notFound();
    }
  
    // Check if the result is an error object
    if ('message' in result && 'errors' in result) {
      throw new Error(result.message);
    }
  
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Edit Membership Plan</h1>
        <EditMembershipPlanForm initialValues={result} />
      </div>
    );
  }