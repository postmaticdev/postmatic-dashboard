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
import { Info } from "lucide-react";
import { useTemplateProductCategories } from "@/services/template-category.api";
import { Skeleton } from "@/components/ui/skeleton";

interface CreatorProductCategoryDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  onFocus?: () => void;
}

export function CreatorProductCategoryDropdown({
  value,
  onChange,
  placeholder = "Pilih kategori produk",
  label = "Kategori Produk",
  error,
  onFocus,
}: CreatorProductCategoryDropdownProps) {
  const { data: categoriesResponse, isLoading } = useTemplateProductCategories();
  const categories = categoriesResponse?.data?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <Select
        value={value}
        onValueChange={onChange}
      >
        <SelectTrigger
           className={`w-full dark:bg-input/30 ${error ? 'border-red-500 focus:border-red-500' : ''}`}
          onFocus={onFocus}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.indonesianName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <div className="flex items-center gap-1">
          <Info className="w-4 h-4 text-red-500" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}
    </div>
  );
}
