"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Info } from "lucide-react";
import { useTranslations } from "next-intl";

interface BusinessCategoryDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  onFocus?: () => void;
}


export function BusinessCategoryDropdown({
  value,
  onChange,
  placeholder = "Pilih kategori bisnis",
  label = "Kategori Bisnis",
  error,
  onFocus,
}: BusinessCategoryDropdownProps) {
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const t = useTranslations("businessCategory");
  const [otherValue, setOtherValue] = useState("");
  const BUSINESS_CATEGORIES = [
    t("foodAndDrink"),
    t("retailAndEcommerce"),
    t("technologyAndSoftware"),
    t("healthAndPharmacy"),
    t("financialAndFinance"),
    t("realEstateAndProperty"),
    t("constructionAndInfrastructure"),
    t("transportationAndLogistics"),
    t("travelAndHospitality"),
    t("energyAndMining"),
    t("educationAndTraining"),
    t("mediaAndEntertainment"),
    t("agricultureAndHunting"),
    t("fashionAndClothing"),
    t("consultingAndProfessionalServices"),
    t("other"),
  ];

  const handleCategoryChange = (selectedValue: string) => {
    if (selectedValue === t("other")) {
      setIsOtherSelected(true);
      onChange(otherValue || "");
    } else {
      setIsOtherSelected(false);
      setOtherValue("");
      onChange(selectedValue);
    }
  };

  const handleOtherInputChange = (inputValue: string) => {
    setOtherValue(inputValue);
    onChange(inputValue);
  };

  // Check if current value is in the predefined categories
  const isCurrentValueInCategories = BUSINESS_CATEGORIES.includes(value);

  // Determine if we should show "Lainnya" option
  const shouldShowLainnya = value && !isCurrentValueInCategories;

  return (
    <div className="space-y-1 ">
      <div className="flex flex-col md:flex-row w-full justify-between items-center gap-2">
        <div className="space-y-2 w-full">
          <Label htmlFor="category">{label}</Label>
          <Select
            value={shouldShowLainnya ? t("other") : value || ""}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger
              className={error ? "border-red-500 focus:border-red-500" : ""}
              onFocus={onFocus}
            >
              <SelectValue placeholder={isOtherSelected || shouldShowLainnya ? t("other") : placeholder} />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(isOtherSelected || shouldShowLainnya) && (
          <div className="space-y-2 w-full">
            <Label htmlFor="category">{t("enterOtherCategory")}</Label>
            <Input
              id="other-category"
              value={shouldShowLainnya ? value : otherValue}
              onChange={(e) => handleOtherInputChange(e.target.value)}
              placeholder={t("enterBusinessCategoryPlaceholder")}
              onFocus={onFocus}
              className={`w-full ${
                error ? "border-red-500 focus:border-red-500" : ""
              }`}
            />
          </div>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-1">
          <Info className="w-4 h-4 text-red-500" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}
    </div>
  );
}
