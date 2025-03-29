import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { getMembershipPlans } from './actions';

export default async function MembershipsPage() {
  const memberships = await getMembershipPlans();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Memberships</h1>
        <Button asChild>
          <Link href="/dashboard/memberships/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Plan
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Membership Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Billing Cycle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberships.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>{plan.description}</TableCell>
                  <TableCell>${plan.price.toFixed(2)}</TableCell>
                  <TableCell className="capitalize">{plan.billingCycle}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        plan.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/memberships/${plan.id}`}>Edit</Link>
                      </Button>
                      <Button variant="destructive" size="sm">
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}