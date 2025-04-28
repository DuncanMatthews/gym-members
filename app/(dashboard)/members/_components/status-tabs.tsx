"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCallback, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

interface StatusTab {
  value: string;
  label: string;
  count?: number;
}

interface StatusTabsProps {
  tabs: StatusTab[];
  currentStatus?: string;
}

export function StatusTabs({ tabs, currentStatus = "ALL" }: StatusTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const searchValue = params.get("search");
      
      params.forEach((_, key) => {
        params.delete(key);
      });
      
      if (searchValue) {
        params.set("search", searchValue);
      }
      
      if (value !== "ALL") {
        params.set(name, value);
      }
      
      return params.toString();
    },
    [searchParams]
  );
  
  const handleTabChange = (value: string) => {
    startTransition(() => {
      const queryString = createQueryString("status", value);
      const url = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(url);
    });
  };
  
  const getTabVariant = (tabValue: string) => {
    switch(tabValue) {
      case "ACTIVE": return "success";
      case "PENDING": return "warning";
      case "PAUSED": 
      case "FROZEN": return "info";
      case "CANCELLED":
      case "EXPIRED": return "destructive";
      default: return "default";
    }
  };
  
  return (
    <div className="mb-6">
      <Tabs value={currentStatus} onValueChange={handleTabChange} className="w-full">
        <TabsList className="h-auto bg-background p-1 border rounded-md overflow-x-auto flex w-full justify-start gap-1">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              disabled={isPending}
              className={cn(
                "relative py-2 px-3 data-[state=active]:shadow-none",
                "transition-all duration-200 ease-in-out",
                isPending && "opacity-70 cursor-not-allowed"
              )}
            >
              <span className="flex items-center gap-2">
                {tab.value !== "ALL" && (
                  <span className={cn(
                    "size-2 rounded-full",
                    `bg-${getTabVariant(tab.value)}`
                  )} />
                )}
                {tab.label}
                {tab.count !== undefined && (
                  <Badge 
                    variant={tab.value === currentStatus ? getTabVariant(tab.value) : "outline"}
                    className={cn(
                      "ml-1 transition-colors",
                    )}
                  >
                    {tab.count}
                  </Badge>
                )}
              </span>
              {tab.value === currentStatus && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  layoutId="activeTab"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}