"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooterWithButton,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { DEFAULT_PLACEHOLDER_IMAGE } from "@/constants";
import { useDateFormat } from "@/hooks/use-date-format";
import { dateFormat } from "@/helper/date-format";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useContentAutoGenerateGetHistories } from "@/services/content/content.api";
import { LogoLoader } from "@/components/base/logo-loader";
import { mapEnumPlatform } from "@/helper/map-enum-platform";
import { PlatformEnum } from "@/models/api/knowledge/platform.type";

interface AutoGenerateHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AutoGenerateHistoryModal({
  isOpen,
  onClose,
}: AutoGenerateHistoryModalProps) {
  const m = useTranslations("modal");
  const { formatDate } = useDateFormat();
  const { businessId } = useParams() as { businessId: string };
  const [query] = useState({
    sortBy: "createdAt",
    limit: 50,
    page: 1,
    sort: "desc" as const,
  });

  const { data: historiesData, isLoading } = useContentAutoGenerateGetHistories(
    businessId,
    query
  );

  const histories = historiesData?.data?.data || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="">
        {/* Header */}
        <DialogHeader>
          <div>
            <DialogTitle>{m("autoGenerateHistoryTitle")}</DialogTitle>
            <DialogDescription>
              {m("autoGenerateHistoryDescription")}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LogoLoader />
            </div>
          ) : histories.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">{m("noHistoryFound")}</p>
            </div>
          ) : (
            histories.map((history) => (
              <div
                key={history.id}
                className="border rounded-lg bg-background-secondary"
              >
                <div className="flex p-4 flex-col sm:flex-row sm:items-start gap-3">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image
                      src={
                        history.generatedImageContent?.images[0] ||
                        history.productKnowledge?.images[0] ||
                        DEFAULT_PLACEHOLDER_IMAGE
                      }
                      alt={history.productKnowledge?.name || ""}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-2">
                      <h4 className="font-semibold">
                        {history.productKnowledge?.name || "Unknown Product"}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            history.status === "success" ? "default" : "secondary"
                          }
                          className={cn(
                            history.status === "success"
                              ? "bg-green-500 hover:bg-green-600"
                              : history.status === "failed"
                              ? "bg-red-500 hover:bg-red-600"
                              : "bg-yellow-500 hover:bg-yellow-600"
                          )}
                        >
                          {history.status}
                        </Badge>
                        {history.generatedImageContent?.ratio && (
                          <Badge variant="outline">
                            {history.generatedImageContent.ratio}
                          </Badge>
                        )}
                        {history.generatedImageContent?.designStyle && (
                          <Badge variant="outline">
                            {history.generatedImageContent.designStyle}
                          </Badge>
                        )}
                        {history.generatedImageContent?.category && (
                          <Badge variant="outline">
                            {history.generatedImageContent.category}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(new Date(history.createdAt))}{" "}
                          {dateFormat.getHhMm(new Date(history.createdAt))}
                        </span>
                      </div>
                      {history.generatedImageContent?.caption && (
                        <div className="mt-2">
                          <span className="text-sm break-words">
                            {history.generatedImageContent.caption}
                          </span>
                        </div>
                      )}
                      {history.generatedImageContent?.postedImageContents &&
                        history.generatedImageContent.postedImageContents.length >
                          0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="text-xs text-muted-foreground">
                              {m("postedTo")}:
                            </span>
                            {history.generatedImageContent.postedImageContents.map(
                              (posted) => (
                                <span key={posted.id} className="text-xs">
                                  {mapEnumPlatform.getPlatformIcon(
                                    posted.platform as PlatformEnum
                                  )}
                                </span>
                              )
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooterWithButton buttonMessage={m("close")} onClick={onClose} />
      </DialogContent>
    </Dialog>
  );
}

