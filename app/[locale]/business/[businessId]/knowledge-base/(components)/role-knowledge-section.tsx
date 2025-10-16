"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Users, MessageCircle, User, Hash, Target } from "lucide-react";
import { EditKnowledgeModal } from "./edit-knowledge-modal";
import { useRoleKnowledgeGetById } from "@/services/knowledge.api";
import { useParams } from "next/navigation";
import { useRole } from "@/contexts/role-context";
import { useTranslations } from "next-intl";

export function RoleKnowledgeSection() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const { businessId } = useParams() as { businessId: string };
  const { data: roleKnowledgeData } = useRoleKnowledgeGetById(businessId);
  const { access } = useRole();
  const { roleKnowledge } = access;
  
  const r = useTranslations("roleKnowledge");
  const roleTags = [
    {
      icon: Users,
      label: r("targetAudience"),
      value: roleKnowledgeData?.data?.data?.targetAudience || r("notAvailable"),
      color: "bg-yellow-400/50 text-white",
    },
    {
      icon: MessageCircle,
      label: r("contentTone"),
      value: roleKnowledgeData?.data?.data?.tone || r("notAvailable"),
      color: "bg-blue-400/50 text-white",
    },
    {
      icon: User,
      label: r("persona"),
      value: roleKnowledgeData?.data?.data?.audiencePersona || r("notAvailable"),
      color: "bg-pink-400/50 text-white",
    },
    {
      icon: Hash,
      label: r("hashtags"),
      value:
        roleKnowledgeData?.data?.data?.hashtags
          ?.map((hashtag) => `${hashtag}`)
          .join(", ") || r("notAvailable"),
      color: "bg-purple-400/50 text-white",
    },
    {
      icon: Users,
      label: r("callToAction"),
      value: roleKnowledgeData?.data?.data?.callToAction || r("notAvailable"),
      color: "bg-green-400/50 text-white",
    },
    {
      icon: Target,
      label: r("goals"),
      value: roleKnowledgeData?.data?.data?.goals || r("notAvailable"),
      color: "bg-sky-400/50 text-white",
    },
  ];
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className=" pb-6">
          <div className="flex items-center justify-between my-3">
            <h2 className="text-xl font-semibold text-foreground">
              {r("title")}
            </h2>
            {roleKnowledge.write && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleEditClick}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {roleTags.map((tag, index) => {
              const Icon = tag.icon;
              return (
                <div
                  key={index}
                  className="flex items-center justify-start gap-4 p-3 rounded-md border text-sm font-medium shadow-sm"
                >
                  <div
                    className={`p-2 rounded-sm items-center justify-center ${tag.color}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-normal">{tag.label}</span>
                    <span className="text-md truncate">{tag.value}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <EditKnowledgeModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialTab="role"
      />
    </div>
  );
}
