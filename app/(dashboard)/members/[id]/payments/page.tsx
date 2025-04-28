// app/(dashboard)/members/[id]/payments/page.tsx
import { getPayments } from "../../../payments/actions";
import { UserPayments } from "../../_components/user-payments";

type MemberPaymentProps = Promise<{
  id: string;
}>;

export default async function MemberPaymentsPage({
  params,
}: {
  params: Promise<MemberPaymentProps>;
}) {
  const resolvedParams = await params;
  const userPayments = await getPayments({ userId: resolvedParams.id });
  
  return (
    <div>
      <UserPayments userPayments={userPayments} />
    </div>
  );
}