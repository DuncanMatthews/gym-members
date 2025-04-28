import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "../../_components/members-page-header";
import { EditMemberFormSkeleton } from "../../_components/edit-member-form-skeleton";
import { EditMemberForm } from "../../_components/edit-member-form";
import { getMemberById } from "../../actions";


interface EditMemberPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditMemberPage({ params }: EditMemberPageProps) {
  const resolvedParams = (await params).id
  const id = resolvedParams
  
  try {
    // Try to fetch member data
    const member = await getMemberById(id);
    
    // If no member found, show 404
    if (!member) {
      notFound();
    }
    
    return (
      <div className="space-y-6">
        <PageHeader
          title="Edit Member"
          description="Update member information and preferences."
        >
          <Link href={`/members/${id}`} passHref>
            <Button variant="outline">
              <ArrowLeftIcon className="size-4 mr-2" />
              Back to Member
            </Button>
          </Link>
        </PageHeader>
        
        <div className="bg-card rounded-lg border border-border p-6">
          <Suspense fallback={<EditMemberFormSkeleton />}>
            <EditMemberForm member={member} />
          </Suspense>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading member:", error);
    notFound();
  }
}