import { notFound } from "next/navigation";
import { getMemberById } from "../../actions";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MemberMembershipPage({ params }: PageProps) {
  const { id } = await params;
  const member = await getMemberById(id);

  if (!member) {
    return notFound();
  }

  if (!member.membership) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Membership Information</h2>
        <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
          <p>This member does not have an active membership.</p>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div>Member Membership Page</div>
    </div>
  );
}
