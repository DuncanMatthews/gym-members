import { Suspense } from "react";
import { 
  SearchIcon,
  FilterIcon,
  DownloadIcon, 
  PlusIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { MembersTableSkeleton } from "./_components/member-table-skeleton";
import { MembersTable } from "./_components/members-table";
import { PageHeader } from "./_components/members-page-header";
import Link from "next/link";


export const metadata = {
  title: "Members | Gym Management",
  description: "Manage your gym's membership database",
};

export default async function MembersPage() {
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
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative w-full md:max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
              placeholder="Search members..." 
              className="pl-10"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Membership Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="flex gap-2">
              <FilterIcon className="size-4" />
              <span>Filters</span>
            </Button>
            
            <Button variant="outline" className="flex gap-2">
              <DownloadIcon className="size-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>

        <Suspense fallback={<MembersTableSkeleton />}>
          <MembersTable />
        </Suspense>
      </div>
    </div>
  );
}