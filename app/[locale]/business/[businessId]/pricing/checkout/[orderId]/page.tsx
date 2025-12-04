"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { OrderSummary } from "@/app/[locale]/business/[businessId]/pricing/checkout/(components)/order-summary";
import { PaymentConfirmation } from "@/app/[locale]/business/[businessId]/pricing/checkout/(components)/payment-confirmation";
import { PaymentSuccess } from "@/app/[locale]/business/[businessId]/pricing/checkout/(components)/payment-success";
import { CheckoutFooter } from "@/app/[locale]/business/[businessId]/pricing/checkout/(components)/checkout-footer";
import { useCheckout } from "@/contexts/checkout-context";
import { useBusinessPurchaseGetDetail } from "@/services/purchase.api";
import { useTranslations } from "next-intl";

export default function CheckoutOrderPage() {
  const { businessId, orderId } = useParams() as {
    businessId: string;
    orderId: string;
  };
  const t = useTranslations();
  const { setCheckoutResult } = useCheckout();
  const { data, isLoading, isError } = useBusinessPurchaseGetDetail(
    businessId,
    orderId
  );
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  useEffect(() => {
    const purchase = data?.data?.data;
    if (purchase) {
      setCheckoutResult((prev) => {
        const merged = {
          ...prev,
          ...purchase,
        } as typeof purchase;
        if (!merged.expiredAt && prev?.expiredAt) {
          (merged as any).expiredAt = prev.expiredAt;
        }
        return merged;
      });
      setShowPaymentSuccess(purchase.status === "Success");
    }
  }, [data, setCheckoutResult]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        {t("toast.validation.processing")}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        {t("toast.validation.invalidPromoCode")}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <OrderSummary variant="sidebar" />

      <div className="flex-1 p-3 sm:p-4 lg:p-12 max-w-[800px] mx-auto">
        <OrderSummary variant="mobile" />

        <Card className="border border-border">
          <CardContent className="p-3 sm:p-4 lg:p-8">
            {showPaymentSuccess ? (
              <PaymentSuccess />
            ) : (
              <PaymentConfirmation
                setShowPaymentSuccess={setShowPaymentSuccess}
              />
            )}
          </CardContent>
        </Card>

        <CheckoutFooter />
      </div>
    </div>
  );
}
