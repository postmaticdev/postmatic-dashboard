"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { LogoLoader } from "@/components/base/logo-loader";
import { useAutoGenerate } from "@/contexts/auto-generate-context";
import { useParams } from "next/navigation";
import { useContentAutoGenerateGetSettings } from "@/services/content/content.api";
import { usePlatformKnowledgeGetAll } from "@/services/knowledge.api";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AutoGenerateModal } from "./auto-generate-modal";
import { Clock, Plus, Edit, Trash2 } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlatformEnum } from "@/models/api/knowledge/platform.type";
import { AutoGenerateSchedule } from "@/models/api/content/auto-generate";
import { showToast } from "@/helper/show-toast";
import { mapEnumPlatform } from "@/helper/map-enum-platform";
import { cn } from "@/lib/utils";

interface AutoGenerateProps {
  handleIfNoPlatformConnected: () => void;
}

export function AutoGenerate({
  handleIfNoPlatformConnected,
}: AutoGenerateProps) {
  const {
    enabled: globalEnabled,
    setGlobalEnabled,
    getSchedulesByDay,
    deleteScheduleDirectly,
  } = useAutoGenerate();

  const { businessId } = useParams() as { businessId: string };
  const { isLoading } = useContentAutoGenerateGetSettings(businessId);
  const t = useTranslations("autoGenerate");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImages] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformEnum[]>(
    []
  );
  const [editingSchedule, setEditingSchedule] =
    useState<AutoGenerateSchedule | null>(null);
  const [dayInputs, setDayInputs] = useState<{
    [key: number]: { time: string; platforms: PlatformEnum[] };
  }>({});

  const { data: platformData } = usePlatformKnowledgeGetAll(businessId);
  const lenConnectedPlatform =
    platformData?.data.data.filter(
      (platform) => platform.status === "connected"
    ).length || 0;

  const DAYS = [
    { value: 0, label: t("sunday") },
    { value: 1, label: t("monday") },
    { value: 2, label: t("tuesday") },
    { value: 3, label: t("wednesday") },
    { value: 4, label: t("thursday") },
    { value: 5, label: t("friday") },
    { value: 6, label: t("saturday") },
  ];

  const handleDayTimeChange = (day: number, time: string) => {
    setDayInputs((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        time,
      },
    }));
  };

  const handleDayPlatformChange = (day: number, platforms: PlatformEnum[]) => {
    setDayInputs((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        platforms,
      },
    }));
  };

  const handleAddScheduleToDay = async (day: number) => {
    const dayInput = dayInputs[day];
    if (!dayInput?.time || dayInput.platforms.length === 0) {
      showToast("error", t("pleaseSelectTimeAndPlatform"));
      return;
    }

    setSelectedDay(day);
    setSelectedTime(dayInput.time);
    setSelectedPlatforms(dayInput.platforms);
    setEditingSchedule(null);
    setIsModalOpen(true);
  };

  const handleEditSchedule = (schedule: AutoGenerateSchedule) => {
    setSelectedDay(schedule.day);
    setSelectedTime(schedule.time);
    setSelectedPlatforms(schedule.platforms);
    setEditingSchedule(schedule);
    setIsModalOpen(true);
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (window.confirm(t("confirmDeleteSchedule"))) {
      try {
        await deleteScheduleDirectly(scheduleId);
      } catch {
        showToast("error", t("scheduleDeleteFailed"));
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedDay(null);
    setSelectedTime("");
    setSelectedPlatforms([]);
    setEditingSchedule(null);
  };

  const handleModalSave = () => {
    setIsModalOpen(false);
    setSelectedDay(null);
    setSelectedTime("");
    setSelectedPlatforms([]);
    setEditingSchedule(null);
  };

  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="py-6 flex items-center justify-center">
          <LogoLoader />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-full">
        <CardContent className="py-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{t("autoGenerate")}</h2>
              <div className="flex flex-row gap-2 items-center">
                <Switch
                  checked={globalEnabled}
                  onCheckedChange={(v) => {
                    if (lenConnectedPlatform === 0) {
                      handleIfNoPlatformConnected();
                      return;
                    }
                    setGlobalEnabled(v);
                  }}
                  onClick={() => {
                    if (lenConnectedPlatform === 0) {
                      handleIfNoPlatformConnected();
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {globalEnabled ? (
                  <p>{t("autoGenerateEnabled")}</p>
                ) : (
                  <p>{t("autoGenerateDisabled")}</p>
                )}
              </div>

              {/* 7 Day Cards - Only show when enabled */}
              {globalEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4  gap-4">
                  {DAYS.map((day) => {
                    const daySchedules = getSchedulesByDay(day.value);
                    return (
                      <Card key={day.value} className="p-4 bg-background-secondary">
                        <div className="space-y-3">
                          <h3 className="font-semibold text-center">
                            {day.label}
                          </h3>

                          {/* Existing Schedules */}
                          <div className="space-y-2">
                            {daySchedules.map((schedule) => (
                              <div
                                key={schedule.id}
                                className="flex items-center justify-between p-2 bg-card rounded-lg cursor-pointer hover:bg-primary/20"
                                onClick={() => handleEditSchedule(schedule)}
                              >
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span className="text-sm font-medium">
                                    {schedule.time}
                                  </span>
                                  {schedule.platforms.map((platform) => (
                                    <span
                                      className="text-xs font-medium"
                                      key={platform}
                                    >
                                      {mapEnumPlatform.getPlatformIcon(
                                        platform
                                      )}
                                    </span>
                                  ))}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditSchedule(schedule);
                                    }}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSchedule(schedule.id);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Time and Platform Input */}
                          <div className="space-y-3">
                            {/* Time Input */}
                            <div>
                              <label className="block text-xs font-medium mb-1 text-muted-foreground">
                                {t("selectTime")}
                              </label>
                              <input
                                type="time"
                                placeholder="02"
                                value={dayInputs[day.value]?.time || ""}
                                onChange={(e) =>
                                  handleDayTimeChange(day.value, e.target.value)
                                }
                                className="w-full p-2 text-sm border rounded-md bg-card"
                              />
                            </div>

                            {/* Platform Selection */}
                            <div>
                              <label className="block text-xs font-medium mb-1 text-muted-foreground">
                                {t("selectPlatforms")}
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {platformData?.data.data
                                  .filter(
                                    (platform) =>
                                      platform.status === "connected"
                                  )
                                  .map((platform, index) => {
                                    const p = platform.platform as PlatformEnum;
                                    const selected = dayInputs[day.value]?.platforms?.includes(p) || false;
                                    return (
                                      <Button
                                        key={index}
                                        variant="outline"
                                        onClick={() => {
                                          const currentPlatforms =
                                            dayInputs[day.value]?.platforms ||
                                            [];
                                          const newPlatforms = selected
                                            ? currentPlatforms.filter(
                                                (platform) => platform !== p
                                              )
                                            : [...currentPlatforms, p];
                                          handleDayPlatformChange(
                                            day.value,
                                            newPlatforms
                                          );
                                        }}
                                        className={cn(
                                          "flex-shrink-0",
                                          selected
                                            ? "bg-blue-600 hover:bg-blue-700"
                                            : "hover:bg-muted"
                                        )}
                                      >
                                        <div className="bg-background-secondary p-1 rounded-md">
                                          {mapEnumPlatform.getPlatformIcon(p)}
                                        </div>
                                        <span
                                          className={cn(
                                            "text-xs font-medium",
                                            selected ? "text-white" : "text-muted-foreground"
                                          )}
                                        >
                                          {mapEnumPlatform.getPlatformLabel(p)}
                                        </span>
                                      </Button>
                                    );
                                  })}
                              </div>
                            </div>

                            {/* Add Button */}
                            <Button
                              variant="default"
                              size="sm"
                              className="w-full"
                              onClick={() => handleAddScheduleToDay(day.value)}
                              disabled={
                                !dayInputs[day.value]?.time ||
                                dayInputs[day.value]?.platforms?.length === 0
                              }
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              {t("addSchedule")}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AutoGenerateModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        selectedDay={selectedDay}
        selectedTime={selectedTime}
        selectedPlatforms={selectedPlatforms}
        editingSchedule={editingSchedule}
      />

      {/* Image Preview Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("generatedImages")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {selectedImages.map((image, index) => (
              <div key={index} className="space-y-2">
                <Image
                  src={image}
                  alt={`Generated ${index + 1}`}
                  width={400}
                  height={400}
                  className="w-full h-auto rounded-lg border"
                />
                <p className="text-sm text-muted-foreground text-center">
                  {t("generatedImage")} {index + 1}
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
