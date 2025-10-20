"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooterWithButton,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { PlatformEnum } from "@/models/api/knowledge/platform.type";
import { useTranslations } from "next-intl";
import { AutoGenerateReferencePanel } from "./auto-generate-reference-panel";
import { CreateAutoGenerateScheduleRequest, AutoGenerateSchedule } from "@/models/api/content/auto-generate";
import { showToast } from "@/helper/show-toast";
import { useAutoGenerate } from "@/contexts/auto-generate-context";
import type { ValidRatio } from "@/models/api/content/image.type";
import { useContentAutoGenerateCreateSchedule, useContentAutoGenerateUpdateSchedule } from "@/services/content/content.api";
import { useParams } from "next/navigation";
import { AutoGenerateFormBasic } from "./auto-generate-form-basic";
import { AutoGenerateFormAdvanced } from "./auto-generate-form-advance";
import { AutoSelectedReferenceImage } from "./auto-selected-reference-image";
import { TextField } from "@/components/forms/text-field";

interface AutoGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  selectedDay: number | null;
  selectedTime: string;
  selectedPlatforms: PlatformEnum[];
  editingSchedule: AutoGenerateSchedule | null;
}

export function AutoGenerateModal({
  isOpen,
  onClose,
  onSave,
  selectedDay,
  selectedTime,
  selectedPlatforms,
  editingSchedule,
}: AutoGenerateModalProps) {
  const t = useTranslations("autoGenerate");
  const mCreateSchedule = useContentAutoGenerateCreateSchedule();
  const mUpdateSchedule = useContentAutoGenerateUpdateSchedule();
  const { businessId } = useParams() as { businessId: string };

  // Form state
  const [isActive, setIsActive] = useState<boolean>(true);
  const [additionalPrompt, setAdditionalPrompt] = useState<string>("");
  const prevBasicRef = useRef<typeof basic | null>(null);
  const prevAdvanceRef = useRef<typeof advance | null>(null);

  // Auto Generate Context
  const { form, isLoading, productKnowledges, aiModels, onSelectAiModel } = useAutoGenerate();
  const { basic, setBasic, advance, setAdvance } = form;

  // Helper function to get product name from productKnowledgeId
  const getProductNameById = (productKnowledgeId: string) => {
    const product = productKnowledges.contents.find(p => p.id === productKnowledgeId);
    return product?.name || "";
  };

  const DAYS = [
    { value: 0, label: t("sunday") },
    { value: 1, label: t("monday") },
    { value: 2, label: t("tuesday") },
    { value: 3, label: t("wednesday") },
    { value: 4, label: t("thursday") },
    { value: 5, label: t("friday") },
    { value: 6, label: t("saturday") },
  ];

  const getDayName = (dayValue: number | null) => {
    if (dayValue === null) return "";
    return DAYS.find(day => day.value === dayValue)?.label || "";
  };


  const handleSave = async () => {
    if (!basic?.productKnowledgeId) {
      showToast("error", t("pleaseSelectProduct"));
      return;
    }

    if (selectedPlatforms.length === 0) {
      showToast("error", t("pleaseSelectPlatform"));
      return;
    }

    if (selectedDay === null) {
      showToast("error", t("pleaseSelectDay"));
      return;
    }

    if (!selectedTime) {
      showToast("error", t("pleaseSelectTime"));
      return;
    }

    const scheduleData: CreateAutoGenerateScheduleRequest = {
      day: selectedDay,
      time: selectedTime,
      platforms: selectedPlatforms,
      model: basic.model || "gpt-image-1",
      designStyle: basic.designStyle || "modern",
      ratio: basic.ratio || "1:1",
      referenceImages: basic.referenceImage ? [basic.referenceImage] : [],
      category: basic.category || "sale",
      additionalPrompt: additionalPrompt.trim() || undefined,
      productKnowledgeId: basic.productKnowledgeId,
      isActive: isActive,
      advBusinessName: form.advance.businessKnowledge.name,
      advBusinessCategory: form.advance.businessKnowledge.category,
      advBusinessDescription: form.advance.businessKnowledge.description,
      advBusinessLocation: form.advance.businessKnowledge.location,
      advBusinessLogo: form.advance.businessKnowledge.logo,
      advBusinessUniqueSellingPoint:
        form.advance.businessKnowledge.uniqueSellingPoint,
      advBusinessWebsite: form.advance.businessKnowledge.website,
      advBusinessVisionMission: form.advance.businessKnowledge.visionMission,
      advBusinessColorTone: form.advance.businessKnowledge.colorTone,
      advProductName: form.advance.productKnowledge.name,
      advProductCategory: form.advance.productKnowledge.category,
      advProductDescription: form.advance.productKnowledge.description,
      advProductPrice: form.advance.productKnowledge.price,
      advRoleHashtags: form.advance.roleKnowledge.hashtags,
    };

    try {
      if (editingSchedule) {
        await mUpdateSchedule.mutateAsync({
          businessId,
          scheduleId: editingSchedule.id,
          formData: scheduleData,
        });
        showToast("success", t("scheduleUpdatedSuccessfully"));
      } else {
        await mCreateSchedule.mutateAsync({
          businessId,
          formData: scheduleData,
        });
        showToast("success", t("scheduleSavedSuccessfully"));
      }
      onSave();
    } catch {
      showToast("error", t("scheduleSaveFailed"));
    }
  };

  // Snapshot form when opening, restore when closing to avoid leaking state to content-generate
  useEffect(() => {
    if (isOpen) {
      prevBasicRef.current = structuredClone(basic);
      prevAdvanceRef.current = structuredClone(advance);
    } else {
      if (prevBasicRef.current) setBasic(prevBasicRef.current);
      if (prevAdvanceRef.current) setAdvance(prevAdvanceRef.current);
      prevBasicRef.current = null;
      prevAdvanceRef.current = null;
      setIsActive(true);
      setAdditionalPrompt("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Prefill form when editing an existing schedule
  useEffect(() => {
    if (!isOpen) return;
    if (editingSchedule) {
      setIsActive(!!editingSchedule.isActive);
      
      // Find the AI model that matches the schedule's model
      const scheduleModel = aiModels.models.find(model => model.name === editingSchedule.model);
      
      setBasic({
        ...basic,
        model: editingSchedule.model,
        ratio: editingSchedule.ratio as ValidRatio,
        category: editingSchedule.category,
        designStyle: editingSchedule.designStyle,
        prompt: editingSchedule.additionalPrompt || "",
        productKnowledgeId: editingSchedule.productKnowledgeId,
        referenceImage:
          editingSchedule.referenceImages && editingSchedule.referenceImages.length > 0
            ? editingSchedule.referenceImages[0]
            : null,
        productName: getProductNameById(editingSchedule.productKnowledgeId),
      });

      // Set the selected AI model to match the schedule's model
      if (scheduleModel) {
        onSelectAiModel(scheduleModel);
      }

      // Prefill advance toggles from schedule flags
      setAdvance({
        ...advance,
        businessKnowledge: {
          ...advance.businessKnowledge,
          name: !!editingSchedule.advBusinessName,
          category: !!editingSchedule.advBusinessCategory,
          description: !!editingSchedule.advBusinessDescription,
          location: !!editingSchedule.advBusinessLocation,
          logo: !!editingSchedule.advBusinessLogo,
          uniqueSellingPoint: !!editingSchedule.advBusinessUniqueSellingPoint,
          website: !!editingSchedule.advBusinessWebsite,
          visionMission: !!editingSchedule.advBusinessVisionMission,
          colorTone: !!editingSchedule.advBusinessColorTone,
        },
        productKnowledge: {
          ...advance.productKnowledge,
          name: !!editingSchedule.advProductName,
          category: !!editingSchedule.advProductCategory,
          description: !!editingSchedule.advProductDescription,
          price: !!editingSchedule.advProductPrice,
        },
        roleKnowledge: {
          ...advance.roleKnowledge,
          hashtags: !!editingSchedule.advRoleHashtags,
        },
      });

      // Set additional prompt
      setAdditionalPrompt(editingSchedule.additionalPrompt || "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingSchedule]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{t("configureAutoGenerate")}</DialogTitle>
            <DialogDescription>
              {selectedDay !== null && selectedTime && (
                <>
                  {t("schedulingFor")} {getDayName(selectedDay)} {t("at")} {selectedTime}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Reference Libary */}
              <div className="space-y-6">
                <AutoGenerateReferencePanel />
        
              </div>

              {/* Right Column - Form and Status */}
              <div className="space-y-6">
                <AutoSelectedReferenceImage/>
              <AutoGenerateFormBasic />
              <AutoGenerateFormAdvanced />

                {/* Schedule Status */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-4">
                      {t("scheduleStatus")}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={isActive}
                        onCheckedChange={setIsActive}
                      />
                      <span className="text-sm text-muted-foreground">
                        {isActive ? t("active") : t("inactive")}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Prompt */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-4">
                      {t("additionalPrompt")}
                    </h3>
                    <TextField
                      label=""
                      value={additionalPrompt}
                      onChange={setAdditionalPrompt}
                      placeholder={t("additionalPromptPlaceholder")}
                      multiline={true}
                      rows={3}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <DialogFooterWithButton
            buttonMessage={editingSchedule ? t("updateSchedule") : t("saveSchedule")}
            onClick={handleSave}
            disabled={isLoading || !basic?.productKnowledgeId}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
