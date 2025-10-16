"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { showToast } from "@/helper/show-toast";
import { useTranslations } from "next-intl";
import { useAuthProfileGetProfile } from "@/services/auth.api";
import { useState } from "react";

export function DetailInformation() {
  const { data: profileData } = useAuthProfileGetProfile();
  const profile = profileData?.data?.data;
  const [isCopied, setIsCopied] = useState(false);
  const tToast = useTranslations();

  const handleCopyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(refferalCodeInfo.code);
      setIsCopied(true);
      showToast("success", tToast("toast.profile.referralCodeCopied"), tToast);
      
      // Reset icon back to copy after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error(err);
      showToast("error", tToast("toast.profile.failedToCopyReferral"), tToast);
    }
  };

  // TODO: Get invited users, (belum ada di API, belum fix logic)
  const refferalCodeInfo = {
    code: profile?.discountCodes?.[0]?.code || "Belum ada kode referral",
    invitedUsers: profile?.discountCodes?.[0]?._count.discountUsages || 0,
    proUsers: profile?.discountCodes?.[0]?._count.discountUsages || 0,
  };

  // TODO: Get creator info, (belum ada di API, belum fix logic)
  const creatorInfo = {
    totalContent: "-",
    sales: "-",
    earnings: "-",
  };

  const t = useTranslations("detailInformation");

  return (
    <Card className="h-fit relative">
      <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
        {t("soon")}
      </div>
      <CardContent className="py-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">
          {t("title")}
        </h2>

        <div className="space-y-6">
          {/* Referral Information */}
          <div className="flex flex-row flex-wrap space-y-2 items-center justify-between bg-background-secondary p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground ">
                  {t("referralCode")}
                </p>
                <p className="font-semibold text-foreground">
                  {profile?.discountCodes?.[0]?.code ||
                    t("noReferralCode")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyReferralCode}
                className="p-2 h-8 w-8 hover:bg-background"
                disabled={!refferalCodeInfo.code || refferalCodeInfo.code === t("noReferralCode")}
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <div className="">
              <p className="text-xs font-medium text-muted-foreground ">
                {t("invitedUsers")}
              </p>
              <p className="font-semibold text-foreground">
                {refferalCodeInfo.invitedUsers}
                {/* TODO: Get invited users, (belum ada di API) */}
              </p>
            </div>
            <div className="">
              <p className="text-xs font-medium text-muted-foreground ">
                {t("proUsers")}
              </p>
              <p className="font-semibold text-foreground">
                {refferalCodeInfo.proUsers}
              </p>
            </div>

            {/* <Link href="/profile/affiliator" prefetch={false}> */}
              <Button
                variant="default"
                disabled={true}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                {t("withdraw")}
              </Button>
            {/* </Link> */}
          </div>

          {/* Content and Sales Information */}
          <div className="flex flex-row flex-wrap space-y-2 items-center justify-between bg-background-secondary p-4 rounded-lg">
            <div className="">
              <p className="text-xs font-medium text-muted-foreground ">
                {t("totalContent")}
              </p>
              <p className="font-semibold text-foreground">
                {creatorInfo.totalContent}
              </p>
            </div>
            <div className="">
              <p className="text-xs font-medium text-muted-foreground ">
                {t("sales")}
              </p>
              <p className="font-semibold text-foreground">
                {creatorInfo.sales}
              </p>
            </div>
            <div className="">
              <p className="text-xs font-medium text-muted-foreground ">
                {t("earnings")}
              </p>
              <p className="font-semibold text-foreground">
                {creatorInfo.earnings}
              </p>
            </div>

            {/* <Link href="/profile/creator" prefetch={false}> */}
              <Button
                variant="default"
                disabled={true}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                {t("withdraw")}
              </Button>
            {/* </Link> */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
