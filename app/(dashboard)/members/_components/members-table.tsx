"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  MoreHorizontalIcon, 
  ArrowUpDownIcon
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { listMembers } from "../actions";
import { MembersTableSkeleton } from "./member-table-skeleton";

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
  
  return status.toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export function MembersTable() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMembers() {
      try {
        const data = await listMembers();
        setMembers(data);
      } catch (err) {
        console.error("Error fetching members:", err);
        setError("Failed to load members. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchMembers();
  }, []);

  if (loading) {
    return <div className="text-center py-4"><MembersTableSkeleton /></div>;
  }

  if (error) {
    return <div className="text-destructive text-center py-4">{error}</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">
              <Button variant="ghost" className="p-0 hover:bg-transparent">
                <span>Member</span>
                <ArrowUpDownIcon className="ml-2 size-4" />
              </Button>
            </TableHead>
            <TableHead>ID Number</TableHead>
            <TableHead>Membership Status</TableHead>
            <TableHead>Join Date</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No members found. Add your first member to get started.
              </TableCell>
            </TableRow>
          ) : (
            members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Link 
                        href={`/members/${member.id}`}
                        className="font-medium hover:underline"
                      >
                        {member.name}
                      </Link>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{member.idNumber || "—"}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(member.membership?.status)}>
                    {getStatusLabel(member.membership?.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {member.createdAt ? format(new Date(member.createdAt), 'MMM d, yyyy') : 'N/A'}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-sm">
                    <span>{member.email}</span>
                    {member.phone && <span className="text-muted-foreground">{member.phone}</span>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontalIcon className="size-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/members/${member.id}`}>View details</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/members/${member.id}/edit`}>Edit member</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/members/${member.id}/membership`}>Manage membership</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/members/${member.id}/attendance`}>View attendance</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}