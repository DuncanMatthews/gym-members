"use server";

import { prisma } from "@/lib/prisma";
import { 
  UsersIcon, 
  CheckCircleIcon, 
  AlertCircleIcon, 
  ClockIcon 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MemberStatItemProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  trendDirection?: "up" | "down" | "neutral";
}

function MemberStatItem({ title, value, icon, trend, trendDirection }: MemberStatItemProps) {
  const getTrendColor = () => {
    if (!trendDirection) return "text-muted-foreground";
    return {
      up: "text-success",
      down: "text-destructive",
      neutral: "text-muted-foreground"
    }[trendDirection];
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h4 className="text-3xl font-bold">{value}</h4>
            {trend && (
              <p className={`text-xs mt-1.5 ${getTrendColor()}`}>
                {trend.value > 0 ? "+" : ""}{trend.value}% {trend.label}
              </p>
            )}
          </div>
          <div className="bg-primary/10 p-2.5 rounded-full">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

async function getMemberStats() {
  // Total members count
  const totalMembers = await prisma.user.count({
    where: { role: "MEMBER" }
  });

  // Active members count
  const activeMembers = await prisma.user.count({
    where: { 
      role: "MEMBER",
      membership: {
        status: "ACTIVE"
      }
    }
  });

  // Members with expiring memberships in the next 30 days
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  const expiringMembers = await prisma.user.count({
    where: {
      role: "MEMBER",
      membership: {
        status: "ACTIVE",
        endDate: {
          lte: thirtyDaysFromNow,
          gte: new Date()
        }
      }
    }
  });

  // Members with overdue payments
  const overdueMembers = await prisma.user.count({
    where: {
      role: "MEMBER",
      OR: [
        {
          payments: {
            some: {
              status: "PENDING",
              dueDate: {
                lt: new Date()
              }
            }
          }
        },
        {
          invoices: {
            some: {
              status: "OVERDUE"
            }
          }
        }
      ]
    }
  });

  // Calculate active member percentage
  const activePercentage = totalMembers > 0 
    ? Math.round((activeMembers / totalMembers) * 100) 
    : 0;

  return {
    totalMembers,
    activeMembers,
    expiringMembers,
    overdueMembers,
    activePercentage
  };
}

export async function MemberStats() {
  const stats = await getMemberStats();
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MemberStatItem 
        title="Total Members" 
        value={stats.totalMembers} 
        icon={<UsersIcon className="size-5 text-primary" />}
      />
      
      <MemberStatItem 
        title="Active Members" 
        value={stats.activeMembers} 
        icon={<CheckCircleIcon className="size-5 text-primary" />}
        trend={{
          value: stats.activePercentage,
          label: "of total members"
        }}
        trendDirection="neutral"
      />
      
      <MemberStatItem 
        title="Expiring Soon" 
        value={stats.expiringMembers} 
        icon={<ClockIcon className="size-5 text-primary" />}
        trend={{
          value: stats.expiringMembers,
          label: "in next 30 days"
        }}
        trendDirection={stats.expiringMembers > 0 ? "down" : "neutral"}
      />
      
      <MemberStatItem 
        title="Payment Overdue" 
        value={stats.overdueMembers} 
        icon={<AlertCircleIcon className="size-5 text-primary" />}
        trend={{
          value: stats.overdueMembers,
          label: "need attention"
        }}
        trendDirection={stats.overdueMembers > 0 ? "down" : "neutral"}
      />
    </div>
  );
}