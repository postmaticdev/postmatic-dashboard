"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

interface TabNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}


export function SettingsTabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const t = useTranslations("settings");
  const tabs = [
    { id: "members", label: t("members") },
    { id: "history", label: t("historyTransactions") }
  ]
  return (
    <div className="flex space-x-1 bg-muted p-1 rounded-lg">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          variant={activeTab === tab.id ? "default" : "ghost"}
          size="sm"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex-1 p-6",
            activeTab === tab.id 
              ? "bg-primary text-white" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="truncate">{tab.label}</span>
        </Button>
      ))}
    </div>
  )
}
