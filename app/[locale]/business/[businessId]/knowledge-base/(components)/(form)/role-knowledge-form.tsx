"use client";

import { useState } from "react";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { RoleKnowledgePld } from "@/models/api/knowledge/role.type";
import { useManageKnowledge } from "@/contexts/manage-knowledge-context";
import { useTranslations } from "next-intl";

export function RoleKnowledgeForm() {
  const { formKnowledge, setFormKnowledge, errors } = useManageKnowledge();

  const updateField = (
    key: keyof RoleKnowledgePld,
    value: RoleKnowledgePld[keyof RoleKnowledgePld]
  ) => {
    setFormKnowledge({
      ...formKnowledge,
      role: { ...formKnowledge.role, [key]: value },
    });
  };

  const [currentHashtag, setCurrentHashtag] = useState("");

  const addHashtag = () => {
    if (currentHashtag.trim()) {
      let hashtag = currentHashtag.trim();
      if (hashtag?.startsWith("#")) {
        hashtag = hashtag.slice(1);
      }
      updateField("hashtags", [...formKnowledge.role.hashtags, hashtag]);
      setCurrentHashtag("");
    }
  };

  const removeHashtag = (index: number) => {
    updateField(
      "hashtags",
      formKnowledge.role.hashtags.filter((_, i) => i !== index)
    );
  };
  const r = useTranslations("roleKnowledge");

  const defaultLabels = {
    targetAudience: r("targetAudience"),
    contentTone: r("contentTone"),
    persona: r("persona"),
    hashtags: r("hashtags"),
    callToAction: r("callToAction"),
    goals: r("goals"),
  };

  const defaultPlaceholders = {
    targetAudience: r("targetAudiencePlaceholder"),
    contentTone: r("contentTonePlaceholder"),
    persona: r("personaPlaceholder"),
    hashtagInput: r("hashtagsPlaceholder"),
    callToAction: r("callToActionPlaceholder"),
    goals: r("goalsPlaceholder"),
  };

  const finalLabels = { ...defaultLabels };
  const finalPlaceholders = { ...defaultPlaceholders };

  return (
    <div className="space-y-6">
      <TextField
        label={finalLabels.targetAudience}
        value={formKnowledge.role.targetAudience}
        onChange={(value) => updateField("targetAudience", value)}
        placeholder={finalPlaceholders.targetAudience}
        error={errors.role.targetAudience}
      />

      <TextField
        label={finalLabels.contentTone}
        value={formKnowledge.role.tone}
        onChange={(value) => updateField("tone", value)}
        placeholder={finalPlaceholders.contentTone}
        error={errors.role.tone}
      />

      <TextField
        label={finalLabels.persona}
        value={formKnowledge.role.audiencePersona}
        onChange={(value) => updateField("audiencePersona", value)}
        placeholder={finalPlaceholders.persona}
        error={errors.role.audiencePersona}
      />

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {finalLabels.hashtags}
        </label>
        <div className="flex gap-2 mt-2">
          <Input
            value={currentHashtag}
            onChange={(e) => setCurrentHashtag(e.target.value)}
            placeholder={finalPlaceholders.hashtagInput}
            className={`flex-1 bg-background-secondary ${
              errors.role.hashtags ? "border-red-500" : ""
            }`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " " || e.key === ",") {
                e.preventDefault();
                addHashtag();
              }
            }}
          />
          <Button type="button" onClick={addHashtag} className="px-3">
            <Plus className="w-4 h-4" color="white" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formKnowledge.role.hashtags.map((hashtag, index) => (
            <span
              key={index}
              className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-1"
            >
              #{hashtag}
              <button
                type="button"
                onClick={() => removeHashtag(index)}
                className="text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        {errors.role.hashtags && (
          <p className="text-sm text-red-500">{errors.role.hashtags}</p>
        )}
      </div>

      <TextField
        label={finalLabels.callToAction}
        value={formKnowledge.role.callToAction}
        onChange={(value) => updateField("callToAction", value)}
        placeholder={finalPlaceholders.callToAction}
        error={errors.role.callToAction}
      />

      <TextField
        label={finalLabels.goals}
        value={formKnowledge.role.goals}
        onChange={(value) => updateField("goals", value)}
        placeholder={finalPlaceholders.goals}
        error={errors.role.goals}
      />
    </div>
  );
}
