"use client";

import { useState } from "react";
import { SettingsTabNavigation } from "@/app/[locale]/business/[businessId]/settings/(components)/settings-tab-navigation";
import { MembersTable } from "@/app/[locale]/business/[businessId]/settings/(components)/members-table";
import { HistoryTransactions } from "@/app/[locale]/business/[businessId]/settings/(components)/history-transactions";

import { WelcomeSection } from "@/components/base/welcome-section";
import { useTranslations } from "next-intl";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("members");
  const w = useTranslations("welcomeSection");

  const renderTabContent = () => {
    switch (activeTab) {
      case "members":
        return <MembersTable />;
      case "history":
        return (
          <div className="max-w-[330px] sm:max-w-[700px] md:max-w-full overflow-hidden">
            <HistoryTransactions />
          </div>
        )
        
      default:
        return null;
    }
  };

  return (
    <main className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6 md:ml-0">
      {/* Banner Header */}

      <WelcomeSection
        title={w("settings")}
        message={w("manageSocialMedia")}
      />

      {/* Content Area */}
      <div className="flex-1 min-h-0">
        {/* Tab Navigation */}
        <div className="mb-4 sm:mb-6">
          <SettingsTabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Tab Content */}
        <div className="min-h-0">{renderTabContent()}</div>
      </div>
      {/* Member Management Modal */}
    </main>
  );
}
