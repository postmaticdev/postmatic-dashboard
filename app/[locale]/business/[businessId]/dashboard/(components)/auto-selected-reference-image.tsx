import { useAutoGenerate } from "@/contexts/auto-generate-context";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";

export const AutoSelectedReferenceImage = () => {
  const { form, isLoading, setSelectedTemplate } = useAutoGenerate();
  const t = useTranslations("generationPanel");

  if (!form?.basic?.referenceImage) return null;
  return (
    <div className=" space-y-2 " id="selected-reference-image">
      <h3 className="font-medium text-sm">{t("selectedReferenceImage")}</h3>
      <Card className="p-4">
        <div className=" flex flex-row gap-2 justify-between">
          <div className="flex flex-row gap-3">
            <div className="aspect-square w-20 h-20 bg-gray-100 rounded-lg overflow-hidden relative">
              <Image
                src={form.basic.referenceImage}
                alt={form.basic.referenceImageName || ""}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <div>
              <p className=" mb-2 line-clamp-2">{form.basic.referenceImageName}</p>
              <p className="text-sm line-clamp-1">
                publisher: {form.basic.referenceImagePublisher || "Unknown Publisher"}
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant="destructive"
              size="lg"
              className="h-20 w-20"
              onClick={() => {
                form.setBasic({
                  ...form.basic,
                  referenceImage: null,
                  referenceImageName: null,
                  referenceImagePublisher: null,
                });
                setSelectedTemplate(null);
              }}
              disabled={isLoading}
            >
              <Trash2 className="size-8" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
