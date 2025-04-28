// app/(dashboard)/payments/page.tsx
import { Suspense } from "react";
import { 
  SearchIcon,
  FilterIcon,
  DownloadIcon
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
import { PaymentsTable } from "./_components/payments-table";
import { getPayments } from "./actions";
import { PaymentsTableSkeleton } from "./_components/payments-table-skeleton";

export const metadata = {
  title: "Payments | Gym Management",
  description: "Manage your gym's payment records and invoices",
};

async function PaymentsTableWithData() {
    const { payments, pages } = await getPayments();
    
    return <PaymentsTable 
      initialPayments={payments} 
      totalPages={pages} 
    />;
  }

export default async function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">
          View and manage payment records, process payments, and generate reports.
        </p>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative w-full md:max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
              placeholder="Search payments..." 
              className="pl-10"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
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

        <Suspense fallback={<PaymentsTableSkeleton />}>
          <PaymentsTableWithData />
        </Suspense>
      </div>
    </div>
  );
}