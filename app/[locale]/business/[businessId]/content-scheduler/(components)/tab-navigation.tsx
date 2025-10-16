"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface TabNavigationProps {
  activeTab: "manual" | "auto" | "history";
  onTabChange: (tab: "manual" | "auto" | "history") => void;
}


export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const t = useTranslations("contentScheduler");
  const tabs: { id: "manual" | "auto" | "history"; label: string }[] = [
    { id: "manual", label: t("postingManual") },
    { id: "auto", label: t("postingAutomatic") },
    { id: "history", label: t("history") },
  ];
  return (
    <div className="flex space-x-1 bg-card p-1 rounded-lg">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          variant={activeTab === tab.id ? "default" : "ghost"}
          size="sm"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex-1 p-4 sm:p-6 text-xs sm:text-sm",
            activeTab === tab.id
              ? "bg-primary text-white"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
}
