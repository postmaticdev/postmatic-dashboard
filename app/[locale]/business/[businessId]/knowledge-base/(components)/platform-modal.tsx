"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooterWithButton,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConnectedPlatformForm } from "@/app/[locale]/business/[businessId]/knowledge-base/(components)/(form)/connected-platform-form";
import { Link } from "@/i18n/routing";
import { LANDING_PAGE_URL } from "@/constants";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

interface PlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PlatformModal({ isOpen, onClose }: PlatformModalProps) {
  const m = useTranslations("modal");
  const params = useParams();
  const locale = params.locale;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full">
        <DialogHeader>
          <DialogTitle>{m("managePlatformSocialMedia")}</DialogTitle>
          <DialogDescription>
            {m("managePlatformSocialMediaDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <ConnectedPlatformForm />
        </div>
        <DialogFooterWithButton
          buttonMessage={m("close")}
          onClick={onClose}
          className="items-center"
        >
          <Link
            className="text-sm flex items-center gap-1"
            href={
              LANDING_PAGE_URL + "/" + locale + "/faq/how-to-connect-platform"
            }
            target="_blank"
            prefetch={false}
          >
            <span className="text-muted-foreground">
              {m("cannotConnectPlatform")}
            </span>
            <span className="text-primary">{m("clickHere")}</span>
          </Link>
        </DialogFooterWithButton>
      </DialogContent>
    </Dialog>
  );
}
