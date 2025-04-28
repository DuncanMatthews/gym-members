import { Suspense } from "react";
import { SearchIcon, DownloadIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MembersTableSkeleton } from "./_components/member-table-skeleton";
import { MembersTable } from "./_components/members-table";
import { PageHeader } from "./_components/members-page-header";
import { StatusTabs } from "./_components/status-tabs";
import Link from "next/link";
import { MemberStats } from "./_components/member-stats";
import { getMemberStatusCounts } from "./actions";

export const metadata = {
  title: "Members | Gym Management",
  description: "Manage your gym's membership database",
};

// Define the props with searchParams
interface MembersPageProps {
  searchParams?: Promise<{
    search?: string;
    status?: string;
  }>;
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  // Extract search parameters
  const params = await searchParams || {};
  const search = params.search || "";
  const status = params.status || "ALL";

  // Get status counts
  const counts = await getMemberStatusCounts();

  // Status tabs configuration
  const statusTabs = [
    { value: "ALL", label: "All Members", count: counts.ALL },
    { value: "ACTIVE", label: "Active", count: counts.ACTIVE },
    { value: "PENDING", label: "Pending", count: counts.PENDING },
    { value: "PAUSED", label: "Paused", count: counts.PAUSED },
    { value: "FROZEN", label: "Frozen", count: counts.FROZEN },
    { value: "CANCELLED", label: "Cancelled", count: counts.CANCELLED },
    { value: "EXPIRED", label: "Expired", count: counts.EXPIRED },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        description="Manage membership information, track attendance, and handle payments."
      >
        <Link href="/members/add" passHref>
          <Button>
            <PlusIcon className="size-4 mr-2" />
            Add Member
          </Button>
        </Link>
      </PageHeader>

      <div className="bg-card rounded-lg border border-border p-6 space-y-6">
        <MemberStats />

        {/* Status Tabs */}
        <StatusTabs tabs={statusTabs} currentStatus={status} />

        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex flex-1 items-center gap-2">
            <form className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                type="search"
                name="search"
                placeholder="Search by ID number..."
                className="pl-8"
                defaultValue={search}
              />
              {/* Preserve the current status when searching */}
              {status !== "ALL" && (
                <input type="hidden" name="status" value={status} />
              )}
              <Button type="submit" className="sr-only">
                Search
              </Button>
            </form>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <DownloadIcon className="size-4" />
              <span className="sr-only">Download</span>
            </Button>
          </div>
        </div>

        {/* Wrap the filtered table component with Suspense */}
        <Suspense key={`${status}-${search}`} fallback={<MembersTableSkeleton />}>
          <MembersTableFilter search={search} status={status} />
        </Suspense>
      </div>
    </div>
  );
}

// Create a separate component to handle the data fetching with its own Suspense boundary
async function MembersTableFilter({ search, status }: { search: string; status: string }) {
  // Fetch members with server-side filtering
  const { filterMembers } = await import("./actions");
  const members = await filterMembers({
    search,
    status,
  });
  
  return <MembersTable members={members} />;
}