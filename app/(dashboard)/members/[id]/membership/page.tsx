import { notFound } from "next/navigation";
import { getMemberById } from "../../actions";
import { MembershipDetails } from "../../_components/membership-details";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MemberMembershipPage({ params }: PageProps) {
  const { id } = await params;
  const member = await getMemberById(id);

  console.log("member1",member)

  if (!member) {
    return notFound();
  }

  // Convert null to undefined to match the expected type
  return (
    <MembershipDetails
      member={{
        ...member,
        phone: member.phone || undefined,
        membership: member.membership || undefined,
        membershipId: member.membershipId || undefined,
        membershipStart: member.membershipStart || undefined,
        membershipEnd: member.membershipEnd || undefined,
        isActive: member.isActive ?? undefined,
        role: member.role || undefined
      }}
    />
  );
}