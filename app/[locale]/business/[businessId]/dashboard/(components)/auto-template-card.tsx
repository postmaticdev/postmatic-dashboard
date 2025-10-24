"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye } from "lucide-react";
import Image from "next/image";
import {
  Template,
  useAutoGenerate,
} from "@/contexts/auto-generate-context";
import { useTranslations } from "next-intl";
import { DEFAULT_USER_AVATAR } from "@/constants";

// {/* Content */}
interface TemplateCardProps {
  item: Template;
  onDetail: (item: Template | null) => void;
}

export const AutoTemplateCard = ({ item, onDetail }: TemplateCardProps) => {
  const { 
    onSelectReferenceImage, 
    isLoading,
    selectedTemplate
  } = useAutoGenerate();

  const t = useTranslations("templateCard");
  
  const isSelected = selectedTemplate?.id === item.id;
  
  return (
    <Card
      key={item.id}
      className={`p-3 group transition-all duration-300 hover:scale-105 hover:shadow-lg ${
        isSelected ? "border-primary border-2" : ""
      }`}
    >
      <div className="relative">
        <div className="relative aspect-square rounded-lg overflow-hidden">
          {/* Business Image Content */}

          <Image
            src={item.imageUrl}
            alt="Placeholder Colorful"
            fill
            className="object-cover  transform-gpu transition-transform duration-500 ease-out will-change-transform group-hover:scale-110"
            priority
          />
        </div>
        <div className="absolute top-2 right-2">
          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
            {item.categories && item.categories.length > 0 ? (
              item.categories.length === 1 
                ? item.categories[0]
                : `${item.categories[0]} +${item.categories.length - 1}`
            ) : ""}
          </span>
        </div>
        <div className="absolute bottom-2 right-2">
          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
            {item.productCategories}
          </span>
        </div>
      </div>

      <div className="space-y-2 -mt-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Image
              src={item.publisher?.image || DEFAULT_USER_AVATAR}
              alt={item.publisher?.name || "image"}
              width={200}
              height={200}
              className="rounded-full w-8 h-8"
            />

            <div>
              <h3 className="font-medium text-sm line-clamp-2">{item.name}</h3>
              <p className="hidden sm:block text-xs ">Publisher: {item.publisher?.name}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onDetail(item)}
                className="cursor-pointer"
              >
                <Eye className="mr-2 h-4 w-4" />
                {t("detail")}
              </DropdownMenuItem>
              
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
          <p className="block sm:hidden text-xs ">Publisher: {item.publisher?.name}</p>

        <Button
          className="w-full my-0 sm:my-3 bg-blue-500 hover:bg-blue-600 text-white text-sm"
          disabled={isLoading || isSelected}
          onClick={() => {
            if (isLoading) return;
            onSelectReferenceImage(item.imageUrl, item.name, item);
          }}
        >
          {isSelected ? t("selected") : t("use")}
        </Button>
      </div>
    </Card>
  );
};
