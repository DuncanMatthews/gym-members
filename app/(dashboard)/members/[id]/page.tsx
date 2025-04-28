import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  ShieldIcon,
  CreditCardIcon,
  ClockIcon,
  AlertTriangleIcon,
  CakeIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getMemberById } from "../actions";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "../_components/members-page-header";
import { DeleteMemberButton } from "../_components/delete-member-buttion";
import { MemberAttendanceCard } from "../_components/member-attendance-card";
import {
  getNextDuePayment,
  getTotalOutstandingAmount,
  hasDuePayments,
} from "@/lib/utils";

interface MemberPageProps {
  params: Promise<{
    id: string;
  }>;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

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

export default async function MemberPage({ params }: MemberPageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  try {
    // Fetch member data
    const member = await getMemberById(id);
    

    console.log('memberpay',member)

    // If no member found, show 404
    if (!member) {
      notFound();
    }

    return (
      <div className="space-y-6">
        <PageHeader
          title="Member Details"
          description="View and manage member information."
        >
          <Link href="/members" passHref>
            <Button variant="outline">
              <ArrowLeftIcon className="size-4 mr-2" />
              Back to Members
            </Button>
          </Link>
          <Link href={`/members/${id}/edit`} passHref>
            <Button variant="outline">
              <PencilIcon className="size-4 mr-2" />
              Edit
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <TrashIcon className="size-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  members account and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <DeleteMemberButton id={id} />
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </PageHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Member profile card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-4">
                  <Avatar className="size-16">
                    <AvatarFallback className="text-xl">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">{member.name}</CardTitle>
                    <CardDescription>
                      Member since{" "}
                      {format(new Date(member.createdAt), "MMMM d, yyyy")}
                    </CardDescription>
                    {member.membership?.status && (
                      <Badge
                        variant={getStatusBadgeVariant(
                          member.membership.status
                        )}
                        className="mt-2"
                      >
                        {getStatusLabel(member.membership.status)}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground">
                      PERSONAL INFORMATION
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <UserIcon className="size-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Full Name
                          </p>
                        </div>
                      </div>

                      {member.idNumber && (
                        <div className="flex items-start space-x-3">
                          <ShieldIcon className="size-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">{member.idNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              ID Number
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start space-x-3">
                        <MailIcon className="size-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">{member.email}</p>
                          <p className="text-sm text-muted-foreground">Email</p>
                        </div>
                      </div>

                      {member.phone && (
                        <div className="flex items-start space-x-3">
                          <PhoneIcon className="size-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">{member.phone}</p>
                            <p className="text-sm text-muted-foreground">
                              Phone
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground">
                      ADDRESS
                    </h3>

                    <div className="space-y-3">
                      {member.addressLine1 || member.city || member.country ? (
                        <div className="flex items-start space-x-3">
                          <MapPinIcon className="size-5 text-muted-foreground mt-0.5" />
                          <div>
                            {member.addressLine1 && (
                              <p className="font-medium">
                                {member.addressLine1}
                              </p>
                            )}
                            {member.addressLine2 && (
                              <p className="font-medium">
                                {member.addressLine2}
                              </p>
                            )}
                            {(member.city ||
                              member.state ||
                              member.postalCode) && (
                              <p className="font-medium">
                                {[member.city, member.state, member.postalCode]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            )}
                            {member.country && (
                              <p className="font-medium">{member.country}</p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              Address
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start space-x-3">
                          <MapPinIcon className="size-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-muted-foreground">
                              No address provided
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start space-x-3">
                        <CalendarIcon className="size-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">
                            {format(new Date(member.createdAt), "MMMM d, yyyy")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Registration Date
                          </p>
                        </div>
                      </div>
                    {member.dateOfBirth && (
                      <div className="flex items-start space-x-3">
                        <CakeIcon className="size-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">
                            {format(new Date(member.dateOfBirth), "MMMM d, yyyy")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Date of Birth
                          </p>
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Member attendance history */}
            <Suspense
              fallback={
                <div className="h-[350px] bg-card rounded-md border border-border animate-pulse" />
              }
            >
              <MemberAttendanceCard memberId={id} />
            </Suspense>
          </div>

          <div className="space-y-6">
            {/* Membership details */}
            <Card>
              <CardHeader>
                <CardTitle>Membership</CardTitle>
                <CardDescription>
                  Current membership plan and status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {member.payments &&
                  member.invoices &&
                  hasDuePayments(member.payments, member.invoices) && (
                    <Card className="bg-amber-50 border-amber-200 mb-4">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-amber-100 rounded-full p-2">
                            <AlertTriangleIcon className="size-4 text-amber-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-amber-800">
                              Payment Due
                            </h3>
                            <p className="text-sm text-amber-700">
                              {getNextDuePayment(
                                member.payments,
                                member.invoices
                              ) ? (
                                <>
                                  $
                                  {getNextDuePayment(
                                    member.payments,
                                    member.invoices
                                  )?.amount.toFixed(2)}{" "}
                                  due by{" "}
                                  {format(
                                    new Date(
                                      getNextDuePayment(
                                        member.payments,
                                        member.invoices
                                      )?.dueDate as Date
                                    ),
                                    "MMM d, yyyy"
                                  )}
                                </>
                              ) : (
                                ""
                              )}
                            </p>
                            <p className="text-xs text-amber-600 mt-1">
                              Total outstanding: $
                              {getTotalOutstandingAmount(
                                member.payments,
                                member.invoices
                              ).toFixed(2)}
                            </p>
                            <div className="mt-3">
                              <Link href={`/members/${id}/payments`} passHref>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-amber-300 bg-amber-100 hover:bg-amber-200 text-amber-800"
                                >
                                  View Payment Details
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                {member.membership ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">
                          {member.membership?.membershipPlan?.name ||
                            member.membership?.membershipPlanId ||
                            "Standard Plan"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {member.membership?.membershipPlan?.description ||
                            "Regular gym access"}
                        </p>
                      </div>
                      <Badge
                        variant={getStatusBadgeVariant(
                          member.membership.status
                        )}
                      >
                        {getStatusLabel(member.membership.status)}
                      </Badge>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Plan Type</span>
                        <span className="font-medium">
                          {member.membership.pricingTier?.duration
                            ? member.membership.pricingTier.duration
                                .toLowerCase()
                                .replace("_", " ")
                                .split(" ")
                                .map(
                                  (word) =>
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                )
                                .join(" ")
                            : "N/A"}
                        </span>
                      </div>

                      {member.membership.pricingTier?.price && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Monthly Price
                          </span>
                          <span className="font-medium">
                            ${member.membership.pricingTier.price}
                          </span>
                        </div>
                      )}

                      {member.membership.pricingTier?.totalPrice && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Total Price
                          </span>
                          <span className="font-medium">
                            ${member.membership.pricingTier.totalPrice}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Start Date
                        </span>
                        <span className="font-medium">
                          {member.membership.startDate
                            ? format(
                                new Date(member.membership.startDate),
                                "MMM d, yyyy"
                              )
                            : "N/A"}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">End Date</span>
                        <span className="font-medium">
                          {member.membership.endDate
                            ? format(
                                new Date(member.membership.endDate),
                                "MMM d, yyyy"
                              )
                            : "Ongoing"}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Auto-Renewal
                        </span>
                        <span className="font-medium">
                          {member.membership.autoRenew ? "Enabled" : "Disabled"}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Next Billing
                        </span>
                        <span className="font-medium">
                          {member.membership.nextBillingDate
                            ? format(
                                new Date(member.membership.nextBillingDate),
                                "MMM d, yyyy"
                              )
                            : "N/A"}
                        </span>
                      </div>

                      
                    </div>

                    <div className="mt-4">
                      <Link href={`/members/${id}/membership`} passHref>
                        <Button className="w-full">Manage Membership</Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-4">
                    <div className="bg-muted rounded-full p-3 w-fit mx-auto">
                      <CreditCardIcon className="size-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium">No Active Membership</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        This member doesnt have an active membership plan yet.
                      </p>
                    </div>
                    <Link href={`/members/${id}/membership/new`} passHref>
                      <Button className="w-full">Assign Membership</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest member interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary/10 rounded-full p-1.5 mt-0.5">
                      <ClockIcon className="size-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Last check-in</p>
                      <p className="text-xs text-muted-foreground">
                        {member.lastLogin
                          ? format(
                              new Date(member.lastLogin),
                              "MMM d, yyyy - h:mm a"
                            )
                          : "No recent check-ins"}
                      </p>
                    </div>
                  </div>

                  {/* Additional activity items would go here */}

                  <div className="mt-2">
                    <Link href={`/members/${id}/activity`} passHref>
                      <Button variant="outline" size="sm" className="w-full">
                        View All Activity
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading member:", error);
    notFound();
  }
}
