"use client";

import { Header } from "@/components/base/header";
import { Sidebar } from "@/components/sidebar";
import { cn } from "@/lib/utils";
import { useParams} from "next/navigation";
import { usePathname } from "@/i18n/routing";

const SKIP_HEADER_PATHS = [
  "/business/[businessId]/pricing/checkout",
  "/business/new-business",
];
const SKIP_SIDEBAR_PATHS = [
  "/profile",
  "/business/new-business",
  "/business/[businessId]/pricing/checkout",
  "/business",
];

export default function BusinessClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { businessId } = useParams() as { businessId: string };
  const isSkipHeader = SKIP_HEADER_PATHS.some(
    (path) => pathname.replace("[businessId]", businessId) === path
  );
  const isSkipSidebar = SKIP_SIDEBAR_PATHS.some(
    (path) => pathname.replace("[businessId]", businessId) === path
  );
  return (
    <div>
      <div className="min-h-screen bg-background flex flex-col">
        {!isSkipHeader && <Header />}
        <div
          className={cn(
            "flex flex-1",
            isSkipHeader ? "" : "mt-22",
            isSkipSidebar ? "" : "md:ml-16"
          )}
        >
          {!isSkipSidebar && <Sidebar />}
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
