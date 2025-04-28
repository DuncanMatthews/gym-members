"use client";

import * as React from "react";
import {
  Banknote,
  BookOpen,
  Command,
  LifeBuoy,
  Notebook,
  Send,
  SquareTerminal,
  User,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Members",
      url: "/#",
      isActive: true,
      icon: User,
      items: [
        {
          title: "View All Members",
          url: "/members",
        },
        {
          title: "Add Member",
          url: "/members/add",
        },
      ],
    },
    {
      title: "Membership Plans",
      url: "#",
      isActive: true,
      
      icon: BookOpen,
      items: [
        {
          title: "View All Membership Plans",
          url: "/membership-plans",
        },
        {
          title: "Create Membership Plans",
          url: "/membership-plans/add",
        },
      ],
    },
    {
      title: "Payments",
      url: "/#",
      icon: Banknote,
      isActive: true,
      
      items: [
        {
          title: "View All Payments",
          url: "/payments",
        },
       
       
      ],
    },
    {
      title: "Invoices",
      url: "/#",
      icon: Notebook,
      isActive: true,
      
      items: [
        {
          title: "View All Invoices",
          url: "/payments/invoices",
        },
       
       
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Acme Inc</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
